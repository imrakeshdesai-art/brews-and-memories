import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import {
  saveAdminToken,
  clearAdminToken,
  getAdminToken,
} from '../services/auth';
import { useToast } from '../components/ToastProvider';

function getRoleFromToken(tok) {
  if (!tok) return null;
  try {
    const payload = JSON.parse(atob(tok.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}

const playNewOrderChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);
    
    // Second tone (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

function Admin() {
  const toast = useToast();

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  // IMPORTANT
  const [token, setToken] = useState(getAdminToken());

  const [authChecked, setAuthChecked] = useState(false);

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);
  const [billEmailInput, setBillEmailInput] = useState('');
  const [isSendingBillEmail, setIsSendingBillEmail] = useState(false);
  const [selectedBirthdayBill, setSelectedBirthdayBill] = useState(null);
  const [birthdayFoodTotal, setBirthdayFoodTotal] = useState('');

  const handlePrintBill = () => {
    document.body.classList.add('printing-bill');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-bill');
    }, 500);
  };

  const handleSendBillEmail = async (orderId, targetEmail) => {
    if (!targetEmail || !targetEmail.trim()) {
      toast('Please enter the customer email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      toast('Please enter a valid email address format');
      return;
    }
    setIsSendingBillEmail(true);
    try {
      const res = await api.post(`/orders/${orderId}/send-bill`, { email: targetEmail.trim() });
      toast(res.data.message || 'Bill receipt sent to customer email successfully!');
      setIsSendingBillEmail(false);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, email: targetEmail.trim() } : o));
    } catch (err) {
      setIsSendingBillEmail(false);
      toast(err.response?.data?.message || 'Failed to send bill email');
    }
  };

  // ================= FETCH ORDERS =================
  const fetchOrders = async () => {

    setLoading(true);
    setError('');

    try {

      const res = await api.get('/orders');

      setOrders(res.data);

    } catch (err) {

      console.error('FETCH ORDERS ERROR:', err);

      // Unauthorized
      if (err.response?.status === 401) {

        logout();

        setError('Session expired. Please login again.');

        return;
      }

      // Forbidden
      if (err.response?.status === 403) {

        setError('Access denied.');

        return;
      }

      // Network/CORS
      if (!err.response) {

        setError('Network or CORS error.');

        return;
      }

      setError(
        err.response?.data?.message ||
        'Could not fetch orders'
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH RESERVATIONS =================
  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error('FETCH RESERVATIONS ERROR:', err);
    }
  };

  const role = useMemo(() => getRoleFromToken(token), [token]);
  const prevPendingCountRef = useRef(0);

  // ================= MENU AVAILABILITY (INVENTORY) STATE =================
  const [catalogItems, setCatalogItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [availabilityCategory, setAvailabilityCategory] = useState('All');
  const [showSoldOutOnly, setShowSoldOutOnly] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  const fetchCatalogAvailability = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.get('/menu/admin/availability');
      if (res.data?.items) {
        setCatalogItems(res.data.items);
      }
    } catch (err) {
      toast('Failed to load menu availability: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingCatalog(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'inventory' && role === 'admin') {
      fetchCatalogAvailability();
    }
  }, [activeTab, role, fetchCatalogAvailability]);

  const handleToggleAvailability = async (item) => {
    const newStatus = !item.isAvailable;
    setTogglingKey(item.itemKey);

    // Optimistic UI update
    setCatalogItems((prev) =>
      prev.map((it) => (it.itemKey === item.itemKey ? { ...it, isAvailable: newStatus } : it))
    );

    try {
      await api.patch(`/menu/admin/availability/${encodeURIComponent(item.itemKey)}`, {
        isAvailable: newStatus,
      });
      toast(`${newStatus ? '✅' : '⚠️'} "${item.name}" is now ${newStatus ? 'Available' : 'Sold Out'}`);
    } catch (err) {
      // Rollback on error
      setCatalogItems((prev) =>
        prev.map((it) => (it.itemKey === item.itemKey ? { ...it, isAvailable: !newStatus } : it))
      );
      toast('Failed to update availability: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingKey(null);
    }
  };

  useEffect(() => {
    const currentPendingCount = orders.filter((o) => o.status === 'pending').length;
    if (currentPendingCount > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
      playNewOrderChime();
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [orders]);

  // ================= AUTH + LOAD DATA =================
  useEffect(() => {
    if (!token) {
      setAuthChecked(true);
      return;
    }

    const loadData = async () => {
      const userRole = getRoleFromToken(token);
      if (userRole === 'kitchen') {
        await fetchOrders();
      } else {
        await Promise.all([fetchOrders(), fetchReservations()]);
      }
      setAuthChecked(true);
    };

    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // ================= LOGIN =================
  const handleLogin = async (e) => {

    e.preventDefault();

    setError('');

    try {

      const res = await api.post('/auth/login', {
        user,
        pass,
      });

      const receivedToken = res.data.token;

      if (!receivedToken) {
        throw new Error('Token not received');
      }

      // Save token
      saveAdminToken(receivedToken);

      // Update state
      setToken(receivedToken);

      toast('Logged in successfully ✅');

    } catch (err) {
      if (err.response?.status === 429) {
        setError(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Too many login attempts, please try again later.'
        );
      } else {
        setError(
          (typeof err.response?.data === 'string' && err.response.data.length < 150 ? err.response.data : null) ||
          err.response?.data?.message ||
          'Invalid credentials'
        );
      }
    }
  };

  // ================= LOGOUT =================
  const logout = () => {

    clearAdminToken();

    setToken(null);

    setOrders([]);

    setPass('');

    toast('Logged out');
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, status) => {

    try {

      await api.patch(`/orders/${id}`, {
        status,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id
            ? { ...o, status }
            : o
        )
      );

      toast(`Status updated to: ${status}`);

    } catch (err) {
      toast(
        err.response?.data?.message ||
        'Update failed'
      );
    }
  };

  // ================= UPDATE RESERVATION STATUS =================
  const updateReservationStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}`, {
        status,
      });
      setReservations((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status }
            : r
        )
      );
      toast(`Reservation status updated to: ${status}`);
    } catch (err) {
      toast(
        err.response?.data?.message ||
        'Update failed'
      );
    }
  };

  // ================= RE-SEND RESERVATION EMAIL =================
  const resendReservationEmail = async (id, email) => {
    try {
      toast(`Sending confirmation email to ${email}...`);
      const res = await api.post(`/reservations/${id}/resend-email`);
      toast(res.data?.message || 'Confirmation email sent!');
      setReservations((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, confirmationEmailSent: true } : r
        )
      );
    } catch (err) {
      toast(err.response?.data?.message || 'Could not send email');
    }
  };

  // ================= STATS =================
  const stats = useMemo(() => ({
    totalRevenue: orders.reduce(
      (s, o) => s + o.total,
      0
    ),

    pending: orders.filter(
      (o) => o.status === 'pending'
    ).length,

    preparing: orders.filter(
      (o) => o.status === 'preparing'
    ).length,

    completed: orders.filter(
      (o) => o.status === 'completed'
    ).length,

    count: orders.length,

  }), [orders]);

  // ================= LOADING =================
  if (!authChecked) {

    return (
      <section className="section admin-panel">
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            fontSize: '1.2rem',
            color: 'var(--text-light)',
          }}
        >
          Loading dashboard...
        </div>
      </section>
    );
  }

  // ================= KITCHEN DISPLAY SYSTEM (KDS) =================
  const renderKDSOrderCard = (order, actionType) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
    const getElapsedColor = () => {
      if (order.status === 'completed') return 'var(--text-light)';
      if (elapsedMinutes >= 15) return 'var(--red)';
      if (elapsedMinutes >= 8) return '#d97706';
      return 'var(--green)';
    };

    return (
      <div key={order._id} style={{ border: '2px solid var(--cream-dark)', borderRadius: 12, padding: 16, background: 'var(--cream-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>📍 {order.address}</span>
          <span style={{ fontSize: '0.78rem', color: getElapsedColor(), fontWeight: 800 }}>
            {order.status === 'completed' ? 'Ready' : `⏳ ${elapsedMinutes}m ago`}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{item.qty}x</strong> {item.name}
                {item.variant && <small style={{ display: 'block', color: 'var(--text-light)', marginLeft: 22 }}>({item.variant})</small>}
              </span>
            </div>
          ))}
        </div>

        {order.payment === 'counter' && (
          <div style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.15)', color: '#b45309', padding: '4px 8px', borderRadius: 4, fontWeight: 700, alignSelf: 'flex-start' }}>
            💵 Pay at Counter
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
            Order: #{order._id.slice(-5).toUpperCase()} ({order.name})
          </span>
          {actionType === 'start' && (
            <button className="btn-primary" type="button" onClick={() => updateStatus(order._id, 'preparing')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--green)', border: 'none', color: '#fff', fontWeight: 800 }}>
              🍳 Start Cooking
            </button>
          )}
          {actionType === 'ready' && (
            <button className="btn-primary" type="button" onClick={() => updateStatus(order._id, 'completed')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--red)', border: 'none', color: '#fff', fontWeight: 800 }}>
              🔔 Mark as Ready
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderKitchenKDS = () => {
    const pendingOrders = orders.filter(o => o.status === 'pending').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const preparingOrders = orders.filter(o => o.status === 'preparing').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const completedOrders = orders.filter(o => o.status === 'completed').slice(0, 10);

    return (
      <div className="kds-dashboard" style={{ padding: '0 4%', color: 'var(--text)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, borderBottom: '2px solid var(--cream-dark)', paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: 0 }}>🍳 Kitchen Live Screen</h2>
            <p style={{ color: 'var(--text-light)', margin: '4px 0 0', fontSize: '0.9rem' }}>Real-time Kitchen Display System (KDS)</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-outline" type="button" onClick={fetchOrders} disabled={loading} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🔄 {loading ? 'Syncing...' : 'Sync Orders'}
            </button>
            <button className="btn-primary" type="button" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--red)', color: '#fff' }}>
              🚪 Logout
            </button>
          </div>
        </header>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="kds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* COLUMN 1: PENDING ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#b45309', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📥 New Orders</span>
              <span className="badge" style={{ background: '#b45309', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{pendingOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No pending orders</div>
              ) : (
                pendingOrders.map(order => renderKDSOrderCard(order, 'start'))
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#c2410c', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔥 In Prep</span>
              <span className="badge" style={{ background: '#c2410c', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{preparingOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {preparingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No orders in preparation</div>
              ) : (
                preparingOrders.map(order => renderKDSOrderCard(order, 'ready'))
              )}
            </div>
          </div>

          {/* COLUMN 3: COMPLETED ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#15803d', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✅ Recently Ready</span>
              <span className="badge" style={{ background: '#15803d', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{completedOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {completedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No recently ready orders</div>
              ) : (
                completedOrders.map(order => renderKDSOrderCard(order, 'done'))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= LOGIN UI =================
  if (!token) {

    return (
      <section className="section admin-panel">

        <div className="admin-login">

          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: 8,
              }}
            >
              🔐
            </div>

            <h2 className="admin-login-title">
              Staff Login
            </h2>

            <p
              style={{
                color: 'var(--text-light)',
                fontSize: '0.9rem',
              }}
            >
              The Moras Cafe Staff Portal
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >

            <div className="form-group">

              <label htmlFor="admin-user">
                Staff Email
              </label>

              <input
                id="admin-user"
                type="email"
                value={user}
                onChange={(e) =>
                  setUser(e.target.value)
                }
                placeholder="staff@example.com"
                required
                autoComplete="email"
              />

            </div>

            <div className="form-group">

              <label htmlFor="admin-pass">
                Password
              </label>

              <input
                id="admin-pass"
                type="password"
                value={pass}
                onChange={(e) =>
                  setPass(e.target.value)
                }
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />

            </div>

            {error && (

              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                }}
              >
                ⚠️ {error}
              </div>

            )}

            <button
              className="btn-primary"
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: 8,
              }}
            >
              Login to Dashboard
            </button>

          </form>

        </div>

      </section>
    );
  }

  if (role === 'kitchen') {
    return (
      <section className="section admin-panel" style={{ padding: '100px 0 40px' }}>
        {renderKitchenKDS()}
      </section>
    );
  }

  // ================= DASHBOARD =================
  return (
    <section className="section admin-panel">

      <div className="admin-dashboard">

        <div className="admin-header">

          <h2>📊 Orders Dashboard</h2>

          <button
            className="btn-outline"
            onClick={logout}
            style={{
              color: 'var(--red)',
              borderColor: 'var(--red)',
              padding: '8px 20px',
            }}
          >
            Sign Out
          </button>

        </div>

        <div style={{ display: 'flex', gap: 16, borderBottom: '2px solid var(--cream-dark)', marginBottom: 24, paddingBottom: 4 }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: activeTab === 'orders' ? 'var(--green)' : 'var(--text-light)',
              borderBottom: activeTab === 'orders' ? '3px solid var(--green)' : 'none',
              cursor: 'pointer'
            }}
          >
            📋 Orders Management
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: activeTab === 'reservations' ? 'var(--green)' : 'var(--text-light)',
              borderBottom: activeTab === 'reservations' ? '3px solid var(--green)' : 'none',
              cursor: 'pointer'
            }}
          >
            🎂 Birthday Bookings
          </button>
          <button 
            onClick={() => setActiveTab('qrs')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: activeTab === 'qrs' ? 'var(--green)' : 'var(--text-light)',
              borderBottom: activeTab === 'qrs' ? '3px solid var(--green)' : 'none',
              cursor: 'pointer'
            }}
          >
            📱 Table QR Codes
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: activeTab === 'inventory' ? 'var(--green)' : 'var(--text-light)',
              borderBottom: activeTab === 'inventory' ? '3px solid var(--green)' : 'none',
              cursor: 'pointer'
            }}
          >
            📦 Menu Availability
          </button>
        </div>

        {activeTab === 'orders' && (
          <>
            <div className="admin-stats">

          <div className="admin-stat">
            <div className="admin-stat-num">
              {stats.count}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Total Orders
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#fbbf24',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#92400e',
              }}
            >
              ₹{stats.totalRevenue}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Total Revenue
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#f97316',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#9a3412',
              }}
            >
              {stats.pending}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Pending
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#22c55e',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#166534',
              }}
            >
              {stats.completed}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Completed
            </div>
          </div>

        </div>

        {error && (

          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>

        )}

        <div className="admin-table-wrap">

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >

            <thead>

              <tr
                style={{
                  background: 'var(--green)',
                  color: 'var(--cream)',
                }}
              >

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  ID
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Name
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Phone
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Table
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Items
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                  Total
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Time
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-light)',
                    }}
                  >
                    Loading orders…
                  </td>
                </tr>

              ) : orders.length === 0 ? (

                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-light)',
                    }}
                  >
                    No orders yet
                  </td>
                </tr>

              ) : (

                orders.map((o, idx) => (

                  <tr
                    key={o._id}
                    style={{
                      background:
                        idx % 2 === 0
                          ? '#fff'
                          : 'var(--cream-light)',

                      borderBottom:
                        '1px solid var(--cream-dark)',
                    }}
                  >

                    <td
                      style={{
                        padding: '12px 14px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      #{o._id.slice(-6).toUpperCase()}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                      }}
                    >
                      {o.name}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {o.phone}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                        color: 'var(--green)',
                      }}
                    >
                      {o.address || 'N/A'}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        maxWidth: 200,
                        color: 'var(--text-light)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {o.items
                        .map(
                          (i) =>
                            `${i.name}${
                              i.variant
                                ? ` (${i.variant})`
                                : ''
                            } ×${i.qty}`
                        )
                        .join(', ')}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                        textAlign: 'right',
                        color: 'var(--green)',
                      }}
                    >
                      ₹{o.total}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.8rem',
                        color: 'var(--text-light)',
                      }}
                    >
                      {new Date(
                        o.createdAt
                      ).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td style={{ padding: '12px 14px' }}>

                      <select
                        className="status-select"
                        value={o.status}
                        onChange={(e) =>
                          updateStatus(
                            o._id,
                            e.target.value
                          )
                        }
                        style={{
                          background:
                            o.status === 'pending'
                              ? '#fef3c7'
                              : o.status === 'preparing'
                              ? '#dbeafe'
                              : '#d1fae5',

                          color:
                            o.status === 'pending'
                              ? '#92400e'
                              : o.status === 'preparing'
                              ? '#1e40af'
                              : '#065f46',

                          fontWeight: 700,
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >

                        <option value="pending">
                          ⏳ Pending
                        </option>

                        <option value="preparing">
                          👨‍🍳 Preparing
                        </option>

                        <option value="completed">
                          ✅ Completed
                        </option>

                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBillOrder(o);
                          setBillEmailInput(o.email || '');
                        }}
                        style={{
                          background: '#0F3D3E',
                          color: '#FAF5EF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 6
                        }}
                        title="View, Print, or Email Bill Receipt"
                      >
                        <span>🧾</span>
                        <span>Bill Slip</span>
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
          </>
        )}

        {activeTab === 'qrs' && (
          <div className="qr-generator-section" style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' }}>
            {/* GOOGLE REVIEW STANDEE PROMINENT CARD */}
            <div style={{
              background: '#0f3d3e',
              color: '#FAF5EF',
              borderRadius: 16,
              padding: '24px 20px',
              marginBottom: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 8px 24px rgba(15, 61, 62, 0.2)'
            }}>
              <div>
                <span style={{ color: '#c3912d', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>
                  ★ Customer Reputation &amp; Feedback
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', margin: '0 0 8px', color: '#FAF5EF' }}>
                  Google 5-Star Review Standee &amp; QR
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#d2dfdf', maxWidth: 520, lineHeight: 1.5 }}>
                  Printable acrylic tent card &amp; counter QR standee. Scanning opens Google Maps with the 5-star review modal ready to tap and submit.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => window.open('/admin/print-review-qr', '_blank')}
                  className="btn-primary"
                  style={{ background: '#c3912d', color: '#1a1a1a', border: 'none', fontWeight: 800, padding: '10px 18px' }}
                >
                  🖨️ Print Standee Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/rate`);
                    toast('Review link copied! Share this or encode in your own designs.');
                  }}
                  className="btn-outline"
                  style={{ color: '#FAF5EF', borderColor: '#4a7575', padding: '10px 16px' }}
                >
                  📋 Copy /rate Link
                </button>
                <a
                  href="/the-moras-cafe-review-standee.png"
                  download
                  className="btn-outline"
                  style={{ color: '#FAF5EF', borderColor: '#4a7575', padding: '10px 16px', textDecoration: 'none' }}
                >
                  📥 Download PNG Card
                </a>
              </div>
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)', marginBottom: 12 }}>Table Ordering QR Codes</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 24 }}>
              Below are the digital ordering QR codes configured for your café tables. 
              You can print these cards or copy the links to generate your own custom layout. 
              Customers scanning these codes will be logged into the respective table session.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {Array.from({ length: Number(import.meta.env.VITE_TOTAL_TABLES) || 5 }, (_, i) => {
                const tableNum = i + 1;
                const tableUrl = `${window.location.origin}/order/table-${tableNum}`;
                const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(tableUrl)}&size=250`;
                
                return (
                  <div key={tableNum} className="qr-card" style={{ border: '2px solid var(--cream-dark)', borderRadius: 12, padding: 20, textAlign: 'center', background: 'var(--cream-light)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green)', marginBottom: 12 }}>Table {tableNum}</div>
                    
                    <div style={{ background: 'var(--white)', padding: 16, borderRadius: 8, display: 'inline-block', border: '1px solid var(--cream-dark)', marginBottom: 12 }}>
                      <img 
                        src={qrImageUrl} 
                        alt={`QR Code for Table ${tableNum}`} 
                        style={{ width: 180, height: 180, display: 'block' }} 
                      />
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', wordBreak: 'break-all', marginBottom: 16, padding: '0 8px' }}>
                      {tableUrl}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        className="btn-outline" 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(tableUrl);
                          toast(`Link for Table ${tableNum} copied!`);
                        }}
                        style={{ fontSize: '0.8rem', padding: '8px 12px', flexGrow: 1 }}
                      >
                        📋 Copy Link
                      </button>
                      <button 
                        className="btn-primary" 
                        type="button"
                        onClick={() => {
                          window.open(`/admin/print-qr/${tableNum}`, '_blank');
                        }}
                        style={{ fontSize: '0.8rem', padding: '8px 12px', background: '#fbbf24', color: '#0f3d3e', border: 'none', flexGrow: 1 }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="admin-table-wrap" style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)', marginBottom: 12 }}>🎂 Birthday Celebration Bookings</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 24 }}>
              Customer birthday event requests. Includes illuminated &ldquo;Happy Birthday&rdquo; stand with lights, guest counts, and ₹59 advance payment tracking.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--green)',
                      color: 'var(--cream)',
                    }}
                  >
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Ref ID</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Host &amp; Birthday Person</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>People</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Slot</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>₹59 Advance / ₹199 Pkg</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Special Requests</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Status &amp; Email</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)' }}>
                        Loading reservations…
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)' }}>
                        No reservations yet
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r, idx) => (
                      <tr
                        key={r._id}
                        style={{
                          background: idx % 2 === 0 ? '#fff' : 'var(--cream-light)',
                          borderBottom: '1px solid var(--cream-dark)',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                          #{r._id.slice(-6).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--green)' }}>{r.name}</div>
                          {r.birthdayPerson && (
                            <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 600 }}>
                              🎂 For: {r.birthdayPerson}
                            </div>
                          )}
                          {r.email && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              ✉️ {r.email}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            📞 {r.phone}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {r.guests}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{r.date}</div>
                          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem' }}>{r.time}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ 
                              background: '#dcfce7', 
                              color: '#15803d', 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              fontSize: '0.78rem', 
                              fontWeight: 700 
                            }}>
                              ₹{r.amount || 59} Adv Paid
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: 3 }}>
                              Bal: ₹{r.remainingBalance || 140}
                            </span>
                          </div>
                          {r.upiRef ? (
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-light)', marginTop: 4 }}>
                              UTR: {r.upiRef}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                              UPI Direct
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 180, color: 'var(--text-light)', fontSize: '0.82rem' }}>
                          {r.notes || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <select
                              className="status-select"
                              value={r.status}
                              onChange={(e) => updateReservationStatus(r._id, e.target.value)}
                              style={{
                                background:
                                  r.status === 'pending'
                                    ? '#fef3c7'
                                    : r.status === 'confirmed'
                                    ? '#d1fae5'
                                    : '#fee2e2',
                                color:
                                  r.status === 'pending'
                                    ? '#92400e'
                                    : r.status === 'confirmed'
                                    ? '#065f46'
                                    : '#991b1b',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="confirmed">✅ Confirmed</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBirthdayBill(r);
                                setBirthdayFoodTotal('');
                                setBillEmailInput(r.email || '');
                              }}
                              style={{
                                background: '#0F3D3E',
                                color: '#FAF5EF',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Generate Final Bill for Birthday Event"
                            >
                              <span>🧾</span>
                              <span>Final Bill</span>
                            </button>

                            {r.email && (
                              <button
                                type="button"
                                onClick={() => resendReservationEmail(r._id, r.email)}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--cream-dark)',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  color: 'var(--green)',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title="Re-send Confirmation Email to customer"
                              >
                                {r.confirmationEmailSent ? '✓ Sent (Resend)' : '✉️ Send Email'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="admin-inventory-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)' }}>
                  Menu Availability & Sold-Out Manager
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  Toggle items Sold Out when ingredients run out. Customer menus update live automatically.
                </p>
              </div>
              <button
                className="btn-secondary"
                type="button"
                onClick={fetchCatalogAvailability}
                disabled={loadingCatalog}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {loadingCatalog ? 'Refreshing…' : '🔄 Refresh Status'}
              </button>
            </div>

            <div className="admin-stats" style={{ marginBottom: 24 }}>
              <div className="admin-stat">
                <div className="admin-stat-num">{catalogItems.length}</div>
                <div className="admin-stat-label">Total Catalog Items</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-num" style={{ color: '#10b981' }}>
                  {catalogItems.filter((i) => i.isAvailable).length}
                </div>
                <div className="admin-stat-label">Currently Available</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-num" style={{ color: catalogItems.some((i) => !i.isAvailable) ? '#dc2626' : 'var(--text-light)' }}>
                  {catalogItems.filter((i) => !i.isAvailable).length}
                </div>
                <div className="admin-stat-label">Sold Out Items</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, background: 'var(--white)', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--cream-dark)' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="🔍 Search items by name..."
                  value={availabilitySearch}
                  onChange={(e) => setAvailabilitySearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ flex: '0 1 200px', minWidth: 160 }}>
                <select
                  value={availabilityCategory}
                  onChange={(e) => setAvailabilityCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                >
                  <option value="All">All Categories</option>
                  {[...new Set(catalogItems.map((i) => i.category))].sort().map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600, color: 'var(--green)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showSoldOutOnly}
                  onChange={(e) => setShowSoldOutOnly(e.target.checked)}
                />
                Show Sold Out Only
              </label>
            </div>

            <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--cream-dark)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--cream-light)', borderBottom: '2px solid var(--cream-dark)' }}>
                    <th style={{ padding: '12px 16px' }}>Item Name</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Base Price</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Availability Action</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogItems
                    .filter((item) => {
                      const matchesSearch = item.name.toLowerCase().includes(availabilitySearch.toLowerCase());
                      const matchesCat = availabilityCategory === 'All' || item.category === availabilityCategory;
                      const matchesSoldOut = !showSoldOutOnly || !item.isAvailable;
                      return matchesSearch && matchesCat && matchesSoldOut;
                    })
                    .map((item) => (
                      <tr key={item.itemKey} style={{ borderBottom: '1px solid #f1f5f9', background: item.isAvailable ? 'transparent' : '#fff1f2' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: item.isAvailable ? 'var(--green)' : '#991b1b' }}>
                          {item.name}
                          {item.multi && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 6 }}>(S/M/L)</span>}
                          {item.tempVariant && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 6 }}>(Hot/Cold)</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-light)' }}>{item.category}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹{item.price}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {item.isAvailable ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                              ● Available
                            </span>
                          ) : (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
                              ✕ SOLD OUT
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            disabled={togglingKey === item.itemKey}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: togglingKey === item.itemKey ? 'wait' : 'pointer',
                              border: item.isAvailable ? '1px solid #f87171' : '1px solid #34d399',
                              background: item.isAvailable ? '#fef2f2' : '#ecfdf5',
                              color: item.isAvailable ? '#dc2626' : '#059669',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {togglingKey === item.itemKey
                              ? 'Saving…'
                              : item.isAvailable
                              ? 'Mark Sold Out'
                              : 'Restore to Available'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ================= ORDER BILL RECEIPT MODAL ================= */}
        {selectedBillOrder && (
          <div className="modal-backdrop open" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
            <div className="modal-card" style={{ maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
              
              {/* Header Controls (no-print) */}
              <div className="no-print" style={{ padding: '16px 20px', background: 'var(--green)', color: '#FAF5EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🧾</span>
                  <span>Order Bill Receipt</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBillOrder(null)}
                  style={{ background: 'none', border: 'none', color: '#FAF5EF', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Action Toolbar (no-print) */}
              <div className="no-print" style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintBill}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0F3D3E' }}
                >
                  <span>🖨️</span>
                  <span>Print Slip</span>
                </button>
                <a
                  href={`https://wa.me/91${selectedBillOrder.phone}?text=${encodeURIComponent(
                    `*THE MORAS CAFE — Bill Receipt*\nInvoice: #TMC-INV-${selectedBillOrder._id.slice(-6).toUpperCase()}\nCustomer: ${selectedBillOrder.name}\nTable: ${selectedBillOrder.address}\n\nItems:\n` +
                    selectedBillOrder.items.map(i => ` - ${i.name}${i.variant ? ` (${i.variant})` : ''} x ${i.qty}: Rs.${i.price * i.qty}`).join('\n') +
                    `\n\n*Grand Total: Rs.${selectedBillOrder.total}*\nPayment: ${selectedBillOrder.payment?.toUpperCase()}\n\nThank you for dining with The Moras Cafe!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Email Bill to Customer (no-print) */}
              <div className="no-print" style={{ padding: '12px 20px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700, marginBottom: 4 }}>
                  ✉️ SEND DIGITAL INVOICE / BILL TO CUSTOMER EMAIL:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={billEmailInput}
                    onChange={(e) => setBillEmailInput(e.target.value)}
                    placeholder="customer@gmail.com"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', borderRadius: 6, border: '1px solid #a7f3d0' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendBillEmail(selectedBillOrder._id, billEmailInput)}
                    disabled={isSendingBillEmail}
                    style={{ background: '#047857', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {isSendingBillEmail ? 'Sending…' : 'Send Bill'}
                  </button>
                </div>
              </div>

              {/* The Actual Printable Thermal/A4 Slip */}
              <div style={{ padding: '20px' }}>
                <div className="bill-receipt-printable" style={{
                  background: '#fff',
                  color: '#1a1a1a',
                  padding: '24px 20px',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', monospace, Arial, sans-serif",
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  {/* Cafe Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0F3D3E' }}>
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F3D3E', letterSpacing: 0.5 }}>THE MORAS CAFE</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                      B.M. Patil Circle, Ring Road, Solapur Bypass, Vijayapura, KA 586102
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Ph: +91 99454 46137 &bull; 100% Pure Vegetarian
                    </div>
                    <div style={{ display: 'inline-block', background: '#0F3D3E', color: '#FAF5EF', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800, marginTop: 6, letterSpacing: 0.5 }}>
                      TAX INVOICE / BILL RECEIPT
                    </div>
                  </div>

                  {/* Order / Invoice Meta */}
                  <div style={{ fontSize: '0.82rem', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Bill / Inv No:</span>
                      <strong style={{ fontFamily: 'monospace' }}>#TMC-INV-{selectedBillOrder._id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Date &amp; Time:</span>
                      <span>{new Date(selectedBillOrder.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Table / Location:</span>
                      <strong style={{ color: '#0F3D3E' }}>{selectedBillOrder.address}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Customer:</span>
                      <strong>{selectedBillOrder.name} ({selectedBillOrder.phone})</strong>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #0F3D3E', fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>
                        <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '6px 0' }}>Rate</th>
                        <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBillOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                          <td style={{ padding: '7px 0', fontWeight: 600 }}>
                            {item.name}
                            {item.variant ? <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}> ({item.variant})</span> : ''}
                          </td>
                          <td style={{ textAlign: 'center', padding: '7px 0' }}>{item.qty}</td>
                          <td style={{ textAlign: 'right', padding: '7px 0' }}>₹{item.price}</td>
                          <td style={{ textAlign: 'right', padding: '7px 0', fontWeight: 700 }}>₹{item.price * item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ borderTop: '1.5px solid #0F3D3E', paddingTop: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: '#64748b' }}>Item Subtotal:</span>
                      <span>₹{selectedBillOrder.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.78rem', color: '#059669' }}>
                      <span>GST / Taxes:</span>
                      <span>Included (₹0.00 Extra)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '2px solid #0F3D3E', fontSize: '1.15rem', fontWeight: 900, color: '#0F3D3E' }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedBillOrder.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Payment Method:</span>
                      <strong style={{ color: '#047857' }}>{selectedBillOrder.payment?.toUpperCase() || 'COUNTER'}</strong>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div style={{ textAlign: 'center', borderTop: '1.5px dashed #cbd5e1', marginTop: 12, paddingTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
                    <div>Thank you for visiting The Moras Cafe!</div>
                    <div style={{ fontStyle: 'italic', marginTop: 2 }}>This is an official computer-generated digital bill.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= BIRTHDAY FINAL BILL GENERATOR MODAL ================= */}
        {selectedBirthdayBill && (
          <div className="modal-backdrop open" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
            <div className="modal-card" style={{ maxWidth: 490, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
              
              {/* Header Controls (no-print) */}
              <div className="no-print" style={{ padding: '16px 20px', background: 'var(--green)', color: '#FAF5EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎂</span>
                  <span>Birthday Celebration Final Bill</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBirthdayBill(null)}
                  style={{ background: 'none', border: 'none', color: '#FAF5EF', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Calculator Inputs (no-print) */}
              <div className="no-print" style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Enter Food &amp; Beverage Total Ordered in Café (₹):
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={birthdayFoodTotal}
                    onChange={(e) => setBirthdayFoodTotal(e.target.value)}
                    placeholder="e.g. 750"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '1rem', fontWeight: 800, borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={handlePrintBill}
                    className="btn-primary"
                    style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, background: '#0F3D3E' }}
                  >
                    <span>🖨️</span>
                    <span>Print Slip</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                  Formula: Food amount + ₹140 remaining setup balance = Final Bill
                </div>
              </div>

              {/* The Actual Printable Birthday Slip */}
              <div style={{ padding: '20px' }}>
                <div className="bill-receipt-printable" style={{
                  background: '#fff',
                  color: '#1a1a1a',
                  padding: '24px 20px',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', monospace, Arial, sans-serif",
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  {/* Cafe Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0F3D3E' }}>
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F3D3E', letterSpacing: 0.5 }}>THE MORAS CAFE</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                      B.M. Patil Circle, Ring Road, Solapur Bypass, Vijayapura, KA 586102
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Ph: +91 99454 46137 &bull; 100% Pure Vegetarian
                    </div>
                    <div style={{ display: 'inline-block', background: '#0F3D3E', color: '#FAF5EF', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800, marginTop: 6, letterSpacing: 0.5 }}>
                      BIRTHDAY EVENT FINAL BILL
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div style={{ fontSize: '0.82rem', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Booking Ref:</span>
                      <strong style={{ fontFamily: 'monospace' }}>#TMC-BDAY-{selectedBirthdayBill._id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Celebrant:</span>
                      <strong>{selectedBirthdayBill.birthdayPerson || selectedBirthdayBill.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Booked By:</span>
                      <span>{selectedBirthdayBill.name} ({selectedBirthdayBill.phone})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Date &amp; Slot:</span>
                      <span>{selectedBirthdayBill.date} at {selectedBirthdayBill.time} ({selectedBirthdayBill.guests} People)</span>
                    </div>
                  </div>

                  {/* Package Breakdown */}
                  <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: 10, marginBottom: 10, fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Birthday Setup Package (Stand &amp; Lights):</span>
                      <strong>₹199</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#047857' }}>
                      <span>Advance Token Paid (UPI):</span>
                      <strong>−₹59 (Paid)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#c2410c', fontWeight: 700 }}>
                      <span>Remaining Setup Balance Due:</span>
                      <span>₹140</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', marginTop: 4, borderTop: '1px dashed #e2e8f0' }}>
                      <span>Food &amp; Drinks Consumed:</span>
                      <strong>₹{Number(birthdayFoodTotal) || 0}</strong>
                    </div>
                  </div>

                  {/* Final Total */}
                  <div style={{ fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0F3D3E', borderTop: '2px solid #0F3D3E' }}>
                      <span>Final Cafe Bill:</span>
                      <span>₹{(Number(birthdayFoodTotal) || 0) + 140}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                      Calculation: ₹{Number(birthdayFoodTotal) || 0} (Food) + ₹140 (Setup Balance)
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div style={{ textAlign: 'center', borderTop: '1.5px dashed #cbd5e1', marginTop: 14, paddingTop: 10, fontSize: '0.72rem', color: '#64748b' }}>
                    <div>Thank you for celebrating with The Moras Cafe! 🎂✨</div>
                    <div style={{ fontStyle: 'italic', marginTop: 2 }}>This is an official computer-generated digital bill.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </section>
  );
}

export default Admin;