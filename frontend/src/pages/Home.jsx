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

// User-generated content from real customers tagging @brews_and_memories_
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
    username: 'aditya_k',
    initials: 'AK',
    image: '/images/instagram/pizza.webp',
    caption: 'Fresh, cheesy, and 100% pure veg! Outstanding Peri Peri Paneer Pizza at @brews_and_memories_ 🍕😋 def coming back.',
    likes: 312,
    comments: 48,
    date: 'May 05, 2026',
    postUrl: 'https://www.instagram.com/p/DSHhXKkDakg/?igsh=ZXNkZnRqbjkxanFi'
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
      <section className="hero-section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '105px 20px 48px', minHeight: 'auto' }}>
        <div className="hero-container" style={{ gap: 32 }}>
          
          {/* Left Column: Copy & Actions */}
          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', lineHeight: 1.12, color: 'var(--cream)', fontWeight: 800, margin: 0 }}>
              Brews &amp;<br />
              <span style={{ color: '#fbbf24', fontFamily: "'Dancing Script', cursive" }}>Memories</span>
            </h1>

            {/* Social Proof Rating Badge directly under the title */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', color: '#fbbf24', fontWeight: 700, fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)' }}>
              <span>⭐⭐⭐⭐⭐</span>
              <span style={{ color: 'var(--cream)' }}>4.8/5 Rating</span>
              <span style={{ color: 'rgba(245, 230, 200, 0.4)', fontWeight: 400 }}>|</span>
              <a 
                href="https://maps.app.goo.gl/2fYwvrLgfTP9ytBW7" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: '#fbbf24', textDecoration: 'underline', cursor: 'pointer' }}
              >
                500+ Google Reviews
              </a>
            </div>

            {/* Tagline explaining what the business is and why it's special */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0 8px' }}>
              <p className="hero-tagline" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.65rem)', color: '#fbbf24', margin: 0, fontWeight: 800, lineHeight: 1.3 }}>
                Premium Coffee &amp; Pure Veg Café in Vijayapura
              </p>
              <p className="hero-subtitle" style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', color: 'rgba(245, 230, 200, 0.85)', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                Fresh brews, delicious food, and a cozy atmosphere.
              </p>
            </div>

            {/* Simplified CTA buttons with clear hierarchy (2 buttons maximum) */}
            <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
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
                  minWidth: 190, 
                  textAlign: 'center', 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)' 
                }}
                aria-label="Book a table now"
              >
                📅 Reserve A Table
              </button>
              <Link 
                to="/menu" 
                className="btn-outline" 
                style={{ 
                  padding: '14px 32px', 
                  fontSize: '1.02rem', 
                  fontWeight: 700, 
                  borderRadius: 8, 
                  minWidth: 160, 
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
              <div className="collage-item pizza" title="Wood-Fired Peri Peri Paneer Pizza">
                <img src="/images/instagram/pizza.webp" alt="Freshly baked Peri Peri Paneer Pizza" />
              </div>
              {/* Coffee Card (Overlapping) */}
              <div className="collage-item coffee" title="Creamy Cold Coffee">
                <img src="/images/instagram/cold_coffee.webp" alt="Signature Hazelnut Cold Coffee" />
              </div>
              {/* Ambiance Card (Small Overlapping) */}
              <div className="collage-item ambiance" title="Cozy Outdoor Seating">
                <img src="/images/instagram/ambience_night.webp" alt="Cozy outdoor garden seating ambiance at night" />
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
            { icon: '☕', title: 'Freshly Roasted Coffee', desc: 'Expertly sourced and roasted Arabica beans brewed to absolute perfection by skilled baristas.' },
            { icon: '🍕', title: 'Wood-Fired Pizza', desc: 'Deliciously fresh, cheesy, hand-tossed vegetarian pizzas baked hot out of the oven.' },
            { icon: '🛋️', title: 'Family-Friendly Seating', desc: 'Cozy modern seating, warm ambient lighting, and group tables perfect for get-togethers.' },
            { icon: '🔌', title: 'Free Wi-Fi & Work Space', desc: 'High-speed internet access and plenty of accessible charging ports at seating locations.' },
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
                    fontSize: '0.8rem',
                    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)'
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
                  <strong style={{ color: 'var(--green)', marginRight: 6 }}>{post.username}</strong>
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

      {/* GOOGLE REVIEWS SUMMARY BANNER */}
      <section className="section" style={{ background: '#fff', padding: '60px 20px' }}>
        <div style={{ maxWidth: 850, margin: '0 auto', textAlign: 'center', background: 'var(--cream-light)', padding: '40px 30px', borderRadius: 16, border: '1px solid var(--cream-dark)', boxShadow: 'var(--shadow)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }} aria-hidden="true">⭐️</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '0 0 12px' }}>Loved by Local Foodies</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 24px', fontStyle: 'italic' }}>
            "Rated 4.8/5 stars based on 500+ Google Reviews. Our guests love the signature cold coffee, fresh pizzas, and cozy garden vibe!"
          </p>
          <Link 
            to="/reviews" 
            className="btn-primary" 
            style={{ 
              display: 'inline-block', 
              padding: '12px 32px', 
              textDecoration: 'none', 
              color: '#0f3d3e', 
              background: '#fbbf24',
              fontWeight: 800,
              borderRadius: 8
            }}
          >
            ⭐ Read Guest Reviews
          </Link>
        </div>
      </section>

      {/* RESERVATION CTA BANNER */}
      <section className="section" style={{ background: 'var(--green)', color: 'var(--cream)', padding: '60px 20px' }}>
        <div style={{ maxWidth: 850, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }} aria-hidden="true">📅</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--cream)', margin: '0 0 12px' }}>Reserve Your Table</h2>
          <p style={{ color: 'rgba(245, 230, 200, 0.85)', fontSize: '1.02rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            ⏳ Weekend tables and evening slots fill up quickly. Book your table today to secure your space for dates, family get-togethers, or work sessions!
          </p>
          <button 
            onClick={openReserve} 
            className="btn-primary" 
            style={{ 
              display: 'inline-block', 
              padding: '14px 36px', 
              textDecoration: 'none', 
              color: '#0f3d3e', 
              background: '#fbbf24',
              fontWeight: 800,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(251, 191, 36, 0.3)'
            }}
          >
            Reserve Table Now
          </button>
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
              <div>📍 <strong>Address:</strong> B.M. Patil Circle, Vijayapura, Karnataka 586102</div>
              <div>🕒 <strong>Hours:</strong> Open Daily · 10:00 AM – 10:30 PM</div>
              <div>📞 <strong>Contact:</strong> +91 99454 46137</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid var(--cream-dark)', padding: '28px', borderRadius: 16, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }} aria-hidden="true">🗺️</span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--green)', margin: '0 0 10px' }}>Need Directions?</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.5, margin: '0 0 20px' }}>
                Open Google Maps to get real-time navigation directions to our cafe right away.
              </p>
              <a 
                href="https://maps.app.goo.gl/2fYwvrLgfTP9ytBW7"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none', background: '#fbbf24', color: '#0f3d3e', fontWeight: 800, borderRadius: 8 }}
              >
                🗺️ Get Directions on Maps
              </a>
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
