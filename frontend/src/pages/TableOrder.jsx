import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const TOTAL_TABLES = Number(import.meta.env.VITE_TOTAL_TABLES) || 5;
const VALID_TABLES = Array.from(
  { length: TOTAL_TABLES },
  (_, i) => `table-${i + 1}`
);

function TableOrder({ onSessionStart }) {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const queryToken = searchParams.get('token');
  const [isSessionBlocked, setIsSessionBlocked] = useState(false);

  const lowerTableId = tableId ? tableId.trim().toLowerCase() : '';
  const isValid = VALID_TABLES.includes(lowerTableId);

  // Normalize (e.g. table-1 => Table 1)
  const normalizedTable = isValid
    ? lowerTableId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  // Handle device session binding validation
  useEffect(() => {
    if (!isValid || !normalizedTable) return;

    const storedTable = localStorage.getItem('activeTable');
    const storedToken = localStorage.getItem('tableSessionToken');
    const storedExpiry = localStorage.getItem('tableSessionExpiry');
    const isExpired = storedExpiry ? Date.now() > Number(storedExpiry) : true;

    if (queryToken) {
      // Check if token in URL matches the browser's stored token for this table
      const isMatch = storedToken === queryToken && storedTable === normalizedTable && !isExpired;
      if (!isMatch) {
        setIsSessionBlocked(true);
      } else {
        setIsSessionBlocked(false);
        if (onSessionStart) {
          onSessionStart(normalizedTable, queryToken);
        }
      }
    } else {
      // Fresh scan: generate new token and replace history with tokenized URL
      const freshToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      if (onSessionStart) {
        onSessionStart(normalizedTable, freshToken);
      }
      setIsSessionBlocked(false);
      navigate(`/order/${lowerTableId}?token=${freshToken}`, { replace: true });
    }
  }, [isValid, normalizedTable, queryToken, lowerTableId, navigate, onSessionStart]);

  const handleStartOrdering = () => {
    toast(`🟢 Table session activated for ${normalizedTable}!`);
    navigate('/menu');
  };

  // 1. Direct manual visit fallback (No parameters provided at /order)
  if (!tableId) {
    return (
      <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '120px 20px 80px' }}>
        <div className="card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: '40px 30px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>📱</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--green)', margin: '0 0 16px' }}>Table QR Required</h2>
          <div style={{ width: 60, height: 3, background: 'var(--green)', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--text-light)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 24 }}>
            To place an order, please scan the QR code available on your table.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '14px', borderRadius: 8 }}
          >
            🏠 Back to Home Page
          </button>
        </div>
      </section>
    );
  }

  // 2. Validate allowed table IDs
  if (!isValid) {
    return (
      <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '120px 20px 80px' }}>
        <div className="card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', background: '#fff', border: '1px solid var(--red)', borderRadius: 16, padding: '40px 30px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--red)', margin: '0 0 16px' }}>Invalid Table QR Code</h2>
          <div style={{ width: 60, height: 3, background: 'var(--red)', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--text-light)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 24 }}>
            Please contact staff.
          </p>
          <button 
            className="btn-outline" 
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '14px', borderRadius: 8, borderColor: 'var(--red)', color: 'var(--red)' }}
          >
            🏠 Back to Home Page
          </button>
        </div>
      </section>
    );
  }

  // 3. Block screen for shared links
  if (isSessionBlocked) {
    return (
      <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '120px 20px 80px', background: 'var(--cream-light)' }}>
        <div className="card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', background: '#fff', border: '2px solid var(--red)', borderRadius: 16, padding: '40px 30px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--red)', margin: '0 0 16px' }}>Shared Link Blocked</h2>
          <div style={{ width: 60, height: 3, background: 'var(--red)', margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--text-light)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 20 }}>
            For security and to prevent remote ordering, this session is bound to the specific device that physically scanned the QR code.
          </p>
          <p style={{ color: 'var(--text-light)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 24, fontWeight: 'bold' }}>
            Please scan the physical QR code directly at your table to start ordering.
          </p>
          <button 
            className="btn-outline" 
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '14px', borderRadius: 8, borderColor: 'var(--red)', color: 'var(--red)', fontWeight: 'bold' }}
          >
            🏠 Go to Homepage
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '120px 20px 80px', background: 'var(--cream-light)' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', background: '#fff', border: '2px solid var(--cream-dark)', borderRadius: 16, padding: '40px 30px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--cream)', overflow: 'hidden', margin: '0 auto 16px', border: '2px solid var(--cream-dark)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <img src="/logo.jpg" alt="Brews & Memories Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Brews &amp; Memories</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 16px' }}>
          Welcome to <span style={{ color: '#fbbf24' }}>{normalizedTable}</span>
        </h2>
        <div style={{ width: 60, height: 3, background: 'var(--green)', margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--text-light)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 28 }}>
          Your digital ordering session is ready. Add items to your cart, and we will prepare and deliver them directly to your table.
        </p>
        <button 
          className="btn-primary" 
          onClick={handleStartOrdering}
          style={{ width: '100%', padding: '14px', borderRadius: 8, background: '#fbbf24', color: '#0f3d3e', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}
        >
          📖 Start Ordering
        </button>
      </div>
    </section>
  );
}

export default TableOrder;
