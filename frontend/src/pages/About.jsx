import useSEO from '../hooks/useSEO';
import { Link } from 'react-router-dom';

function About() {
  useSEO({
    title: 'About Us — The Story',
    description: 'The Moras Cafe is Vijayapura\'s sanctuary for specialty coffee, artisan vegetarian craft, and slow, meaningful conversations at B.M. Patil Circle.'
  });

  return (
    <div className="about-editorial-page" style={{ background: '#FAF5EF', minHeight: '100vh', paddingBottom: 80 }}>
      {/* CHAPTER 1: HERITAGE PROLOGUE */}
      <section className="section" style={{ padding: '70px 5% 40px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="hero-editorial-kicker" style={{ color: '#b45309' }}>
            The Heritage &amp; Craft
          </span>
          <h1 className="hero-editorial-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginTop: 12 }}>
            Where Every Pour Tells a <em>Story</em>
          </h1>
          <div className="hero-editorial-tagline" style={{ marginTop: 16 }}>
            “The Place That Knows You”
          </div>
        </div>

        <div className="grid-2" style={{ gap: '60px', alignItems: 'center', maxWidth: 1160, margin: '0 auto' }}>
          <div>
            <p style={{ fontSize: '1.15rem', lineHeight: 1.85, color: '#0f3d3e', fontWeight: 600, marginBottom: 20 }}>
              The Moras Cafe was founded on a simple, timeless belief: a true neighborhood cafe is not merely a place to grab coffee, but a warm sanctuary where people pause, connect, and feel genuinely known.
            </p>
            <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'var(--text-light)', marginBottom: 20 }}>
              Nestled at B.M. Patil Circle along Vijayapura's Ring Road, we combine artisan roasting techniques with 100% pure vegetarian culinary craft. From slow-pulled espresso shots to hand-stretched stone-baked pizzas, every plate is prepared fresh to order.
            </p>
            <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'var(--text-light)', marginBottom: 28 }}>
              Whether you are discovering a quiet corner with a curated book, sharing laughter with longtime friends, or celebrating an evening milestone, we pour our heart into every detail.
            </p>
            <div>
              <Link to="/menu" className="btn-editorial-primary" style={{ padding: '14px 32px' }}>
                Explore Our Offerings
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '40px 32px',
              border: '1px solid var(--cream-dark)',
              boxShadow: '0 20px 50px rgba(15, 61, 62, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <img 
                  src="/logo.png" 
                  alt="The Moras Cafe Emblem" 
                  style={{ width: '100%', maxWidth: 200, height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(15,61,62,0.1))' }} 
                />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--green)', margin: '0 0 8px' }}>
                The Moras Cafe
              </h2>
              <div style={{ color: '#b45309', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
                Vijayapura · Karnataka
              </div>
              <p style={{ color: 'var(--text-light)', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
                Specialty brews, artisan bites, and comfortable spaces crafted for the city we love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: FOUR CORNERSTONES */}
      <section style={{ padding: '60px 5%', borderTop: '1px solid var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)', background: '#FAF5EF' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--green)', fontWeight: 800 }}>
              The Pillars
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: 'var(--green)', margin: '8px 0 0' }}>
              The Guest Experience
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              {
                num: '01',
                title: 'Artisan Brews',
                desc: 'Specialty coffee beans selected and precision-extracted for the cleanest, most aromatically rich cup in Vijayapura.'
              },
              {
                num: '02',
                title: 'Pure Vegetarian Craft',
                desc: 'A dedicated 100% vegetarian kitchen serving sourdough-crust pizzas, fresh pasta, loaded sandwiches, and sizzling treats.'
              },
              {
                num: '03',
                title: 'Slow Ambiance',
                desc: 'Comfortable seating, acoustic warmth, and peaceful lighting designed for unhurried conversations and quiet focus.'
              },
              {
                num: '04',
                title: 'Curated Library & Games',
                desc: 'Complimentary reading library and classic tabletop games to unwind with friends and family at your leisure.'
              }
            ].map((pillar) => (
              <div key={pillar.num} style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '32px 24px',
                border: '1px solid var(--cream-dark)',
                boxShadow: '0 4px 16px rgba(15, 61, 62, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                  {pillar.num}
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: 'var(--green)', margin: 0, fontWeight: 700 }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-light)', lineHeight: 1.6, margin: 0 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
