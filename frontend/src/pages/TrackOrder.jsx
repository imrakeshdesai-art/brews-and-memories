import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import useSEO from '../hooks/useSEO';

const POLL_INTERVAL_MS = 12000;

export default function TrackOrder() {
  const { orderId } = useParams();
  useSEO({
    title: 'Live Order Tracking',
    description: 'Track the live preparation status of your handcrafted order at The Moras Cafe.',
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // 'not_found' | 'rate_limited' | 'network' | 'no_token'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isPollingActive, setIsPollingActive] = useState(true);

  // Persistent token storage: check hash fragment first, then fallback to sessionStorage
  const tokenRef = useRef(null);
  const abortControllerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // 1. Initialize and securely extract token from hash fragment on mount
  useEffect(() => {
    let token = null;

    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const match = hash.match(/token=([a-f0-9]{32,64})/i);
      if (match && match[1]) {
        token = match[1];
        // Cache token in sessionStorage so refreshes within the same tab work without the hash
        try {
          sessionStorage.setItem(`moras_track_${orderId}`, token);
        } catch {
          // ignore storage quota / sandbox errors
        }
        // Scrub the token immediately from the visible address bar
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        // Fallback to cached token in sessionStorage
        try {
          token = sessionStorage.getItem(`moras_track_${orderId}`);
        } catch {
          token = null;
        }
      }
    }

    if (token) {
      tokenRef.current = token;
    } else {
      setErrorStatus('no_token');
      setLoading(false);
      setIsPollingActive(false);
    }
  }, [orderId]);

  // 2. Fetch order status function
  const fetchOrderStatus = useCallback(async (isInitial = false) => {
    const token = tokenRef.current;
    if (!token || !orderId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await api.get(`/orders/track/${orderId}`, {
        headers: {
          'X-Tracking-Token': token,
        },
        signal: abortControllerRef.current.signal,
      });

      const data = response.data;
      setOrder(data);
      setErrorStatus(null);
      setLastSyncTime(new Date());

      // If status is completed, stop further polling
      if (data.status === 'completed') {
        setIsPollingActive(false);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return; // normal abort on component cleanup or re-poll
      }

      const status = err.response?.status;
      if (status === 404) {
        setErrorStatus('not_found');
        setIsPollingActive(false);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      } else if (status === 429) {
        setErrorStatus('rate_limited');
        // Pause polling momentarily on rate limit
        setIsPollingActive(false);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      } else {
        // If initial load fails with connection error
        if (isInitial) {
          setErrorStatus('network');
        }
        // Background polling transient errors are tolerated gracefully (Render cold starts)
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [orderId]);

  // 3. Polling loop management with AbortController cleanup
  useEffect(() => {
    if (!tokenRef.current && errorStatus === 'no_token') return;

    // Trigger initial fetch
    fetchOrderStatus(true);

    // Setup polling interval (every 12 seconds)
    pollTimerRef.current = setInterval(() => {
      fetchOrderStatus(false);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrderStatus, errorStatus]);

  // Formatter helpers
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getStepState = (targetStatus) => {
    if (!order) return 'pending';
    const status = order.status;
    if (status === 'completed') return 'completed';
    if (targetStatus === 'pending') return 'completed'; // Order Received is always completed once placed
    if (targetStatus === 'preparing') {
      return status === 'preparing' ? 'active' : 'upcoming';
    }
    if (targetStatus === 'completed') {
      return status === 'completed' ? 'active' : 'upcoming';
    }
    return 'upcoming';
  };

  return (
    <div className="track-order-page-wrapper">
      <div className="track-order-container">
        {/* Header */}
        <header className="track-order-header">
          <span className="track-badge">Live Kitchen Status</span>
          <h1 className="track-title">Order Status</h1>
          <p className="track-subtitle">
            Keep this screen open to view real-time updates directly from our baristas and kitchen team.
          </p>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="track-loading-card">
            <div className="track-spinner"></div>
            <p>Connecting to The Moras Cafe kitchen...</p>
          </div>
        )}

        {/* Error States */}
        {!loading && errorStatus && (
          <div className="track-error-card">
            <div className="track-error-icon">
              {errorStatus === 'rate_limited' ? '⏳' : '🔍'}
            </div>
            <h3 className="track-error-title">
              {errorStatus === 'no_token' && 'Verification Link Required'}
              {errorStatus === 'not_found' && 'Order Not Found'}
              {errorStatus === 'rate_limited' && 'Too Many Requests'}
              {errorStatus === 'network' && 'Connection Issue'}
            </h3>
            <p className="track-error-msg">
              {errorStatus === 'no_token' &&
                'This tracking URL does not contain an authentication token. Please use the link on your checkout confirmation page or confirmation email.'}
              {errorStatus === 'not_found' &&
                'We could not find an active order matching this ID and security token. If you recently placed an order, please recheck your confirmation email.'}
              {errorStatus === 'rate_limited' &&
                'Status checking is temporarily paused to protect server performance. Please wait a minute and refresh this page.'}
              {errorStatus === 'network' &&
                'Unable to reach the server. The cafe server may be warming up. Please refresh in a few moments.'}
            </p>
            <div className="track-error-actions">
              <Link to="/menu" className="btn-primary" style={{ padding: '10px 20px' }}>
                Browse Cafe Menu
              </Link>
            </div>
          </div>
        )}

        {/* Successful Order Details */}
        {!loading && !errorStatus && order && (
          <div className="track-main-content">
            {/* Live Status Pill & Polling Status */}
            <div className="track-status-banner">
              <div className="track-status-summary">
                <span className={`status-pill pill-${order.status}`}>
                  {order.status === 'pending' && '🟡 Order Placed'}
                  {order.status === 'preparing' && '🔥 In the Kitchen'}
                  {order.status === 'completed' && '🎉 Ready to Serve!'}
                </span>
                <span className="track-pulse-indicator">
                  {isPollingActive ? (
                    <>
                      <span className="pulse-dot"></span>
                      <span>Live sync active</span>
                    </>
                  ) : (
                    <span>✅ Tracking completed</span>
                  )}
                </span>
              </div>
              <p className="track-status-desc">
                {order.status === 'pending' &&
                  'Your order has been received and queued. Our staff will begin preparation shortly.'}
                {order.status === 'preparing' &&
                  'Our chefs and baristas are currently crafting your items fresh to order.'}
                {order.status === 'completed' &&
                  'Your order is freshly prepared and ready to serve! Please collect or wait at your table.'}
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="track-stepper-card">
              <div className="track-stepper">
                {/* Step 1: Received */}
                <div className={`stepper-step ${getStepState('pending')}`}>
                  <div className="step-icon-wrap">
                    <span className="step-icon">📋</span>
                  </div>
                  <div className="step-label">Received</div>
                  <div className="step-time">{formatTime(order.createdAt)}</div>
                </div>

                <div className={`stepper-line ${order.status === 'preparing' || order.status === 'completed' ? 'filled' : ''}`}></div>

                {/* Step 2: Preparing */}
                <div className={`stepper-step ${getStepState('preparing')}`}>
                  <div className="step-icon-wrap">
                    <span className="step-icon">👨‍🍳</span>
                  </div>
                  <div className="step-label">In Kitchen</div>
                  <div className="step-time">
                    {order.status === 'preparing' || order.status === 'completed' ? 'In Progress' : 'Pending'}
                  </div>
                </div>

                <div className={`stepper-line ${order.status === 'completed' ? 'filled' : ''}`}></div>

                {/* Step 3: Ready */}
                <div className={`stepper-step ${getStepState('completed')}`}>
                  <div className="step-icon-wrap">
                    <span className="step-icon">☕</span>
                  </div>
                  <div className="step-label">Ready to Serve</div>
                  <div className="step-time">
                    {order.status === 'completed' ? formatTime(order.updatedAt) : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details & Summary Card */}
            <div className="track-info-card">
              <div className="track-info-row">
                <span className="info-label">Order Reference:</span>
                <span className="info-value">#{order.orderId || orderId}</span>
              </div>
              <div className="track-info-row">
                <span className="info-label">Table / Location:</span>
                <span className="info-value highlight">{order.table || 'In-House'}</span>
              </div>
              <div className="track-info-row">
                <span className="info-label">Placed At:</span>
                <span className="info-value">{formatTime(order.createdAt)}</span>
              </div>
              {lastSyncTime && (
                <div className="track-info-row subtle">
                  <span className="info-label">Last checked:</span>
                  <span className="info-value">{lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Handcrafted Items List */}
            {order.items && order.items.length > 0 && (
              <div className="track-items-card">
                <h3 className="track-items-title">Items in Preparation</h3>
                <div className="track-items-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="track-item-row">
                      <div className="track-item-main">
                        <span className="track-item-name">{item.name}</span>
                        {item.variant && (
                          <span className="track-item-variant">
                            ({item.variant === 'S' ? 'Small' : item.variant === 'M' ? 'Medium' : item.variant === 'L' ? 'Large' : item.variant})
                          </span>
                        )}
                      </div>
                      <span className="track-item-qty">Qty: {item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful Actions */}
            <div className="track-actions-section">
              <Link to="/menu" className="btn-secondary track-btn">
                📖 Browse More Items
              </Link>
              <Link to="/rate" className="btn-primary track-btn" style={{ background: 'linear-gradient(135deg, #0f3d3e 0%, #1a5c5e 100%)' }}>
                ⭐ Rate Us on Google
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
