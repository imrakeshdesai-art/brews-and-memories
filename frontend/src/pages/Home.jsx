import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { menuData } from '../data/menuData';

const FEATURED_CATEGORIES = [
  { image: '/ColdCoffee.png', label: 'Cold Coffee', category: 'Cold Beverages' },
  { image: '/HotCoffee.png', label: 'Hot Coffee', category: 'Beverages' },
  { image: '/Milkshake.png', label: 'Milkshakes', category: 'Milk Shakes' },
  { image: '/Tea & Beverages.png', label: 'Tea & Beverages', category: 'Beverages' },
  { image: '/Tandoori Paneer Pizza.png', label: 'Pizzas', category: 'Pizza' },
  { image: '/images/menu/burger.png', label: 'Burgers', category: 'Burgers' },
  { image: '/Veg Club Sandwich.png', label: 'Sandwiches', category: 'Sandwiches' },
  { image: '/Maggie.png', label: 'Maggi', category: 'Maggi' },
  { image: '/momos.png', label: 'Momos', category: 'Momos' },
  { image: '/Fries & Snacks.png', label: 'Fries & Snacks', category: 'Fries' },
];

const FAVORITES_CONFIG = [
  {
    category: 'Cold Beverages',
    name: 'Cold Coffee',
    badge: 'Customer Favorite',
    image: '/ColdCoffee.png',
    desc: 'Chilled and refreshing specialty cold coffee - creamy, rich, and Vijayapura\'s most popular drink.'
  },
  {
    category: 'Pizza',
    name: 'Tandoori Paneer Pizza',
    badge: 'Most Ordered',
    image: '/Tandoori Paneer Pizza.png',
    desc: 'Indian tandoori spiced paneer cubes topped with crisp capsicum, onions, and fresh melted mozzarella.'
  },
  {
    category: 'Sandwiches',
    name: 'Veg Club Sandwich',
    badge: 'Staff Pick',
    image: '/Veg Club Sandwich.png',
    desc: 'Crispy double-decker toasted sandwich loaded with fresh veggies, butter spreads, and melted cheese.'
  },
  {
    category: 'Fries',
    name: 'Honey Chilli Potato',
    badge: 'Customer Favorite',
    image: '/Honey Chilli Potato.png',
    desc: 'Crispy deep-fried potato fingers tossed in a sweet, spicy, and tangy honey chilli sauce.'
  },
  {
    category: 'Burgers',
    name: 'Paneer Burger',
    badge: 'Must Try',
    image: '/images/menu/burger.png',
    desc: 'Crispy paneer patty with fresh lettuce, onions, sliced tomatoes, and creamy signature burger sauces.'
  },
  {
    category: 'Maggi',
    name: 'B&M Signature Maggi',
    badge: 'Best Seller',
    image: '/images/menu/items/B&M Signature Maggi.webp',
    desc: 'Our signature masala Maggi loaded with sweet corn, green peas, carrots, herbs and naturally melted cheese.'
  }
];



const FAQS = [
  {
    q: 'Do you accept table reservations?',
    a: 'Yes, we accept table reservations for dates, business meetups, and family dinners. You can reserve online using our quick booking form or reservation modal, or call us directly at +91 99454 46137.'
  },
  {
    q: 'Do you offer takeaway or home delivery?',
    a: 'We offer instant, freshly prepared takeaway options. You can order on our website and pick it up at the counter. For home delivery, we are active on major local food delivery partner apps.'
  },
  {
    q: 'Do you have free Wi-Fi for remote work?',
    a: 'Absolutely! We offer high-speed, free Wi-Fi for all our guests. We have plenty of charging sockets near our comfortable seats, making it a perfect work-from-cafe spot.'
  },
  {
    q: 'What are your timings and working days?',
    a: 'We are open every single day from 10:00 AM to 10:30 PM (Last order at 10:00 PM). Sunday timings remain the same.'
  },
  {
    q: 'Do you host private events or birthday parties?',
    a: 'Yes, we host intimate celebrations, birthday parties, open mics, and corporate meetups. Please contact our management at least 2 days in advance via phone or visit us to discuss customized menu packages.'
  }
];

