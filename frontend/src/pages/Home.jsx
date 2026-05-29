import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { menuData } from '../data/menuData';

const FEATURED_CATEGORIES = [
  { image: '/images/menu/cold_coffee.png', label: 'Cold Coffee', category: 'Cold Beverages' },
  { image: '/images/menu/pizza_pull.png', label: 'Pizzas', category: 'Pizza' },
  { image: '/images/menu/burger.png', label: 'Burgers', category: 'Burgers' },
  { image: '/images/menu/club_sandwich.png', label: 'Sandwiches', category: 'Sandwiches' },
  { image: '/images/menu/shake.png', label: 'Milkshakes', category: 'Milk Shakes' },
  { image: '/images/menu/momos.png', label: 'Momos', category: 'Momos' },
  { image: '/images/menu/pasta.png', label: 'Maggi', category: 'Maggi' },
  { image: '/images/menu/cold_coffee.png', label: 'Hot Drinks', category: 'Beverages' },
];

const FAVORITES_CONFIG = [
  {
    category: 'Cold Beverages',
    name: 'Cold Coffee',
    badge: 'Customer Favorite',
    image: '/images/menu/cold_coffee.png',
    desc: 'Chilled and refreshing specialty cold coffee - creamy, rich, and Vijayapura\'s most popular drink.'
  },
  {
    category: 'Pizza',
    name: 'Peri Peri Paneer Pizza',
    badge: 'Most Ordered',
    image: '/images/menu/pizza_pull.png',
    desc: 'Hand-tossed crust topped with spicy peri peri paneer, crisp capsicum, onion, and melted mozzarella.'
  },
  {
    category: 'Sandwiches',
    name: 'Veg Club Sandwich',
    badge: 'Staff Pick',
    image: '/images/menu/club_sandwich.png',
    desc: 'Crispy double-decker toasted sandwich loaded with fresh veggies, butter spreads, and melted cheese.'
  },
  {
    category: 'Burgers',
    name: 'Veg Burger',
    badge: 'Customer Favorite',
    image: '/images/menu/burger.png',
    desc: 'Crispy golden veg patty in soft toasted buns with fresh lettuce, tomatoes, onions, and creamy burger sauce.'
  }
];

