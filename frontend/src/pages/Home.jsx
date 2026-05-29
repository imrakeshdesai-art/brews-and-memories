import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const FEATURED_CATEGORIES = [
  { emoji: '☕', label: 'Coffee', category: 'Beverages' },
  { emoji: '🍕', label: 'Pizza', category: 'Pizza' },
  { emoji: '🍔', label: 'Burgers', category: 'Burgers' },
  { emoji: '🍝', label: 'Pasta', category: 'Pasta' },
  { emoji: '🍫', label: 'Desserts', category: 'Desserts' },
  { emoji: '🥤', label: 'Shakes', category: 'Milk Shakes' },
  { emoji: '🥟', label: 'Momos', category: 'Momos' },
  { emoji: '🥪', label: 'Sandwiches', category: 'Sandwiches' },
];

const FAVORITES = [
  {
    name: 'Cold Coffee',
    price: 89,
    emoji: '☕',
    desc: 'Classic chilled coffee blend - rich, creamy, and perfectly refreshing.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    item: { name: 'Cold Coffee', price: 89, emoji: '☕', desc: 'Classic chilled coffee blend' }
  },
  {
    name: 'Cappuccino',
    price: 79,
    emoji: '☕',
    desc: 'Espresso shot with velvety frothed milk and a light dust of cocoa powder.',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    item: { name: 'Cappuccino', price: 79, emoji: '☕', desc: 'Cappuccino' }
  },
  {
    name: 'White Sauce Pasta',
    price: 199,
    emoji: '🍝',
    desc: 'Creamy Alfredo pasta tossed with fresh mushrooms, broccoli, and rich parmesan.',
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
    item: { name: 'Alfredo Pasta', price: 199, emoji: '🍝', desc: 'Alfredo Pasta' }
  },
  {
    name: 'Farmhouse Pizza',
    price: 149,
    emoji: '🍕',
    desc: 'Loaded with bell peppers, sweet corn, mushrooms, tomatoes, and extra mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    item: { name: 'Farmhouse Pizza', price: 149, emoji: '🍕', desc: 'Loaded with farm fresh veggies and melted mozzarella' }
  },
  {
    name: 'Brownie with Ice Cream',
    price: 149,
    emoji: '🔥',
    desc: 'Sizzling walnut brownie topped with hot chocolate fudge and a scoop of premium vanilla ice cream.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    item: { name: 'Sizzling Brownie', price: 149, emoji: '🔥', desc: 'Sizzling Brownie' }
  }
];

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', caption: 'Warm Cozy Cafe Ambience' },
  { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', caption: 'Freshly Brewed Speciality Coffee' },
  { url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', caption: 'Comfortable Seating and Vibe' },
  { url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', caption: 'Creamy Alfredo White Pasta' },
  { url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80', caption: 'Fresh Hand-Tossed Pizzas' },
  { url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', caption: 'Irresistible Hot Desserts' }
];

const INSTAGRAM_MOCKS = [
  { url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=500&q=80', likes: '124', comments: '18' },
  { url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80', likes: '98', comments: '12' },
  { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80', likes: '210', comments: '34' },
  { url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=500&q=80', likes: '156', comments: '22' }
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
      {/* PREMIUM SPLIT HERO */}
      <section className="hero-section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '120px 20px 80px' }}>
        <div className="hero-container">
          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div className="hero-badge" style={{ background: 'var(--cream)', color: 'var(--green)', fontWeight: 700, padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span className="dot" style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
                Open Daily · 10:00 AM – 10:30 PM
              </div>
              <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                📍 B.M. Patil Circle, Vijayapura
              </span>
            </div>

            <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, color: 'var(--cream)', fontWeight: 800, margin: 0 }}>
              Brews &amp;<br />
              <span style={{ color: '#fbbf24', fontFamily: "'Dancing Script', cursive" }}>Memories</span>
            </h1>
            <p className="hero-tagline" style={{ fontSize: '1.25rem', color: 'rgba(245, 230, 200, 0.9)', margin: 0, fontWeight: 500 }}>
              Vijayapura's Favorite Cozy Cafe, Coffee &amp; More
            </p>

            <div className="hero-rating" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>⭐ 4.8 / 5</span>
                <span style={{ color: 'rgba(245,230,200,0.7)', fontSize: '0.85rem' }}>based on 500+ Google Reviews</span>
              </div>
            </div>

            <p className="hero-quote" style={{ fontStyle: 'italic', color: 'rgba(245, 230, 200, 0.8)', margin: '4px 0 12px', fontSize: '0.95rem', borderLeft: '3px solid #fbbf24', paddingLeft: 12 }}>
              "Exceptional ambiance, delicious pure veg bites, and premium specialty coffee."
            </p>

            <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/menu" className="btn-primary" style={{ padding: '14px 28px', fontSize: '0.95rem', minWidth: 150, textAlign: 'center' }}>
                🍽️ View Menu
              </Link>
              <button 
                onClick={openReserve} 
                className="btn-outline" 
                style={{ padding: '14px 28px', fontSize: '0.95rem', minWidth: 150, textAlign: 'center', background: 'transparent', border: '2px solid var(--cream)', color: 'var(--cream)' }}
                aria-label="Open reservation popup modal"
              >
                📅 Book Table
              </button>
              <a 
                href="/menu.pdf" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline"
                style={{ padding: '14px 28px', fontSize: '0.95rem', minWidth: 170, textAlign: 'center', background: 'transparent', border: '2px solid rgba(245,230,200,0.5)', color: 'var(--cream-dark)' }}
                aria-label="Download menu PDF"
              >
                📥 Download PDF Menu
              </a>
              <a 
                href="https://maps.google.com/?q=B+M+Patil+Circle+Vijayapura+Karnataka+586102"
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline"
                style={{ padding: '14px 28px', fontSize: '0.95rem', minWidth: 160, textAlign: 'center', background: 'transparent', border: '2px solid rgba(245,230,200,0.5)', color: 'var(--cream-dark)' }}
                aria-label="Get directions to the cafe on google maps"
              >
                🗺️ Get Directions
              </a>
            </div>
          </div>

          <div className="hero-media">
            <img 
              src="/ambiance.webp" 
              alt="Cozy ambient coffee house interiors of Brews & Memories Vijayapura"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US (UPGRADED GRID) */}
      <section className="section" style={{ background: '#fff', padding: '80px 20px' }}>
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
            <div key={item.title} className="card" style={{ cursor: 'default', background: 'var(--cream-light)', border: '1px solid var(--cream-dark)', padding: '30px 24px', borderRadius: 12 }}>
              <div className="card-icon" style={{ fontSize: '2.5rem', marginBottom: 16 }}>{item.icon}</div>
              <div className="card-title" style={{ fontSize: '1.15rem', color: 'var(--green)', fontWeight: 700, marginBottom: 10 }}>{item.title}</div>
              <div className="card-copy" style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.9rem' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE WHAT WE SERVE (CATEGORIES) */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '60px 20px' }}>
        <div className="section-header" style={{ marginBottom: 36, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Explore Our Menu</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Explore What We <em>Serve</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={`/menu?category=${encodeURIComponent(cat.category)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fff',
                  border: '1px solid var(--cream-dark)',
                  borderRadius: 12,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{cat.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green)' }}>{cat.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/menu" className="btn-primary" style={{ display: 'inline-block', padding: '12px 30px' }}>
            📖 View Full Detailed Menu
          </Link>
        </div>
      </section>

      {/* CUSTOMER FAVORITES (POPULAR DISHES) */}
      <section className="section" style={{ background: '#fff', padding: '85px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Top Rated Selections</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Customer <em>Favorites</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30, maxWidth: 1100, margin: '0 auto' }}>
          {FAVORITES.map((dish) => (
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
                boxShadow: 'var(--shadow)'
              }}
            >
              <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
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
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', borderRadius: 8, cursor: 'pointer' }}
                  >
                    🛒 Quick Add
                  </button>
                  <Link 
                    to="/menu" 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', borderRadius: 8, textDecoration: 'none', textAlign: 'center', color: 'var(--green)', borderColor: 'var(--green)' }}
                  >
                    Explore More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AMBIENCE & FOOD GALLERY */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Vibe Checklist</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Our Ambient <em>Gallery</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div className="gallery-grid">
          {GALLERY_IMAGES.map((img, index) => (
            <div 
              key={index} 
              className="gallery-item"
              onClick={() => handleOpenLightbox(img.url, img.caption)}
              aria-label={`Open photo of ${img.caption} in popup`}
            >
              <img src={img.url} alt={img.caption} loading="lazy" />
              <div className="gallery-overlay">
                <span>🔍 View Closeup</span>
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

      {/* MOCK INSTAGRAM FEED */}
      <section className="section" style={{ background: 'var(--cream-light)', padding: '80px 20px' }}>
        <div className="section-header" style={{ marginBottom: 40, textAlign: 'center' }}>
          <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Follow Us @brews_and_memories_</span>
          <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Share Your <em>Moments</em></h2>
          <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
        </div>

        <div className="instagram-grid">
          {INSTAGRAM_MOCKS.map((post, idx) => (
            <a 
              key={idx} 
              href="https://www.instagram.com/brews_and_memories_/" 
              target="_blank" 
              rel="noreferrer" 
              className="instagram-item"
              aria-label={`View post with ${post.likes} likes and ${post.comments} comments on Instagram`}
            >
              <img src={post.url} alt={`Cozy coffee memories instagram mock post ${idx + 1}`} loading="lazy" />
              <div className="instagram-overlay">
                <span>❤️ {post.likes} Likes</span>
                <span>💬 {post.comments} Comments</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* GOOGLE MAPS EMBED */}
      <section className="section" style={{ padding: 0, position: 'relative', height: 400, background: 'var(--cream-light)' }}>
        <iframe
          title="Google Map embed location of Brews & Memories Cafe at B M Patil Circle Vijayapura"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.5794503716616!2d75.70327361118671!3d16.822765383921865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5d481f9b3e107%3A0x334460f9ec347101!2sB%20M%20Patil%20Circle%2C%20Vijayapura%2C%20Karnataka%20586102!5e0!3m2!1sen!2sin!4v1717000000000"
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
            <img src={lightboxImage} alt={lightboxCaption} />
            <div className="lightbox-caption">{lightboxCaption}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
