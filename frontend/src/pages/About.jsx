function About() {
  return (
    <div>
      <section className="section" style={{ background: 'var(--green)', color: 'var(--cream)' }}>
        <div className="section-header">
          <span className="section-label" style={{ color: '#fbbf24' }}>Our Story</span>
          <h2 className="section-title" style={{ color: 'var(--cream)' }}>
            Where Every Cup Tells a <em>Story</em>
          </h2>
          <div className="section-divider" style={{ margin: '16px auto 0' }} />
        </div>
        <div className="grid-2" style={{ gap: '60px', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <p style={{ lineHeight: 1.9, color: 'rgba(245,230,200,0.85)', marginBottom: 18 }}>
              Brews & Memories is a cozy café where people come to relax, enjoy great food, and create memories. Nestled at B M Patil Circle on the Ring Road of Vijayapura, Karnataka, we've become the city's favourite hangout spot.
            </p>
            <p style={{ lineHeight: 1.9, color: 'rgba(245,230,200,0.85)', marginBottom: 18 }}>
              From the aroma of freshly brewed coffee to the sizzle of hot pizzas, every visit is an experience crafted with love. Our warm interiors, comfortable seating, and welcoming staff make you feel right at home.
            </p>
            <p style={{ lineHeight: 1.9, color: 'rgba(245,230,200,0.85)' }}>
              We believe the best conversations happen over great food. That's why we put our heart into every cup, every bite, and every smile we serve.
            </p>
          </div>
          <div className="card" style={{ background: 'rgba(245,230,200,0.08)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <img 
                src="/logo.jpg" 
                alt="Brews & Memories Logo" 
                style={{ width: 120, height: 120, borderRadius: '50%', border: '3px solid var(--cream)', objectFit: 'cover', boxShadow: 'var(--shadow-lg)' }} 
              />
            </div>
            <div className="about-card" style={{ textAlign: 'center' }}>
              <div className="card-title" style={{ color: 'var(--cream)' }}>Brews & Memories</div>
              <div style={{ color: 'rgba(245,230,200,0.9)', lineHeight: 1.8 }}>
                Discover our cozy café vibes, the best coffee in Vijayapura, and delightful food made fresh daily.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--cream-light)' }}>
        <div className="section-header">
          <span className="section-label">Why Choose Us</span>
          <h2 className="section-title" style={{ color: 'var(--green)' }}>
            The Brews & Memories <em>Experience</em>
          </h2>
          <div className="section-divider" />
        </div>
        <div className="grid-2" style={{ gap: '24px', maxWidth: 1000, margin: '0 auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
          {[
            { icon: '🛋️', title: 'Comfortable Seating', description: 'Plush seating for a relaxing, cozy stay — perfect for long conversations.' },
            { icon: '🎵', title: 'Chill Vibes', description: 'Ambient music and warm lighting that puts you instantly at ease.' },
            { icon: '🤝', title: 'Social Hangout', description: 'The perfect spot for friends, dates, and team meetups in Vijayapura.' },
            { icon: '⏱️', title: 'Stay Awhile', description: 'Average visits last 1.5 to 3 hours — because you won’t want to leave!' },
          ].map((item) => (
            <div key={item.title} className="card" style={{ cursor: 'default' }}>
              <div className="card-icon">{item.icon}</div>
              <div className="card-title">{item.title}</div>
              <div className="card-copy">{item.description}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;
