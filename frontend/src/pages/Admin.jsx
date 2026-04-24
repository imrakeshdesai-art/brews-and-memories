import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { loginAdmin, saveAdminToken, clearAdminToken, getAdminToken } from '../services/auth';
import { useToast } from '../components/ToastProvider';

function Admin() {
  const toast = useToast();

  // ✅ FIXED EMAIL
  const [email, setEmail] = useState('admin@brews.local');
  const [password, setPassword] = useState('');

  const [token, setToken] = useState(getAdminToken());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ FETCH ORDERS WHEN TOKEN EXISTS
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      // ✅ FIXED ENDPOINT
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      console.error(err);
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
      console.error(err);
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
      // ✅ FIXED ENDPOINT
      await api.patch(`/api/orders/${orderId}`, { status });

      setOrders((current) =>
        current.map((item) =>
          item._id === orderId ? { ...item, status } : item
        )
      );

      toast(`Order updated → ${status}`);
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || 'Update failed');
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;

    return {
      totalRevenue,
      pendingCount,
      completedCount,
      orderCount: orders.length,
    };
  }, [orders]);

  // 🔐 LOGIN SCREEN
  if (!token) {
    return (
      <section className="section admin-panel">
        <div className="admin-login">
          <h2>Admin Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button type="submit">Login</button>
          </form>
        </div>
      </section>
    );
  }

  // 📊 DASHBOARD
  return (
    <section className="section admin-panel">
      <h2>Orders Dashboard</h2>

      <button onClick={logout}>Logout</button>

      <div>
        <p>Total Orders: {stats.orderCount}</p>
        <p>Total Revenue: ₹{stats.totalRevenue}</p>
        <p>Pending: {stats.pendingCount}</p>
        <p>Completed: {stats.completedCount}</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o._id.slice(-6)}</td>
                <td>{o.name}</td>
                <td>₹{o.total}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      updateStatus(o._id, e.target.value)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Admin;