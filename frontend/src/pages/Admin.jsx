import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  loginAdmin,
  saveAdminToken,
  clearAdminToken,
  getAdminToken,
} from "../services/auth";
import { useToast } from "../components/ToastProvider";

function Admin() {
  const toast = useToast();

  const [email, setEmail] = useState("admin@brews-memories.local");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(getAdminToken());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch orders");
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ RUN when token exists
  useEffect(() => {
    if (!token) return;

    fetchOrders();

    // 🔥 Auto refresh every 5 sec (PRO feature)
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // ✅ Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginAdmin({ email, password });
      saveAdminToken(data.token);
      setToken(data.token);
      toast("Logged in successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  // ✅ Logout
  const logout = () => {
    clearAdminToken();
    setToken(null);
    setOrders([]);
    setPassword("");
    toast("Logged out");
  };

  // ✅ Update status
  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}`, { status });

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );

      toast(`Updated to ${status}`);
    } catch (err) {
      toast(err.response?.data?.message || "Update failed");
    }
  };

  // ✅ Stats
  const stats = useMemo(() => {
    return {
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      pending: orders.filter((o) => o.status === "pending").length,
      completed: orders.filter((o) => o.status === "completed").length,
      count: orders.length,
    };
  }, [orders]);

  // 🔐 LOGIN UI
  if (!token) {
    return (
      <section className="section admin-panel">
        <div className="admin-login">
          <h2>🔐 Admin Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit">Login</button>
          </form>
        </div>
      </section>
    );
  }

  // 📊 DASHBOARD UI
  return (
    <section className="section admin-panel">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>📊 Orders Dashboard</h2>
          <button onClick={logout}>Sign Out</button>
        </div>

        <div className="admin-stats">
          <div>Total Orders: {stats.count}</div>
          <div>Total Revenue: ₹{stats.totalRevenue}</div>
          <div>Pending: {stats.pending}</div>
          <div>Completed: {stats.completed}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
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
                <td colSpan="7">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7">No orders</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id.slice(-6)}</td>
                  <td>{o.name}</td>
                  <td>{o.phone}</td>
                  <td>{o.items.map((i) => i.name).join(", ")}</td>
                  <td>₹{o.total}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Admin;