// Sourced directly from official Instagram handle @brews_and_memories_
const INSTAGRAM_POSTS = [
  {
    image: '/images/instagram/birthday_celebration.png',
    caption: '🎉 Creating beautiful memories at Brews & Memories! Book your private birthday table decoration for free.',
    likes: 245,
    comments: 34,
    date: 'May 18, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
  },
  {
    image: '/images/instagram/post1.png',
    caption: '🥤 Beat the summer heat with Vijayapura\'s most popular Hazelnut Cold Coffee! Creamy, rich, and freshly brewed. 🤎',
    likes: 189,
    comments: 24,
    date: 'May 12, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
  },
  {
    image: '/images/instagram/post2.png',
    caption: '🍕 Fresh, cheesy, and hand-tossed Peri Peri Paneer Pizza hot out of the oven! 100% pure vegetarian goodness. 😋',
    likes: 312,
    comments: 48,
    date: 'May 05, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
  },
  {
    image: '/images/instagram/post3.png',
    caption: '🥪 A delicious, crispy double-decker Veg Club Sandwich paired with golden fries. Perfect evening snack! 🍟',
    likes: 156,
    comments: 18,
    date: 'Apr 28, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
  },
  {
    image: '/images/instagram/post4.png',
    caption: '✨ Slow down, relax, and create memories in our cozy modern café interior. Come for the coffee, stay for the vibe. 🛋️',
    likes: 278,
    comments: 16,
    date: 'Apr 20, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
  },
  {
    image: '/images/instagram/post5.png',
    caption: '🍔 Our premium Veg Burger - a crispy golden patty with fresh lettuce, tomatoes, and secret sauce inside soft toasted buns. 😋',
    likes: 210,
    comments: 29,
    date: 'Apr 12, 2026',
    postUrl: 'https://www.instagram.com/brews_and_memories_/'
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

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [lightboxCaption, setLightboxCaption] = useState('');

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
  };

  const handleOpenLightbox = (url, caption) => {
    setLightboxImage(url);
    setLightboxCaption(caption);
    setIsLightboxOpen(true);
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
      {/* COMPACT & BALANCED PREMIUM HERO */}
      <section className="hero-section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '95px 20px 48px', minHeight: 'auto' }}>
        <div className="hero-container" style={{ gap: 32 }}>
          
          {/* Left Column: Copy & Actions */}
          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Timings and Google rating trust badge */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div className="hero-badge" style={{ background: 'var(--cream)', color: 'var(--green)', fontWeight: 700, padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span className="dot" style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
                Open Daily · 10 AM – 10:30 PM
              </div>
              <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                ⭐ 4.8 / 5 Rated Café
              </span>
            </div>

            <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', lineHeight: 1.15, color: 'var(--cream)', fontWeight: 800, margin: 0 }}>
              Brews &amp;<br />
              <span style={{ color: '#fbbf24', fontFamily: "'Dancing Script', cursive" }}>Memories</span>
            </h1>

            {/* Tagline size enlarged for readability */}
            <p className="hero-tagline" style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.6rem)', color: 'var(--cream-dark)', margin: 0, fontWeight: 700, lineHeight: 1.35, letterSpacing: '0.3px' }}>
              Vijayapura's Favorite Cozy Cafe, Coffee &amp; More
            </p>

            {/* Strong Customer Review Proof Snippet */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderLeft: '4px solid #fbbf24', padding: '12px 16px', borderRadius: '0 8px 8px 0', margin: '4px 0 8px' }}>
              <div style={{ display: 'flex', gap: 4, color: '#fbbf24', fontSize: '1rem', marginBottom: 4 }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontStyle: 'italic', color: 'rgba(245, 230, 200, 0.85)', margin: 0, fontSize: '0.88rem', lineHeight: 1.4 }}>
                "Absolutely love their cold coffee and paneer pizza! The vibe is unmatched, best café in Vijayapura."
              </p>
              <div style={{ fontSize: '0.75rem', color: 'rgba(245,230,200,0.6)', marginTop: 4, fontWeight: 700 }}>— Verified Google Review</div>
            </div>

            {/* Structured CTA buttons with clear hierarchy */}
            <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link 
                to="/menu" 
                className="btn-primary" 
                style={{ 
                  background: '#fbbf24', 
                  color: '#0f3d3e', 
                  padding: '14px 28px', 
                  fontSize: '0.98rem', 
                  fontWeight: 800, 
                  borderRadius: 8, 
                  minWidth: 150, 
                  textAlign: 'center', 
                  border: 'none', 
                  boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)' 
                }}
              >
                🟢 View Menu
              </Link>
              <button 
                onClick={openReserve} 
                className="btn-outline" 
                style={{ 
                  padding: '14px 28px', 
                  fontSize: '0.98rem', 
                  fontWeight: 700, 
                  borderRadius: 8, 
                  minWidth: 190, 
                  textAlign: 'center', 
                  background: 'transparent', 
                  border: '2px solid #fbbf24', 
                  color: '#fbbf24' 
                }}
                aria-label="Book a table now popup"
              >
                📅 Reserve Your Table
              </button>
              <a 
                href="https://maps.app.goo.gl/2fYwvrLgfTP9ytBW7?g_st=ac"
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline"
                style={{ 
                  padding: '14px 24px', 
                  fontSize: '0.92rem', 
                  fontWeight: 600, 
                  borderRadius: 8, 
                  background: 'transparent', 
                  border: '2px solid rgba(245,230,200,0.4)', 
                  color: 'var(--cream-dark)',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
                aria-label="Get directions to the cafe on google maps"
              >
                🗺️ Get Directions
              </a>
            </div>
          </div>

          {/* Right Column: Hero Media with Overlay Trust Cards */}
          <div className="hero-media" style={{ position: 'relative' }}>
            <img 
              src="/ambiance.webp" 
              alt="Real interior ambiance of Brews & Memories Vijayapura"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Overlay Bestseller Food Card */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(15, 61, 62, 0.92)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(245,230,200,0.2)', color: 'var(--cream)', maxWidth: 220, textAlign: 'left', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 800, marginBottom: 2 }}>🔥 Best Sellers</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Hazelnut Cold Coffee & Pizza</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,230,200,0.7)', marginTop: 2 }}>Order our signature combo now!</div>
            </div>

            {/* Overlay Count Stat Card */}
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.96)', padding: '8px 14px', borderRadius: 8, color: 'var(--green)', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>50+</div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-light)', fontWeight: 800, marginTop: 2 }}>Dishes & Brews</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOVE-THE-FOLD SOCIAL PROOF TRUST BADGES BAR */}
      <section style={{ background: 'var(--cream-light)', borderBottom: '1px solid var(--cream-dark)', padding: '20px 10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px 48px', maxWidth: 1100, margin: '0 auto' }}>
          {[
            { badge: '🏆', title: '500+ Google Reviews', sub: 'Rated 4.8 Stars' },
            { badge: '☕', title: 'Specialty Coffee', sub: '100% Arabica Brews' },
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

      {/* WHY CHOOSE US */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Why Brews & Memories</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Crafting Experiences For <em>You</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>
        
        <div className="grid-4" style={{ maxWidth: 1100, margin: '0 auto', gap: 24 }}>
          {[
            { icon: '☕', title: 'Premium Specialty Coffee', desc: 'Expertly sourced and roasted coffee beans brewed to absolute perfection by skilled baristas.' },
            { icon: '🌿', title: '100% Pure Vegetarian', desc: 'A wide range of delicious, fresh, and hygienic pure vegetarian snack selections and heavy bites.' },
            { icon: '🔌', title: 'Work & Chill Friendly', desc: 'Equipped with high-speed free Wi-Fi and accessible power outlets at seating spots.' },
            { icon: '🛋️', title: 'Signature Ambiance', desc: 'Cozy modern seating, mellow warm lighting, and calm chill music to help you create memories.' },
          ].map((item) => (
            <div key={item.title} className="card" style={{ cursor: 'default', background: '#fff', border: '1px solid var(--cream-dark)', padding: '30px 24px', borderRadius: 12 }}>
              <div className="card-icon" style={{ fontSize: '2.5rem', marginBottom: 16 }}>{item.icon}</div>
              <div className="card-title" style={{ fontSize: '1.15rem', color: 'var(--green)', fontWeight: 700, marginBottom: 10 }}>{item.title}</div>
              <div className="card-copy" style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.9rem' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE WHAT WE SERVE (CATEGORIES - IMAGES INSTEAD OF EMOJIS) */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 36, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Explore Our Menu</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Explore What We <em>Serve</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
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
                <div style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
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
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button 
                    onClick={() => handleAddFavorite(dish.item)}
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px 14px', fontSize: '0.85rem', borderRadius: 8, cursor: 'pointer', border: 'none', background: '#fbbf24', color: '#0f3d3e', fontWeight: 800 }}
                  >
                    🛒 Quick Add
                  </button>
                  <Link 
                    to="/menu" 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '12px 14px', fontSize: '0.85rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center', color: 'var(--green)', borderColor: 'var(--green)' }}
                  >
                    Explore More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 & 3: AMBIENT INSTAGRAM GALLERY & TRUST / AUTHENTICITY */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Real Instagram Moments</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Share Your <em>Moments</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        {/* Modern Instagram-style Gallery Grid (Sourced from official handle) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30, maxWidth: 1100, margin: '0 auto' }}>
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
              {/* Instagram Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--cream-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--cream-dark)' }}>
                    <img src="/logo.jpg" alt="Logo avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--green)', lineHeight: 1 }}>brews_and_memories_</div>
                    <small style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Vijayapura, Karnataka</small>
                  </div>
                </div>
                {/* Instagram Icon */}
                <span style={{ fontSize: '1.25rem', color: '#c13584' }}>📸</span>
              </div>

              {/* Card Image */}
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

              {/* Instagram Card Body / Engagement stats */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                
                {/* Like & Comment Counts */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cream-light)', paddingBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)' }}>
                    <span>❤️ {post.likes} Likes</span>
                    <span>💬 {post.comments} Comments</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600 }}>{post.date}</span>
                </div>

                {/* Caption Description */}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5, margin: 0, flexGrow: 1 }}>
                  <strong style={{ color: 'var(--green)', marginRight: 6 }}>brews_and_memories_</strong>
                  {post.caption}
                </p>

                {/* Card Button footer (Instagram themed) */}
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
                    <span>🔗 View Instagram Post</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IN-PAGE RESERVATION FORM */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 40, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Instant Booking</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Reserve A <em>Table</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div className="reservation-form-container">
          {resSuccess ? (
            <div className="order-success" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--green)', margin: '0 0 10px' }}>Request Submitted!</h3>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                Thank you, <strong>{resName}</strong>! We have received your booking request for <strong>{resGuests} guests</strong> on <strong>{resDate}</strong> at <strong>{resTime}</strong>.
              </p>
              <div className="order-card" style={{ textAlign: 'left', background: 'var(--cream-light)', padding: 16, borderRadius: 8, border: '1px solid var(--cream-dark)', display: 'inline-block', width: '100%', margin: '16px 0' }}>
                <div><strong>Status:</strong> Pending SMS Confirmation</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 4 }}>
                  We will verify seat availability and text confirmation to {resPhone} shortly.
                </div>
              </div>
              <button className="btn-primary" type="button" onClick={resetResForm} style={{ padding: '10px 24px', display: 'inline-block', margin: '8px auto 0' }}>
                Make Another Booking
              </button>
            </div>
          ) : (
            <form onSubmit={handleInPageReserve} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {resError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {resError}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="hp-reserve-name" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Your Name *</label>
                <input
                  id="hp-reserve-name"
                  type="text"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  placeholder="Enter full name"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hp-reserve-phone" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Phone Number *</label>
                <input
                  id="hp-reserve-phone"
                  type="tel"
                  value={resPhone}
                  onChange={(e) => setResPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hp-reserve-guests" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Number of Guests *</label>
                  <select
                    id="hp-reserve-guests"
                    value={resGuests}
                    onChange={(e) => setResGuests(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', background: '#fff', outline: 'none' }}
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="6">6 People</option>
                    <option value="7">7+ People (Party)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="hp-reserve-time" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Preferred Time *</label>
                  <select
                    id="hp-reserve-time"
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', background: '#fff', outline: 'none' }}
                    required
                  >
                    <option value="">Select Slot</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="7:30 PM">7:30 PM</option>
                    <option value="9:00 PM">9:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="hp-reserve-date" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Select Date *</label>
                <input
                  id="hp-reserve-date"
                  type="date"
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hp-reserve-notes" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, display: 'block' }}>Special Requests (Optional)</label>
                <textarea
                  id="hp-reserve-notes"
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  placeholder="e.g. Birthday setup, corner table, wheelchair accessible space..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--cream-dark)', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button className="btn-primary" type="submit" style={{ padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: 8, marginTop: 8 }}>
                📅 Confirm Reservation Request
              </button>
            </form>
          )}
        </div>
      </section>

      {/* GOOGLE MAPS EMBED */}
      <section className="section" style={{ padding: 0, position: 'relative', height: 400, background: 'var(--cream-light)' }}>
        <iframe
          title="Google Map embed location of Brews & Memories Cafe at B M Patil Circle Vijayapura"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.5583151834246!2d75.70057147597148!3d16.823621218768007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5da002e21ca6b%3A0x5e0f7227d8db546!2sBrews%20%26%20Memories!5e0!3m2!1sen!2sin!4v1717000000000"
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
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

      {/* GALLERY LIGHTBOX */}
      {isLightboxOpen && (
        <div 
          className="lightbox-backdrop" 
          onClick={() => setIsLightboxOpen(false)} 
          role="dialog" 
          aria-modal="true"
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lightbox-close" 
              onClick={() => setIsLightboxOpen(false)} 
              aria-label="Close Lightbox view"
              type="button"
            >
              ✕
            </button>
            <img src={lightboxImage} alt={lightboxCaption} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8 }} />
            <div className="lightbox-caption" style={{ padding: '16px 8px', fontSize: '0.92rem', background: 'rgba(0,0,0,0.85)', borderRadius: '0 0 8px 8px', marginTop: -4 }}>
              {lightboxCaption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
