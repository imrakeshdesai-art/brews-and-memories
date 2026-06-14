import { useEffect, useState } from 'react';

const instagramWidgetUrl = import.meta.env.VITE_INSTAGRAM_WIDGET_URL || 'b16a01b6-838f-4360-88fc-9a34d2927446';

const INSTAGRAM_POSTS = [
  {
    username: 'hightide.sagar',
    collaborators: 'and 2 others',
    initials: 'HS',
    image: '/images/instagram/hightide_sagar.jpeg',
    caption: '☕️Brews & Memories✨ #newcafe in ❤️🔥VIJAYAPUR ♥️\n\nLocation - Infront of the Udayshree sports academy Solapur road vijayapur\n\nThank you♥️ @guruprasad_27 for helping me in the shoot📸\n\n#hightidesagar #bijapur #bijapurmerijaan #karnataka #vijayapur #kannada #india #cafe #newcafe #food #bijapurfoodwalks #Bijapurfood #bijapurcafes',
    likes: 412,
    comments: 63,
    date: 'May 20, 2026',
    postUrl: 'https://www.instagram.com/reels/DQ05-lUDzup/'
  },
  {
    username: 'behind_ourlens_06',
    initials: 'BO',
    image: '/images/instagram/behind_ourlens_06.jpeg',
    caption: '🌸🎀💕🫧#explorepage #cafe #reelsindia #girlgang #cafedate',
    likes: 245,
    comments: 34,
    date: 'May 18, 2026',
    postUrl: 'https://www.instagram.com/reels/DXb9UdHj9jh/'
  },
  {
    username: 'manju.duddagi',
    collaborators: 'and 1 other',
    initials: 'MD',
    image: '/images/instagram/manju_duddagi.jpeg',
    caption: 'New Cafein Bijapur..! ✨\nCome for The Brews, Stay for The Memories ☕💛\n📍Visit Today & Create Your Story Here!\n#brewsandmemories\n\n#brewsandmemories #cafelaunch #coffeevibes #cozycafe #cafenights #newcafeInbijapur #coffeeloversclub #cafegoals #eveningvibes #foodielife #bestplace #instacafevibes #bijapur #bijapurmerijaan #bijapurfoodwalks #vijayapura #karnataka #foodlovers #viral #reels #cafe #cafelovers',
    likes: 356,
    comments: 52,
    date: 'May 08, 2026',
    postUrl: 'https://www.instagram.com/reels/DQssSCUibgo/'
  },
  {
    username: 'mahantesh_loni',
    collaborators: 'and brews_and_memories_',
    initials: 'ML',
    image: '/images/instagram/mahantesh_loni.jpeg',
    caption: '#cafe #coffeelover #pizza',
    likes: 294,
    comments: 21,
    date: 'Apr 24, 2026',
    postUrl: 'https://www.instagram.com/reel/DXlAGMzkX4g/?igsh=aXhkN3NlOWlxMXVo'
  },
  {
    username: 'foodieme_5',
    initials: 'FM',
    image: '/images/instagram/foodieme_5.jpeg',
    caption: 'Hot dog.. coffee.... and vibes...☕️\n📍Brews and Memories\n\n#winter#food#hotdog#coffee',
    likes: 312,
    comments: 48,
    date: 'May 05, 2026',
    postUrl: 'https://www.instagram.com/p/DSHhXKkDakg/?igsh=ZXNkZnRqbjkxanFi'
  }
];

