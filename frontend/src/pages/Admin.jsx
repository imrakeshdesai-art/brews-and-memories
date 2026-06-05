import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  saveAdminToken,
  clearAdminToken,
  getAdminToken,
} from '../services/auth';
import { useToast } from '../components/ToastProvider';

function Admin() {

  const toast = useToast();

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  // IMPORTANT
  const [token, setToken] = useState(getAdminToken());

  const [authChecked, setAuthChecked] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // ================= AUTH + LOAD ORDERS =================
  useEffect(() => {

    // No token → show login
    if (!token) {

      setAuthChecked(true);

      return;
    }

    const loadOrders = async () => {

      await fetchOrders();

      setAuthChecked(true);
    };

    loadOrders();

    const interval = setInterval(loadOrders, 20000);

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

      setError(
        err.response?.data?.message ||
        'Invalid credentials'
      );
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
              Admin Login
            </h2>

            <p
              style={{
                color: 'var(--text-light)',
                fontSize: '0.9rem',
              }}
            >
              Brews & Memories Dashboard
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
                Admin Email
              </label>

              <input
                id="admin-user"
                type="email"
                value={user}
                onChange={(e) =>
                  setUser(e.target.value)
                }
                placeholder="admin@example.com"
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
        </div>

        {activeTab === 'orders' ? (
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

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
        </>
        ) : (
          <div className="qr-generator-section" style={{ background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)', marginBottom: 12 }}>Table QR Codes Generator</h3>
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
                    
                    <div style={{ background: '#fff', padding: 16, borderRadius: 8, display: 'inline-block', border: '1px solid var(--cream-dark)', marginBottom: 12 }}>
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
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print Table ${tableNum} QR Code</title>
                                <style>
                                  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

                                  * { margin: 0; padding: 0; box-sizing: border-box; }

                                  body {
                                    background: #1a1a1a;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                  }

                                  .scene {
                                    display: flex;
                                    gap: 32px;
                                    justify-content: center;
                                    align-items: flex-start;
                                    padding: 28px 16px;
                                    flex-wrap: wrap;
                                    font-family: 'DM Sans', sans-serif;
                                    min-height: 100%;
                                  }

                                  .card-wrapper {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 10px;
                                  }

                                  .card-label {
                                    font-family: 'DM Sans', sans-serif;
                                    font-size: 11px;
                                    font-weight: 500;
                                    letter-spacing: 2px;
                                    text-transform: uppercase;
                                    color: #888;
                                  }

                                  .card {
                                    width: 290px;
                                    height: 580px;
                                    border-radius: 16px;
                                    overflow: hidden;
                                    position: relative;
                                    box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
                                    display: flex;
                                    flex-direction: column;
                                  }

                                  .front { background: #1C3829; }

                                  .gold-bar { height: 4px; background: linear-gradient(90deg, #B8892E, #F0C85A, #D4AF64, #B8892E); flex-shrink: 0; }
                                  .green-bar { height: 4px; background: linear-gradient(90deg, #1C3829, #2D5A3E, #1C3829); flex-shrink: 0; }

                                  .front-header {
                                    padding: 16px 20px 12px;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    flex-shrink: 0;
                                  }

                                  .logo-ring {
                                    width: 48px; height: 48px;
                                    border-radius: 50%;
                                    background: rgba(212,175,100,0.12);
                                    border: 1.5px solid rgba(212,175,100,0.45);
                                    display: flex; align-items: center; justify-content: center;
                                    margin-bottom: 7px;
                                    overflow: hidden;
                                  }

                                  .brand-name {
                                    font-family: 'Playfair Display', serif;
                                    font-size: 12.5px; font-weight: 700;
                                    color: #D4AF64;
                                    letter-spacing: 0.4px;
                                    text-align: center; line-height: 1.3;
                                  }

                                  .brand-tagline {
                                    font-size: 8.5px; font-weight: 400;
                                    color: rgba(212,175,100,0.55);
                                    letter-spacing: 1.4px; text-transform: uppercase;
                                    margin-top: 2px;
                                  }

                                  .steps-row {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    gap: 6px;
                                    padding: 8px 16px;
                                    background: rgba(0,0,0,0.18);
                                    flex-shrink: 0;
                                  }

                                  .step-item { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }

                                  .step-icon-wrap {
                                    width: 26px; height: 26px;
                                    border-radius: 7px;
                                    background: rgba(212,175,100,0.1);
                                    border: 1px solid rgba(212,175,100,0.22);
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 12px;
                                  }

                                  .step-label { font-size: 7.5px; font-weight: 500; color: rgba(240,230,210,0.65); text-align: center; line-height: 1.2; }
                                  .step-arrow { font-size: 9px; color: rgba(212,175,100,0.3); margin-top: -6px; }

                                  .headline-block {
                                    padding: 10px 20px 6px;
                                    text-align: center;
                                    flex-shrink: 0;
                                  }

                                  .scan-headline {
                                    font-family: 'Playfair Display', serif;
                                    font-size: 28px; font-weight: 900;
                                    color: #F5EDD8;
                                    line-height: 1.0; letter-spacing: -0.3px;
                                  }

                                  .sub-benefits { margin-top: 5px; }
                                  .sub-benefit { display: block; font-size: 9px; font-weight: 400; color: rgba(212,175,100,0.82); letter-spacing: 0.3px; line-height: 1.5; }

                                  .qr-zone {
                                    margin: 8px 16px 6px;
                                    background: #F5EDD8;
                                    border-radius: 12px;
                                    padding: 12px 12px 8px;
                                    display: flex; flex-direction: column; align-items: center;
                                    flex-shrink: 0;
                                    position: relative;
                                  }

                                  .qr-corners { position: absolute; inset: -2px; pointer-events: none; }
                                  .qr-corner { position: absolute; width: 13px; height: 13px; border-color: #1C3829; border-style: solid; border-width: 0; }
                                  .qr-corner.tl { top:0;left:0;border-top-width:2.5px;border-left-width:2.5px;border-top-left-radius:4px; }
                                  .qr-corner.tr { top:0;right:0;border-top-width:2.5px;border-right-width:2.5px;border-top-right-radius:4px; }
                                  .qr-corner.bl { bottom:0;left:0;border-bottom-width:2.5px;border-left-width:2.5px;border-bottom-left-radius:4px; }
                                  .qr-corner.br { bottom:0;right:0;border-bottom-width:2.5px;border-right-width:2.5px;border-bottom-right-radius:4px; }

                                  .qr-table-badge {
                                    margin-top: 7px;
                                    background: #1C3829; color: #D4AF64;
                                    font-family: 'Playfair Display', serif;
                                    font-size: 12px; font-weight: 700;
                                    padding: 3px 18px; border-radius: 20px; letter-spacing: 1px;
                                  }

                                  .cta-strip {
                                    margin: 6px 16px;
                                    background: #D4AF64;
                                    border-radius: 9px;
                                    padding: 9px 12px;
                                    display: flex; align-items: center; justify-content: center; gap: 7px;
                                    flex-shrink: 0;
                                  }

                                  .cta-text {
                                    font-size: 11px; font-weight: 600; color: #1C3829;
                                    letter-spacing: 0.5px; text-transform: uppercase; text-align: center; line-height: 1.15;
                                  }

                                  .trust-row {
                                    display: flex; justify-content: center; gap: 10px;
                                    padding: 5px 16px 2px;
                                    flex-shrink: 0;
                                  }

                                  .trust-item { display: flex; align-items: center; gap: 3px; font-size: 7.5px; font-weight: 500; color: rgba(240,230,210,0.6); }
                                  .trust-check { font-size: 8px; color: #D4AF64; }

                                  .food-deco {
                                    display: flex; justify-content: center; gap: 7px;
                                    font-size: 13px; opacity: 0.45;
                                    flex: 1;
                                    align-items: center;
                                    padding: 0 16px;
                                  }

                                  .back { background: #F5EDD8; }

                                  .back-header {
                                    background: #1C3829;
                                    padding: 16px 20px 14px;
                                    display: flex; flex-direction: column; align-items: center;
                                    flex-shrink: 0;
                                  }

                                  .back-logo-row { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
                                  .back-brand { font-family: 'Playfair Display', serif; font-size: 12.5px; font-weight: 700; color: #D4AF64; letter-spacing: 0.4px; }

                                  .back-headline {
                                    font-family: 'Playfair Display', serif;
                                    font-size: 21px; font-weight: 700; color: #F5EDD8; letter-spacing: 0.2px;
                                  }

                                  .back-subhead { font-size: 8.5px; font-weight: 400; color: rgba(212,175,100,0.65); letter-spacing: 1.4px; text-transform: uppercase; margin-top: 3px; }

                                  .steps-list {
                                    padding: 14px 18px 10px;
                                    display: flex; flex-direction: column; gap: 9px;
                                    flex-shrink: 0;
                                  }

                                  .step-row { display: flex; align-items: flex-start; gap: 11px; }

                                  .step-num-wrap {
                                    width: 30px; height: 30px; border-radius: 50%;
                                    background: #1C3829;
                                    display: flex; align-items: center; justify-content: center;
                                    flex-shrink: 0;
                                  }

                                  .step-num { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: #D4AF64; }

                                  .step-content { flex: 1; padding-top: 3px; }
                                  .step-title { font-family: 'Playfair Display', serif; font-size: 12.5px; font-weight: 700; color: #1C3829; line-height: 1.2; }
                                  .step-desc { font-size: 9px; font-weight: 400; color: #5A6B5A; margin-top: 1px; line-height: 1.3; }
                                  .step-icon-right { font-size: 16px; padding-top: 3px; flex-shrink: 0; }

                                  .divider { height: 1px; background: rgba(28,56,41,0.1); margin: 0 18px; flex-shrink: 0; }

                                  .assist-block {
                                    margin: 10px 16px 8px;
                                    background: #1C3829;
                                    border-radius: 11px;
                                    padding: 12px 14px;
                                    display: flex; gap: 10px; align-items: flex-start;
                                    flex-shrink: 0;
                                  }

                                  .assist-icon-wrap {
                                    width: 32px; height: 32px; border-radius: 50%;
                                    background: rgba(212,175,100,0.13);
                                    border: 1px solid rgba(212,175,100,0.32);
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 14px; flex-shrink: 0;
                                  }

                                  .assist-title { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700; color: #D4AF64; margin-bottom: 2px; }
                                  .assist-desc { font-size: 8.5px; font-weight: 400; color: rgba(240,230,210,0.72); line-height: 1.4; }

                                  .back-food-deco {
                                    display: flex; justify-content: center; gap: 7px;
                                    font-size: 13px; opacity: 0.38;
                                    flex: 1;
                                    align-items: center;
                                    padding: 0 18px;
                                  }

                                  .back-bottom-strip {
                                    background: #D4AF64;
                                    padding: 7px 18px;
                                    display: flex; align-items: center; justify-content: center; gap: 6px;
                                    flex-shrink: 0;
                                  }

                                  .back-bottom-text { font-size: 8.5px; font-weight: 600; color: #1C3829; letter-spacing: 1px; text-transform: uppercase; }
                                  .dot-sep { width: 3px; height: 3px; border-radius: 50%; background: #1C3829; opacity: 0.4; }

                                  @media print {
                                    body {
                                      background: #fff !important;
                                      -webkit-print-color-adjust: exact !important;
                                      print-color-adjust: exact !important;
                                    }
                                    .scene {
                                      padding: 0 !important;
                                    }
                                    .card-label {
                                      display: none !important;
                                    }
                                    .card-wrapper {
                                      gap: 0 !important;
                                    }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="scene">
                                  <!-- FRONT -->
                                  <div class="card-wrapper">
                                    <span class="card-label">Front Side</span>
                                    <div class="card front">
                                      <div class="gold-bar"></div>

                                      <div class="front-header">
                                        <div class="logo-ring">
                                          <img src="/logo.jpg" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
                                        </div>
                                        <div class="brand-name">Brews & Memories<br>Café</div>
                                        <div class="brand-tagline">Crafted with love · Est. 2020</div>
                                      </div>

                                      <div class="steps-row">
                                        <div class="step-item">
                                          <div class="step-icon-wrap">📱</div>
                                          <div class="step-label">Scan QR</div>
                                        </div>
                                        <span class="step-arrow">›</span>
                                        <div class="step-item">
                                          <div class="step-icon-wrap">🍔</div>
                                          <div class="step-label">Pick Favorites</div>
                                        </div>
                                        <span class="step-arrow">›</span>
                                        <div class="step-item">
                                          <div class="step-icon-wrap">🚀</div>
                                          <div class="step-label">Get Served</div>
                                        </div>
                                      </div>

                                      <div class="headline-block">
                                        <div class="scan-headline">SCAN &<br>ORDER</div>
                                        <div class="sub-benefits">
                                          <span class="sub-benefit">◆ No Waiting &nbsp;◆ No Calling Staff</span>
                                          <span class="sub-benefit">Order Directly From Your Table</span>
                                        </div>
                                      </div>

                                      <div class="qr-zone">
                                        <div class="qr-corners">
                                          <div class="qr-corner tl"></div><div class="qr-corner tr"></div>
                                          <div class="qr-corner bl"></div><div class="qr-corner br"></div>
                                        </div>
                                        <img src="${qrImageUrl}" style="width: 148px; height: 148px; background: white; padding: 8px; border-radius: 8px; display: block; object-fit: contain;" />
                                        <div class="qr-table-badge">TABLE ${String(tableNum).padStart(2, '0')}</div>
                                      </div>

                                      <div class="cta-strip">
                                        <span style="font-size:15px;">👉</span>
                                        <div class="cta-text">SCAN NOW &<br>START ORDERING</div>
                                      </div>

                                      <div class="trust-row">
                                        <div class="trust-item"><span class="trust-check">✓</span> Fast Ordering</div>
                                        <div class="trust-item"><span class="trust-check">✓</span> Freshly Prepared</div>
                                        <div class="trust-item"><span class="trust-check">✓</span> At Your Table</div>
                                      </div>

                                      <div class="food-deco">☕ 🍔 🍕 🥪 🍹 🍟</div>

                                      <div class="gold-bar"></div>
                                    </div>
                                  </div>

                                  <!-- BACK -->
                                  <div class="card-wrapper">
                                    <span class="card-label">Back Side</span>
                                    <div class="card back">
                                      <div class="green-bar"></div>

                                      <div class="back-header">
                                        <div class="back-logo-row">
                                          <img src="/logo.jpg" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; display: block;" />
                                          <span class="back-brand">Brews & Memories Café</span>
                                        </div>
                                        <div class="back-headline">How It Works</div>
                                        <div class="back-subhead">Simple · Fast · Delightful</div>
                                      </div>

                                      <div class="steps-list">
                                        <div class="step-row">
                                          <div class="step-num-wrap"><span class="step-num">1</span></div>
                                          <div class="step-content">
                                            <div class="step-title">Scan QR Code</div>
                                            <div class="step-desc">Point your camera at the code on this card</div>
                                          </div>
                                          <span class="step-icon-right">📱</span>
                                        </div>
                                        <div class="step-row">
                                          <div class="step-num-wrap"><span class="step-num">2</span></div>
                                          <div class="step-content">
                                            <div class="step-title">Browse Full Menu</div>
                                            <div class="step-desc">Explore drinks, bites & chef's specials</div>
                                          </div>
                                          <span class="step-icon-right">📋</span>
                                        </div>
                                        <div class="step-row">
                                          <div class="step-num-wrap"><span class="step-num">3</span></div>
                                          <div class="step-content">
                                            <div class="step-title">Add Items to Cart</div>
                                            <div class="step-desc">Customise your order just the way you like</div>
                                          </div>
                                          <span class="step-icon-right">🛒</span>
                                        </div>
                                        <div class="step-row">
                                          <div class="step-num-wrap"><span class="step-num">4</span></div>
                                          <div class="step-content">
                                            <div class="step-title">Confirm Your Order</div>
                                            <div class="step-desc">Confirm & pay securely in seconds</div>
                                          </div>
                                          <span class="step-icon-right">✅</span>
                                        </div>
                                        <div class="step-row">
                                          <div class="step-num-wrap"><span class="step-num">5</span></div>
                                          <div class="step-content">
                                            <div class="step-title">Relax & Enjoy</div>
                                            <div class="step-desc">We'll bring it fresh to your table</div>
                                          </div>
                                          <span class="step-icon-right">😊</span>
                                        </div>
                                      </div>

                                      <div class="divider"></div>

                                      <div class="assist-block">
                                        <div class="assist-icon-wrap">🤝</div>
                                        <div>
                                          <div class="assist-title">Need Assistance?</div>
                                          <div class="assist-desc">Our team is always happy to help.<br>Just wave and we'll come right to you.</div>
                                        </div>
                                      </div>

                                      <div class="back-food-deco">🥐 ☕ 🍰 🥤 🍜 🧁</div>

                                      <div class="back-bottom-strip">
                                        <span class="back-bottom-text">Freshly Brewed</span>
                                        <div class="dot-sep"></div>
                                        <span class="back-bottom-text">Crafted With Love</span>
                                        <div class="dot-sep"></div>
                                        <span class="back-bottom-text">Just For You</span>
                                      </div>

                                      <div class="green-bar"></div>
                                    </div>
                                  </div>
                                </div>
                                <script>
                                  window.onload = function() {
                                    window.print();
                                    setTimeout(() => window.close(), 500);
                                  }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
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

      </div>

    </section>
  );
}

export default Admin;