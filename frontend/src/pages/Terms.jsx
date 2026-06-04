import React from 'react';

function Terms() {
  return (
    <section className="section" style={{ padding: '120px 20px 80px', minHeight: '80vh', background: 'var(--cream-light)' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="section-label" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Rules & Agreement</span>
        <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: 'var(--green)', margin: '10px 0 16px' }}>Terms of Service</h2>
        <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '0 auto' }} />
      </div>
      <div className="card" style={{ maxWidth: 800, width: '100%', margin: '0 auto', background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: '40px', boxShadow: 'var(--shadow-lg)', color: 'var(--text-light)', lineHeight: 1.8 }}>
        <p><strong>Last Updated: June 2026</strong></p>
        <p>
          Welcome to the digital table ordering portal of Brews & Memories. By using our website and scanning table QR codes, you agree to comply with the following terms of service.
        </p>
        
        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>1. Digital Table Ordering</h3>
        <p>
          Our digital ordering system is designed strictly for customers physically present at Brews & Memories. 
        </p>
        <ul>
          <li>Orders must specify a valid active table identifier obtained by scanning the physical QR code on the table.</li>
          <li>Each session is bound to your browser using a device session token for security. Shared ordering links from other tables or remote locations are strictly blocked.</li>
        </ul>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>2. Payment Options</h3>
        <p>
          Customers may select their preferred payment method at checkout:
        </p>
        <ul>
          <li><strong>Pay at Counter</strong>: Placing an order creates a pending bill. You must pay at the cash counter via cash, UPI, or card before leaving.</li>
          <li>Orders placed are binding. Please notify staff immediately if you need to make changes or cancel an order before it is prepared in the kitchen.</li>
        </ul>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>3. Session Validation</h3>
        <p>
          Active table sessions expire automatically after 20 minutes of inactivity or immediately upon checkout to maintain accurate table assignments. If your session expires, you must rescan the table QR code to start a new order.
        </p>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>4. Abuse Prevention</h3>
        <p>
          Any attempt to place fake orders, bypass security parameters, or flood our server with requests will result in an automatic IP ban and/or legal actions.
        </p>
      </div>
    </section>
  );
}

export default Terms;