export default function Moments() {
  const [useFallback, setUseFallback] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [lightboxCaption, setLightboxCaption] = useState('');

  useEffect(() => {
    let scriptListener = null;
    let timerId = null;
    let fallbackTimerId = null;

    if (instagramWidgetUrl && !instagramWidgetUrl.startsWith('http')) {
      const initElfsight = () => {
        timerId = setTimeout(() => {
          if (window.ElfsightPlatform) {
            if (typeof window.ElfsightPlatform.init === 'function') {
              window.ElfsightPlatform.init();
            } else if (typeof window.ElfsightPlatform.renderComponents === 'function') {
              window.ElfsightPlatform.renderComponents();
            }
          }
        }, 100);
      };

      let script = document.querySelector('script[src*="elfsight.com/platform/platform.js"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://static.elfsight.com/platform/platform.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-use-service-core', '');
        script.onload = initElfsight;
        document.body.appendChild(script);
      } else {
        if (window.ElfsightPlatform) {
          initElfsight();
        } else {
          scriptListener = initElfsight;
          script.addEventListener('load', scriptListener);
        }
      }

      // Check if widget loads successfully within 3.5 seconds. If not (blocked by ad-blocker), show offline fallback.
      fallbackTimerId = setTimeout(() => {
        const widgetContainer = document.querySelector(`.elfsight-app-${instagramWidgetUrl}`);
        if (!widgetContainer || widgetContainer.children.length <= 1) {
          console.warn('Elfsight widget timed out or was blocked. Falling back to native gallery grid.');
          setUseFallback(true);
        }
      }, 3500);
    } else {
      setUseFallback(true);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (fallbackTimerId) clearTimeout(fallbackTimerId);
      if (scriptListener) {
        const script = document.querySelector('script[src*="elfsight.com/platform/platform.js"]');
        if (script) {
          script.removeEventListener('load', scriptListener);
        }
      }
    };
  }, []);

  const handleOpenLightbox = (url, caption) => {
    setLightboxImage(url);
    setLightboxCaption(caption);
    setIsLightboxOpen(true);
  };

  return (
    <div style={{ background: 'var(--cream-light)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* HEADER SECTION */}
      <section style={{ 
        backgroundImage: 'linear-gradient(rgba(15, 61, 62, 0.82), rgba(15, 61, 62, 0.92)), url("/ambiance.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'var(--cream)',
        padding: '120px 20px 60px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{ 
            color: '#fbbf24', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            display: 'block',
            marginBottom: '8px'
          }}>
            Real Instagram Moments
          </span>
          <h1 style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 'clamp(2.1rem, 5vw, 3rem)', 
            color: 'var(--cream)', 
            margin: '0 0 16px',
            fontWeight: 700 
          }}>
            Share Your <span style={{ color: '#fbbf24', fontFamily: "'Dancing Script', cursive" }}>Moments</span>
          </h1>
          <div style={{ width: '60px', height: '3px', background: '#fbbf24', margin: '0 auto 20px' }} />
          <p style={{ 
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', 
            color: 'rgba(245, 230, 200, 0.85)', 
            lineHeight: 1.6, 
            margin: 0,
            maxWidth: '650px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            A collection of beautiful memories captured by our guests at Brews &amp; Memories Cafe. Tag us <a href="https://www.instagram.com/brews_and_memories_/" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>@brews_and_memories_</a> on Instagram to get featured!
          </p>
        </div>
      </section>

      {/* GALLERY / FEED SECTION */}
      <section className="section" style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {useFallback ? (
            /* STATIC MOCK FEED SOURCED FROM REAL ACCOUNT */
            <div>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <span style={{ background: 'rgba(193, 53, 132, 0.1)', color: '#c13584', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  📸 Insta Gallery
                </span>
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                  Showing our latest guest moments. You can also view them directly on our page.
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30 }}>
                {INSTAGRAM_POSTS.map((post, index) => (
                  <div 
                    key={index} 
                    className="card"
                    style={{
                      padding: 0,
                      borderRadius: 14,
                      overflow: 'hidden',
                      background: '#fff',
                      border: '1px solid var(--cream-dark)',
                      boxShadow: 'var(--shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'default'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--cream-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          width: 34, 
                          height: 34, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: `hsl(${(index * 75) % 360}, 65%, 40%)`, 
                          color: '#fff', 
                          fontWeight: 700, 
                          fontSize: '0.8rem'
                        }}>
                          {post.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--green)', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            {post.username}
                            {post.collaborators && (
                              <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.72rem' }}>
                                {post.collaborators}
                              </span>
                            )}
                          </div>
                          <small style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Vijayapura, Karnataka</small>
                        </div>
                      </div>
                      <span style={{ fontSize: '1.25rem', color: '#c13584' }}>📸</span>
                    </div>

                    {/* Image */}
                    <div 
                      style={{ height: 280, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                      onClick={() => handleOpenLightbox(post.image, post.caption)}
                      title="Click to view closeup"
                    >
                      <img 
                        src={post.image} 
                        alt={post.caption} 
                        loading="lazy" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      />
                    </div>

                    {/* Footer / Caption */}
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cream-light)', paddingBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)' }}>
                          <span>❤️ {post.likes} Likes</span>
                          <span>💬 {post.comments} Comments</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 }}>{post.date}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5, margin: 0, flexGrow: 1 }}>
                        <strong style={{ color: 'var(--green)', marginRight: 6 }}>{post.username}</strong>
                        {post.caption}
                      </p>
                      <div style={{ marginTop: 10 }}>
                        <a 
                          href={post.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '10px',
                            borderRadius: 8,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            color: '#c13584',
                            borderColor: '#c13584'
                          }}
                        >
                          🔗 View Instagram Post
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ELFSIGHT LIVE WIDGET EMBED WITH BUILT-IN PREMIUM LOADER */
            <div style={{ 
              background: '#fff', 
              borderRadius: 14, 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-sm)', 
              border: '1px solid var(--cream-dark)', 
              padding: '16px',
              minHeight: '500px'
            }}>
              {instagramWidgetUrl.startsWith('http') ? (
                <iframe 
                  src={instagramWidgetUrl}
                  scrolling="no" 
                  allowtransparency="true" 
                  style={{ width: '100%', border: '0', overflow: 'hidden', minHeight: '650px', display: 'block' }}
                  title="Instagram Feed Widget"
                />
              ) : (
                <div className={`elfsight-app-${instagramWidgetUrl}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{
                      width: 36,
                      height: 36,
                      border: '3px solid rgba(15, 61, 62, 0.1)',
                      borderTop: '3px solid var(--green)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      marginBottom: 16
                    }} />
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>Loading Instagram Feed...</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>Connected to @brews_and_memories_</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX FOR CLOSEUP IMAGES */}
      {isLightboxOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 61, 62, 0.95)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            style={{ 
              maxWidth: 550, 
              width: '100%', 
              background: '#fff', 
              borderRadius: 16, 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'relative', aspectRatio: '1/1', background: '#000' }}>
              <img src={lightboxImage} alt="Instagram close-up" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={() => setIsLightboxOpen(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20, maxHeight: 180, overflowY: 'auto' }}>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-dark)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {lightboxCaption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
