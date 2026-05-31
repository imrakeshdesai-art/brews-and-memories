import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const VALID_TABLES = [
  'table-1',
  'table-2',
  'table-3',
  'table-4',
  'table-5'
];

function TableOrder({ onSessionStart }) {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const handleStartOrdering = (normalizedTable) => {
    onSessionStart(normalizedTable);
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
  const lowerTableId = tableId.trim().toLowerCase();
  const isValid = VALID_TABLES.includes(lowerTableId);

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

  // Normalize (e.g. table-1 => Table 1)
  const normalizedTable = lowerTableId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '120px 20px 80px', background: 'var(--cream-light)' }}>
      <div className="card" style={{ maxWidth: 450, width: '100%', textAlign: 'center', background: '#fff', border: '2px solid var(--cream-dark)', borderRadius: 16, padding: '40px 30px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>☕</div>
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
          onClick={() => handleStartOrdering(normalizedTable)}
          style={{ width: '100%', padding: '14px', borderRadius: 8, background: '#fbbf24', color: '#0f3d3e', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}
        >
          📖 Start Ordering
        </button>
      </div>
    </section>
  );
}

export default TableOrder;
