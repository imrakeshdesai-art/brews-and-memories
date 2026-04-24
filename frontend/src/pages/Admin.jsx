import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { loginAdmin, saveAdminToken, clearAdminToken, getAdminToken } from '../services/auth';
import { useToast } from '../components/ToastProvider';

function Admin() {
  const toast = useToast();
  const [email, setEmail] = useState('admin@brews-memories.local');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(getAdminToken());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch orders');
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await loginAdmin({ email, password });
      saveAdminToken(data.token);
      setToken(data.token);
      toast('Signed in successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid login credentials');
    }
  };

  const logout = () => {
    clearAdminToken();
    setToken(null);
    setOrders([]);
    setPassword('');
    toast('Signed out');
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}`, { status });
      setOrders((current) => current.map((item) => (item._id === orderId ? { ...item, status } : item)));
      toast(`Order status updated to ${status}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Could not update status');
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingCount = orders.filter((order) => order.status === 'pending').length;
    const completedCount = orders.filter((order) => order.status === 'completed').length;
    return { totalRevenue, pendingCount, completedCount, orderCount: orders.length };
  }, [orders]);

  if (!token) {
    return (
      <section className="section admin-panel">
        <div className="admin-login">
          <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: 16 }}>🔐</div>
          <h2 className="admin-login-title">Admin Panel</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: 28 }}>
            Sign in to manage orders and view sales.
          </p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {error ? <div style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</div> : null}
            <button className="btn-primary" type="submit" style={{ width: '100%' }}>
              Sign In →
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-light)' }}>
            Demo: admin@brews-memories.local / your seeded password
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section admin-panel">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>📊 Orders Dashboard</h2>
          <button className="btn-outline" type="button" onClick={logout}>
            Sign Out
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.orderCount}</div>
            <div className="admin-stat-label">Total Orders</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">₹{stats.totalRevenue}</div>
            <div className="admin-stat-label">Total Revenue</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.pendingCount}</div>
            <div className="admin-stat-label">Pending</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-num">{stats.completedCount}</div>
            <div className="admin-stat-label">Completed</div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <div className="orders-table-head">
            <span className="orders-table-title">📋 All Orders</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{orders.length} orders</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: 24, textAlign: 'center' }}>
                      Loading orders…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td><strong>{order._id.slice(-8)}</strong></td>
                      <td>{order.name}</td>
                      <td>{order.phone}</td>
                      <td style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '0.82rem' }}>
                        {order.items.map((item) => item.variant ? `${item.name} (${item.variant})` : item.name).join(', ')}
                      </td>
                      <td><strong>₹{order.total}</strong></td>
                      <td style={{ fontSize: '0.78rem' }}>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(event) => updateStatus(order._id, event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Admin;