function StatCounter({ targetValue, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`stat-counter-${targetValue}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [targetValue]);

  useEffect(() => {
    if (!hasStarted) return;

    const isFloat = /^[0-9]+\.[0-9]+/.test(targetValue);
    const isInt = /^[0-9]+/.test(targetValue);
    
    if (!isFloat && !isInt) {
      setCount(targetValue);
      return;
    }

    const numericValue = parseFloat(targetValue.match(/^[0-9.]+/)[0]);
    const suffix = targetValue.replace(/^[0-9.]+/, '');
    
    let start = 0;
    const steps = 60; // 60 frames
    const increment = numericValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextVal = increment * currentStep;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(targetValue);
      } else {
        if (isFloat) {
          setCount(`${nextVal.toFixed(1)}${suffix}`);
        } else {
          setCount(`${Math.floor(nextVal)}${suffix}`);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hasStarted, targetValue, duration]);

  return <span id={`stat-counter-${targetValue}`}>{count || targetValue}</span>;
}

function Home({ addToCart, openReserve }) {
  const showToast = useToast();


  const favorites = FAVORITES_CONFIG.map(config => {
    const categoryItems = menuData[config.category] || [];
    const dbItem = categoryItems.find(item => item.name === config.name);
    if (!dbItem) return null;
    
    let price = dbItem.price;
    let variant = '';
    if (dbItem.multi) {
      price = dbItem.priceM;
      variant = 'M';
    }
    
    return {
      name: dbItem.name,
      price: price,
      emoji: dbItem.emoji,
      badge: config.badge,
      desc: config.desc || dbItem.desc,
      image: config.image,
      item: {
        name: dbItem.name,
        price: price,
        emoji: dbItem.emoji,
        desc: dbItem.desc,
        ...(dbItem.multi ? { variant } : {})
      }
    };
  }).filter(Boolean);



  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // In-page Reservation State
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resGuests, setResGuests] = useState('2');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [resSuccess, setResSuccess] = useState(false);
  const [resError, setResError] = useState('');

  const handleAddFavorite = (item) => {
    addToCart(item);
    showToast(`🛒 ${item.name} added to cart!`);
    if (window.trackEvent) {
      window.trackEvent('quick_add', { item_name: item.name, price: item.price });
    }
  };



  const handleToggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleInPageReserve = (e) => {
    e.preventDefault();
    if (!resName.trim() || !resPhone.trim() || !resDate || !resTime) {
      setResError('Please fill in all required fields.');
      return;
    }

    const cleanedPhone = resPhone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setResError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (Number(resGuests) < 1) {
      setResError('Number of guests must be at least 1.');
      return;
    }

    setResSuccess(true);
    setResError('');
  };

  const resetResForm = () => {
    setResName('');
    setResPhone('');
    setResGuests('2');
    setResDate('');
    setResTime('');
    setResNotes('');
    setResSuccess(false);
    setResError('');
  };

  return (
    <div>
      {/* COMPACT & BALANCED PREMIUM HERO WITH REAL CAFE IMAGE OVERLAY */}
      <section className="hero-section" style={{ 
        backgroundImage: 'linear-gradient(rgba(15, 61, 62, 0.75), rgba(15, 61, 62, 0.82)), url("/ambiance.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'var(--cream)', 
        padding: '115px 20px 52px', 
        minHeight: 'auto' 
      }}>
        <div className="hero-container" style={{ gap: 32 }}>
          
          {/* Left Column: Copy & Actions */}
          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Top row badges row (Location, Google Rating, timings) */}
            <div className="hero-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                📍 B.M. Patil Circle, Vijayapura
              </span>
              <a 
                href="https://maps.app.goo.gl/2fYwvrLgfTP9ytBW7" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none'
                }}
              >
                ⭐ Rated 4.8 on Google
              </a>
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(245, 230, 200, 0.95)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                🕒 Open Daily • 10 AM–10:30 PM
              </span>
            </div>
            
            <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', lineHeight: 1.12, color: 'var(--cream)', fontWeight: 800, margin: 0 }}>
              Brews &amp;<br />
              <span style={{ color: '#fbbf24', fontFamily: "'Dancing Script', cursive" }}>Memories</span>
            </h1>

            {/* Subtitle Tags & Operational Descriptor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0 12px' }}>
              <div className="hero-tags" style={{ 
                color: '#fbbf24', 
                fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', 
                fontWeight: 800, 
                letterSpacing: '1px', 
                textTransform: 'uppercase',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 10px',
                alignItems: 'center',
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic'
              }}>
                <span>Coffee Flows. Stories Wait. Memories Stay.</span>
              </div>
              <p className="hero-subtitle" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(245, 230, 200, 0.9)', margin: 0, lineHeight: 1.6, fontWeight: 500, maxWidth: 620, textAlign: 'left' }}>
                Vijayapura's cozy café with books, board games, comfort food, and unforgettable moments.
              </p>
            </div>

            {/* Two primary bold CTAs */}
            <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
              <button 
                onClick={openReserve}
                className="btn-primary" 
                style={{ 
                  background: '#fbbf24', 
                  color: '#0f3d3e', 
                  padding: '14px 32px', 
                  fontSize: '1.02rem', 
                  fontWeight: 800, 
                  borderRadius: 8, 
                  minWidth: 180, 
                  textAlign: 'center', 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)' 
                }}
                aria-label="Reserve table now"
              >
                📅 Reserve Table
              </button>
              <Link 
                to="/menu" 
                className="btn-outline" 
                style={{ 
                  padding: '14px 32px', 
                  fontSize: '1.02rem', 
                  fontWeight: 700, 
                  borderRadius: 8, 
                  minWidth: 180, 
                  textAlign: 'center', 
                  background: 'transparent', 
                  border: '2px solid #fbbf24', 
                  color: '#fbbf24',
                  textDecoration: 'none'
                }}
              >
                Explore Menu
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Media - Overlapping Grid Collage of Food & Drinks */}
          <div className="hero-media-wrapper" style={{ width: '100%' }}>
            <div className="hero-food-collage" aria-label="Brews & Memories Signature Food Collage">
              {/* Main Pizza Card */}
              <div className="collage-item pizza" title="Tandoori Paneer Pizza">
                <img src="/images/instagram/hero_pizza.webp" alt="Freshly baked Tandoori Paneer Pizza" />
              </div>
              {/* Coffee Card (Overlapping) */}
              <div className="collage-item coffee" title="Creamy Cold Coffee">
                <img src="/images/instagram/hero_cold_coffee.webp" alt="Signature Hazelnut Cold Coffee" />
              </div>
              {/* Sandwich Card (Small Overlapping) */}
              <div className="collage-item sandwich" title="Veg Club Sandwich">
                <img src="/images/instagram/hero_sandwich.webp" alt="Signature Veg Club Sandwich" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOVE-THE-FOLD SOCIAL PROOF TRUST BADGES BAR */}
      <section style={{ background: 'var(--cream-light)', borderBottom: '1px solid var(--cream-dark)', padding: '20px 10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px 48px', maxWidth: 1100, margin: '0 auto' }}>
          {[
            { badge: '🏆', title: '500+ Google Reviews', sub: 'Rated 4.8 Stars' },
            { badge: '☕', title: 'Specialty Coffee', sub: 'Freshly Ground & Brewed' },
            { badge: '🥗', title: 'Pure Vegetarian', sub: 'Fresh & Hygienic' },
            { badge: '📍', title: 'Prime Location', sub: 'B.M. Patil Circle' },
            { badge: '🕒', title: 'Open Daily', sub: '10 AM – 10:30 PM' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.8rem' }}>{item.badge}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--green)' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE STRIP — KEY SELLING POINTS */}
      <section style={{ background: 'var(--green)', padding: '14px 20px', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 32px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          {[
            '✓ Pure Veg',
            '✓ Family Friendly',
            '✓ Student Favorite',
            '✓ Outdoor Seating',
            '✓ Free Wi-Fi',
            '✓ Free Parking',
          ].map((item) => (
            <span key={item} style={{
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* WHY PEOPLE LOVE SECTION */}
      <section className="why-love-section">
        <div className="why-love-container">
          <span className="why-love-label">Experience the Vibe</span>
          <h2 className="why-love-title">Why People Love Brews & Memories</h2>
          <div className="why-love-divider" />
          
          <div className="why-love-grid">
            {[
              {
                icon: '📚',
                title: 'Free Books to Read',
                desc: 'Dive into our curated library of novels, poetry, and biographies while enjoying your coffee.'
              },
              {
                icon: '🎲',
                title: 'Free Board Games',
                desc: 'Unplug and challenge your friends to classic chess, card games, or fun tabletop battles.'
              },
              {
                icon: '☕',
                title: 'Fresh Coffee & Snacks',
                desc: 'Enjoy freshly brewed coffee and premium pure-veg snacks crafted fresh in our kitchen.'
              },
              {
                icon: '🌧️',
                title: 'Cozy Rainy-Day Seating',
                desc: 'Watch the rain pour through our glass windows in our warm, botanical garden indoor seating.'
              },
              {
                icon: '📸',
                title: 'Instagram-Worthy Ambience',
                desc: 'Capture aesthetic moments with neon backdrops, lush green decor, and cozy lighting.'
              }
            ].map((item, index) => (
              <div key={index} className="why-love-card">
                <span className="why-love-icon" role="img" aria-label={item.title}>
                  {item.icon}
                </span>
                <h4 className="why-love-card-title">{item.title}</h4>
                <p className="why-love-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIDDEN CORNER SECTION */}
      <section className="hidden-corner-section">
        <div className="hidden-corner-container">
          <div className="hidden-corner-grid">
            <div className="hidden-corner-image-wrapper">
              <img 
                src="/images/instagram/booksandboardgames.png" 
                alt="A cozy bookshelf corner filled with novels, board games, and warm ambient lighting" 
                className="hidden-corner-img"
                loading="lazy"
              />
            </div>
            <div className="hidden-corner-content">
              <span className="hidden-corner-label">The Hidden Corner</span>
              <h2 className="hidden-corner-title">More Than Just Coffee</h2>
              <div className="hidden-corner-divider" />
              <p className="hidden-corner-text">
                Pick a book. Play a board game. Stay as long as you like.
              </p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.98rem', lineHeight: 1.6, margin: 0 }}>
                Our café features a curated shelf of bestsellers, classics, and self-help books alongside popular board games like Jenga, Chess, Ludo, Uno, and Catan. Whether you want to escape into a novel, challenge your friends to a game, or work in a cozy corner, we have the perfect space for you.
              </p>
              <div style={{ 
                margin: '10px 0', 
                background: 'var(--cream-light)', 
                border: '1px solid var(--cream-dark)', 
                borderRadius: '12px', 
                padding: '16px 20px', 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem' }}>☕</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    <span style={{ textDecoration: 'line-through', marginRight: 6 }}>Most Cafés:</span> 
                    <strong>Just Coffee &amp; Pizza</strong>
                  </div>
                </div>
                <div style={{ height: '1px', background: 'var(--cream-dark)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.4rem' }}>✨</span>
                  <div style={{ fontSize: '0.95rem', color: 'var(--green)' }}>
                    <strong>B&amp;M Experience:</strong><br />
                    <span style={{ fontWeight: 800, color: 'var(--green)' }}>Coffee + Pizza + Books + Board Games</span>
                  </div>
                </div>
              </div>
              {/* Popular Games & Books Showcase Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎲 Available Board Games:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Chess', 'Jenga', 'Catan', 'Uno', 'Ludo', 'Monopoly', 'Playing Cards'].map(game => (
                      <span key={game} style={{
                        background: 'rgba(15, 61, 62, 0.05)',
                        color: 'var(--green)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid rgba(15, 61, 62, 0.08)'
                      }}>
                        {game}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📚 Book Library Genres:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Classics', 'Self-Help', 'Novels', 'Poetry', 'Philosophy', 'Biographies'].map(genre => (
                      <span key={genre} style={{
                        background: 'rgba(251, 191, 36, 0.08)',
                        color: '#b45309',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid rgba(251, 191, 36, 0.15)'
                      }}>
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden-corner-badge" style={{ marginTop: 6 }}>
                <span>📚</span> Curated Library &amp; Tabletop Games
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEST FOR OCCASIONS SECTION */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '80px 20px', borderBottom: '1px solid var(--cream-dark)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>Find Your Vibe</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '0 0 16px', fontWeight: 700 }}>
            Best For...
          </h2>
          <div style={{ width: 60, height: 3, background: 'var(--green)', margin: '0 auto 40px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { icon: '👫', title: 'Date Nights', desc: 'Cozy, ambient spots with warm lighting, perfect for sharing sweet moments and great conversation.' },
              { icon: '👨‍👩‍👧', title: 'Family Time', desc: 'Spacious group tables and a premium vegetarian menu that everyone in the family will love.' },
              { icon: '📚', title: 'Reading Corner', desc: 'A peaceful, quiet nook with a selection of free books and a warm cup of coffee.' },
              { icon: '🎲', title: 'Game Nights', desc: 'Challenge your friends to chess, Jenga, or cards over signature milkshakes and Maggi.' },
              { icon: '☕', title: 'Coffee Catchups', desc: 'Catch up with friends or get work done with high-speed free Wi-Fi and power outlets.' }
            ].map((item, idx) => (
              <div key={idx} className="card" style={{ 
                background: '#fff', 
                border: '1px solid var(--cream-dark)', 
                borderRadius: 16, 
                padding: '30px 20px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                cursor: 'default',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
              >
                <span style={{ fontSize: '2.6rem' }} role="img" aria-label={item.title}>{item.icon}</span>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--green)', fontWeight: 800, margin: 0 }}>{item.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR STORY SECTION (RIGHT AFTER HERO) */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="grid-2" style={{ gap: '48px', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Our Story</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: 0 }}>
              Where Every Cup Tells a <em>Story</em>
            </h2>
            <div style={{ width: 50, height: 3, background: 'var(--green)' }} />
            <p style={{ lineHeight: 1.7, color: 'var(--text-light)', margin: 0, fontSize: '0.95rem' }}>
              Welcome to <strong>Brews & Memories Café</strong>, Vijayapura's premium destination for delicious pure vegetarian delicacies and specialty roasted coffees. Located right at the heart of the city near B.M. Patil Circle, we offer the perfect cozy space for coffee dates, birthday celebrations, and productive work sessions.
            </p>
            <p style={{ lineHeight: 1.7, color: 'var(--text-light)', margin: 0, fontSize: '0.95rem' }}>
              Our mission is simple: to serve food crafted with love, provide warm hospitality, and create a cozy ambiance where you can slow down and build beautiful memories with friends and family.
            </p>
            
            {/* Quick Cafe Timing / Address info for instant trust */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--cream-dark)', paddingTop: 16, marginTop: 10 }}>
              <div>
                <strong>📍 Find Us</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>B M Patil Circle, Vijayapura, KA</div>
              </div>
              <div>
                <strong>📞 Call to Inquire</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>+91 99454 46137</div>
              </div>
            </div>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/3' }}>
            <img 
              src="/ambiance.webp" 
              alt="Cozy interior seating at Brews and Memories Cafe Vijayapura" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>



      {/* EXPLORE WHAT WE SERVE (CATEGORIES - IMAGES INSTEAD OF EMOJIS) */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 36, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Explore Our Menu</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Explore What We <em>Serve</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>
        <div className="categories-grid">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={`/menu?category=${encodeURIComponent(cat.category)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: 0,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff',
                  border: '1px solid var(--cream-dark)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                  <img src={cat.image} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--green)', padding: '12px 6px' }}>{cat.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/menu" className="btn-primary" style={{ display: 'inline-block', padding: '12px 30px' }}>
            🍽️ Explore Our Complete Menu
          </Link>
        </div>
      </section>

      {/* SPECIAL OFFERS / HIGHLIGHT BANNER */}
      <section className="section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '60px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 800 }}>Café Offers &amp; Specials</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--cream)', margin: '8px 0 32px' }}>Specials For <em>Our Guests</em></h2>
          
          <div className="grid-2" style={{ gap: 24, maxWidth: 850, margin: '0 auto' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(245, 230, 200, 0.2)', padding: '24px', borderRadius: 12, textAlign: 'left' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎓</div>
              <h3 style={{ fontSize: '1.2rem', color: '#fbbf24', margin: '0 0 8px' }}>Student Discount</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(245,230,200,0.85)', lineHeight: 1.5, margin: 0 }}>
                Show your valid student ID card to our bill counter and get an instant <strong>10% Off</strong> on your total order. Valid all days!
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(245, 230, 200, 0.2)', padding: '24px', borderRadius: 12, textAlign: 'left' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: '1.2rem', color: '#fbbf24', margin: '0 0 8px' }}>Birthday Celebrations</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(245,230,200,0.85)', lineHeight: 1.5, margin: 0 }}>
                Reserve a table for your birthday party! We provide <strong>free basic table decor</strong> (balloons and banners) to make your moments special.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: CUSTOMER FAVORITES (100% REAL IMAGES & DATABASE DATA) */}
      <section className="section" style={{ background: '#fff', padding: '85px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Top Rated Selections</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Customer <em>Favorites</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30, maxWidth: 1100, margin: '0 auto' }}>
          {favorites.map((dish) => (
            <div 
              key={dish.name} 
              className="card" 
              style={{ 
                cursor: 'default', 
                borderRadius: 14, 
                overflow: 'hidden', 
                padding: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                background: '#fff', 
                border: '1px solid var(--cream-dark)',
                boxShadow: 'var(--shadow)',
                position: 'relative'
              }}
            >
              {/* Actual Item Badge (Customer Favorite, Most Ordered, Staff Pick, Must Try) */}
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--green)', color: 'var(--cream)', fontWeight: 800, fontSize: '0.72rem', padding: '6px 12px', borderRadius: 20, zIndex: 10, letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(15, 61, 62, 0.3)' }}>
                {dish.badge}
              </div>

              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img 
                  src={dish.image} 
                  alt={dish.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.04)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.92)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  {dish.emoji}
                </div>
              </div>
              
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--green)', fontWeight: 700, margin: 0 }}>{dish.name}</h3>
                  <span style={{ fontSize: '1.15rem', color: 'var(--green)', fontWeight: 800 }}>₹{dish.price}</span>
                </div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0, flexGrow: 1 }}>
                  {dish.desc}
                </p>
                <div style={{ marginTop: 8 }}>
                  <Link 
                    to="/menu" 
                    className="btn-outline" 
                    style={{ display: 'block', padding: '12px 14px', fontSize: '0.85rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center', color: 'var(--green)', borderColor: 'var(--green)' }}
                  >
                    Explore More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a 
            href="/menu.pdf" 
            target="_blank" 
            rel="noreferrer"
            className="btn-primary"
            style={{ 
              padding: '12px 28px', 
              fontSize: '0.92rem', 
              borderRadius: 8, 
              textDecoration: 'none', 
              color: '#0f3d3e', 
              background: '#fbbf24', 
              fontWeight: 800,
              boxShadow: 'var(--shadow)'
            }}
          >
            📄 View Full Menu (PDF)
          </a>
          <Link 
            to="/menu" 
            className="btn-outline" 
            style={{ 
              padding: '12px 28px', 
              fontSize: '0.92rem', 
              borderRadius: 8, 
              textDecoration: 'none', 
              color: 'var(--green)', 
              borderColor: 'var(--green)',
              fontWeight: 700 
            }}
          >
            🔍 Search &amp; Order Online
          </Link>
        </div>
      </section>







      {/* POWERFUL BRAND QUOTE */}
      <section className="section" style={{ background: '#fff', padding: '60px 20px 20px', textAlign: 'center' }}>
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          fontFamily: "'Playfair Display', serif", 
          fontSize: 'clamp(1.6rem, 4.5vw, 2.4rem)', 
          color: 'var(--green)',
          fontStyle: 'italic',
          fontWeight: 700,
          lineHeight: 1.3
        }}>
          “Come for the coffee. Stay for the memories.”
        </div>
      </section>

      {/* STATISTICS BLOCK: BREWS & MEMORIES BY NUMBERS */}
      <section className="section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={{ color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>Our Milestones</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--cream)', margin: '0 0 16px', fontWeight: 700 }}>
            Brews &amp; Memories By Numbers
          </h2>
          <div style={{ width: 50, height: 3, background: '#fbbf24', margin: '0 auto 40px' }} />
          
          <div className="grid-5" style={{ gap: '30px 20px' }}>
            {[
              { icon: '☕', number: '500+', label: 'Happy Guests' },
              { icon: '📚', number: 'Free', label: 'Books Available' },
              { icon: '🎲', number: 'Free', label: 'Board Games' },
              { icon: '⭐', number: '4.8+', label: 'Google Rating' },
              { icon: '❤️', number: 'Countless', label: 'Memories Made' }
            ].map((stat, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(245, 230, 200, 0.15)', 
                borderRadius: '16px', 
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '2.5rem', marginBottom: 4 }}>{stat.icon}</span>
                <strong style={{ fontSize: '1.8rem', color: '#fbbf24', fontWeight: 800 }}><StatCounter targetValue={stat.number} /></strong>
                <span style={{ fontSize: '0.88rem', color: 'rgba(245, 230, 200, 0.85)', fontWeight: 600 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATION & TIMINGS BLOCK */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '60px 20px', borderTop: '1px solid var(--cream-dark)' }}>
        <div className="grid-2" style={{ maxWidth: 1000, margin: '0 auto', gap: 40, alignItems: 'center' }}>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 800 }}>Visit Our Cafe</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: 0 }}>Come Visit Us</h2>
            <div style={{ width: 40, height: 3, background: 'var(--green)' }} />
            <p style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.98rem', margin: 0 }}>
              Stop by for a freshly brewed cup and your favorite bites. We are located at a prime, easily accessible location in Vijayapura with comfortable indoor & garden seating.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.92rem', color: 'var(--text-dark)', marginTop: 8 }}>
              <div>📍 <strong>Address:</strong> Brews and Memories cafe, B M Patil circle, Ring Rd, Adarsh Nagar, solapur road, Vijayapura, Karnataka 586102</div>
              <div>🕒 <strong>Hours:</strong> Open Daily · 10:00 AM – 10:30 PM</div>
              <div>📞 <strong>Contact:</strong> <a href="tel:+919945446137" style={{ color: 'var(--green)', fontWeight: 700, textDecoration: 'none' }}>+91 99454 46137</a></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%', maxWidth: 440 }}>
            <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '3px solid var(--cream-dark)', boxShadow: 'var(--shadow-lg)', height: 350 }}>
              <iframe
                title="Brews and Memories Cafe Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3818.245682380596!2d75.71334267461603!3d16.863736917680278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc65571521cbf25%3A0x8c034c8193bdc099!2sBrews%20and%20Memories%20cafe!5e0!3m2!1sen!2sus!4v1780667200850!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Got Questions?</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Frequently Asked <em>Questions</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div className="faq-container">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => handleToggleFaq(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  type="button"
                >
                  <span>{faq.q}</span>
                  <span className="faq-icon" aria-hidden="true">+</span>
                </button>
                {isOpen && (
                  <div className="faq-answer" id={`faq-answer-${index}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


    </div>
  );
}

export default Home;
