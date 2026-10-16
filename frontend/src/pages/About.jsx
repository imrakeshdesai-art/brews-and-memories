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
              Nestled at B.M. Patil Circle along Vijayapura's Ring Road, we combine artisan coffee brewing with 100% pure vegetarian culinary craft. From slow-pulled espresso shots to hand-stretched stone-baked pizzas, every plate is prepared fresh to order.
            </p>
            <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'var(--text-light)', marginBottom: 28 }}>
              Whether you are discovering a quiet corner with a curated book, sharing laughter with longtime friends, or celebrating an evening milestone under fairy lights, we pour our heart into every detail.
            </p>
            <div>
              <Link to="/menu" className="btn-editorial-primary" style={{ padding: '14px 32px' }}>
                Explore Our Offerings
              </Link>
            </div>
          </div>

          {/* Authentic Atmosphere Showcase */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(15, 61, 62, 0.16)',
              border: '2px solid rgba(214, 210, 196, 0.7)',
              aspectRatio: '4/5',
              background: '#0F3D3E'
            }}>
              <img 
                src="/images/instagram/garden_night_seating.webp" 
                alt="The Moras Cafe serene garden dining table under warm evening pendant lights" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                background: 'rgba(15, 61, 62, 0.92)',
                color: '#FAF5EF',
                padding: '8px 18px',
                borderRadius: '30px',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
              }}>
                <span style={{ color: '#10b981', fontSize: '0.75rem' }}>●</span>
                <span>Garden Terrace · Vijayapura</span>
              </div>
            </div>

            {/* Official Brand Stamp Seal Badge */}
            <div style={{
              position: 'absolute',
              top: -18,
              right: -18,
              width: 76,
              height: 76,
              borderRadius: '50%',
              boxShadow: '0 8px 24px rgba(15,61,62,0.22)',
              overflow: 'hidden',
              background: '#FAF5EF'
            }}>
              <img 
                src="/images/brand/secondary-badge-light.png" 
                alt="The Moras Cafe Seal" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: FOUR CORNERSTONES */}
      <section style={{ padding: '60px 5%', borderTop: '1px solid var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)', background: '#FAF5EF', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Botanical Brand Watermark Motif */}
        <div className="brand-watermark-light about-pillars-watermark" aria-hidden="true" />

        <div style={{ maxWidth: 1160, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
                desc: 'Carefully roasted coffee beans precision-extracted for clean, aromatically rich espresso and specialty frappes.'
              },
              {
                num: '02',
                title: 'Pure Vegetarian Craft',
                desc: 'A dedicated 100% vegetarian kitchen serving stone-baked pizzas, fresh pasta, loaded sandwiches, and sizzling treats.'
              },
              {
                num: '03',
                title: 'Slow Ambiance',
                desc: 'Open-air garden seating, acoustic warmth, and peaceful lighting designed for unhurried conversations and quiet focus.'
              },
              {
                num: '04',
                title: 'Curated Library & Games',
                desc: 'Complimentary reading library and classic tabletop games to unplug and make memories with friends and family.'
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

      {/* CHAPTER 3: OUR SPACES & ATMOSPHERE (GENUINE PHOTO TRILOGY) */}
      <section style={{ padding: '70px 5%' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--green)', fontWeight: 800 }}>
              The Vibe
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: 'var(--green)', margin: '8px 0 10px' }}>
              Spaces Designed to <em>Unwind</em>
            </h2>
            <p style={{ color: 'var(--text-light)', maxWidth: 620, margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              Step into an intimate, greenery-wrapped oasis where every corner has its own unique mood.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {/* Photo 1: Garden Canopy */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--cream-dark)',
              boxShadow: '0 12px 32px rgba(15, 61, 62, 0.06)'
            }}>
              <div style={{ height: '320px', overflow: 'hidden' }}>
                <img 
                  src="/images/instagram/garden_night_seating.webp" 
                  alt="Outdoor garden terrace dining with warm pendant lights at The Moras Cafe" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--green)', margin: '0 0 8px' }}>
                  The Garden Canopy
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Intimate open-air dining tables shaded by trees, framed by white picket fences, and softly lit with warm pendant bulbs.
                </p>
              </div>
            </div>

            {/* Photo 2: Twilight Evenings */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--cream-dark)',
              boxShadow: '0 12px 32px rgba(15, 61, 62, 0.06)'
            }}>
              <div style={{ height: '320px', overflow: 'hidden' }}>
                <img 
                  src="/images/instagram/mahantesh_loni.webp" 
                  alt="Twilight ambience with glowing dreamcatcher" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--green)', margin: '0 0 8px' }}>
                  Twilight Ambience
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Handcrafted dreamcatchers and bohemian accents casting golden glow across the evening lawn as the sun sets.
                </p>
              </div>
            </div>

            {/* Photo 3: The Coffee Mural */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--cream-dark)',
              boxShadow: '0 12px 32px rgba(15, 61, 62, 0.06)'
            }}>
              <div style={{ height: '320px', overflow: 'hidden' }}>
                <img 
                  src="/images/instagram/manju_duddagi.webp" 
                  alt="Artistic coffee mural corner in outdoor seating" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--green)', margin: '0 0 8px' }}>
                  The Coffee Mural Corner
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Vibrant custom wall art celebrating music, coffee culture, and unhurried good times with your squad.
                </p>
              </div>
            </div>

            {/* Photo 4: Mindful Leisure & Chess */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--cream-dark)',
              boxShadow: '0 12px 32px rgba(15, 61, 62, 0.06)'
            }}>
              <div style={{ height: '320px', overflow: 'hidden' }}>
                <img 
                  src="/images/instagram/cafe_chess_board.webp" 
                  alt="Classic wooden chess board and slow mindful leisure at The Moras Cafe" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--green)', margin: '0 0 8px' }}>
                  Mindful Leisure &amp; Chess
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Handcrafted wooden chessboards, tabletop games, and curated books designed to slow down time over hot coffee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
