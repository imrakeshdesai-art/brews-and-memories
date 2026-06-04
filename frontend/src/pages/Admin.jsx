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
                                  body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; background: #fff; }
                                  .card { border: 6px double #0f3d3e; border-radius: 20px; padding: 40px; max-width: 320px; margin: 50px auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                                  h1 { color: #0f3d3e; font-size: 1.8rem; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px; }
                                  h2 { color: #fbbf24; font-size: 2.2rem; margin: 15px 0; font-family: serif; background: #0f3d3e; padding: 10px; border-radius: 8px; }
                                  .qr { padding: 15px; display: inline-block; background: #fff; border: 1px solid #ddd; border-radius: 12px; margin: 15px 0; }
                                  p { color: #333; font-size: 1rem; margin: 8px 0; }
                                  .small { color: #888; font-size: 0.75rem; word-break: break-all; margin-top: 15px; }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h1>Brews & Memories</h1>
                                  <p style="letter-spacing: 3px; font-size: 0.8rem; font-weight: bold; color: #666; margin-bottom: 20px;">CAFÉ</p>
                                  <div class="qr">
                                    <img src="${qrImageUrl}" style="width: 200px; height: 200px;" />
                                  </div>
                                  <h2>Table ${tableNum}</h2>
                                  <p><strong>Scan QR Code to Order</strong></p>
                                  <p style="color: #666; font-size: 0.9rem;">Your food will be delivered directly here.</p>
                                  <div class="small">${tableUrl}</div>
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