import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In development or if window.trackEvent is available, record error
    if (typeof window !== 'undefined' && window.trackEvent) {
      window.trackEvent('app_error', { message: error?.message });
    }
  }

  componentDidUpdate(prevProps) {
    // Auto-recover when user navigates to a new page
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <section
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 20px 80px',
            textAlign: 'center',
            background: 'var(--cream-light, #faf8f5)',
          }}
        >
          <div
            style={{
              maxWidth: 500,
              width: '100%',
              background: 'var(--white, #ffffff)',
              border: '1.5px solid var(--cream-dark, #e8e2d2)',
              borderRadius: 20,
              padding: '40px 24px',
              boxShadow: '0 12px 32px rgba(15, 61, 62, 0.08)',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }} aria-hidden="true">
              ☕
            </div>
            <span
              style={{
                display: 'inline-block',
                background: '#fef3c7',
                color: '#92400e',
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Counter Recovery
            </span>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.8rem',
                color: 'var(--green, #0F3D3E)',
                margin: '0 0 10px',
              }}
            >
              Fresh Brew In Progress
            </h2>
            <p
              style={{
                color: 'var(--text-light, #666)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              A momentary hiccup occurred on this screen. Tap below to reload or return to our home menu.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary"
                style={{ padding: '12px 20px', fontSize: '0.9rem' }}
              >
                🔄 Refresh Screen
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-outline"
                style={{ padding: '12px 20px', fontSize: '0.9rem' }}
              >
                🏠 Return Home
              </button>
            </div>
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px dashed var(--cream-dark, #e8e2d2)',
                fontSize: '0.82rem',
                color: '#888',
              }}
            >
              Need immediate assistance? Call our desk at{' '}
              <a
                href="tel:+919945446137"
                style={{ color: 'var(--green, #0F3D3E)', fontWeight: 700 }}
              >
                +91 99454 46137
              </a>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
