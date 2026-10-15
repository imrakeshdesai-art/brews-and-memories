import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { menuData } from '../data/menuData';
import useSEO from '../hooks/useSEO';

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
    desc: 'Slow-brewed and blended specialty cold coffee — chilled, rich, and finished with decadent chocolate swirl.'
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
    name: 'The Moras Signature Maggi',
    badge: 'Best Seller',
    image: '/images/menu/items/B&M Signature Maggi.webp',
    desc: 'Our signature masala Maggi loaded with sweet corn, green peas, carrots, herbs and naturally melted cheese.'
  }
];

const VERIFIED_HOME_REVIEWS = [
  {
    name: 'Govindraj Pujari',
    initials: 'GP',
    rating: 5,
    date: 'Google Review · 4 months ago',
    text: 'Best place... the spot! 😊 Great ambiance, tasty brews, and chill vibes. You and your squad will have a blast there!'
  },
  {
    name: 'Priya S.',
    initials: 'PS',
    rating: 5,
    date: 'Google Review · 1 month ago',
    text: 'Food is very delicious and highly recommended. The paneer pizza was absolutely loaded with toppings. Will definitely come back!'
  },
  {
    name: 'Sagar Lamani',
    initials: 'SL',
    rating: 5,
    date: 'Google Review · Recent',
    text: 'Good taste and nice atmosphere. Perfect place to dine in with friends after a long day in Vijayapura.'
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
function Home({ openReserve }) {
  useSEO({
    isHome: true,
    description: 'Welcome to The Moras Cafe at B.M. Patil Circle, Vijayapura. Enjoy freshly brewed coffee, pizzas, pasta, sizzling brownie, and cozy ambiance.'
  });


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
    <div className="home-page-editorial">
      {/* CHAPTER 1: THE EDITORIAL HERO (SPLIT ATMOSPHERE CANVAS) */}
      <section className="hero-editorial-section">
        <div className="hero-editorial-overlay" />
        <div className="hero-editorial-container">
          {/* Left Column: Brand Story & CTAs */}
          <div className="hero-editorial-copy">
            <div className="hero-reference-pretitle">
              Welcome to
            </div>
            <h1 className="hero-reference-brand-title">
              The Moras Cafe
            </h1>
            <div className="hero-reference-tagline">
              “The Place That Knows You”
            </div>
            <p className="hero-editorial-lead">
              Where freshly ground espresso meets warm conversations, artisan pizzas, curated books, and slow, unforgettable moments in Vijayapura.
            </p>
            <div className="hero-editorial-actions">
              <Link to="/menu" className="btn-editorial-primary">
                Explore Our Menu
              </Link>
              <button type="button" onClick={openReserve} className="btn-editorial-outline">
                Book a Table
              </button>
            </div>
            <div className="hero-trust-strip">
              <div className="hero-trust-item">
                <span className="hero-trust-star">★</span> <strong>4.8</strong> Rating
              </div>
              <span className="hero-trust-dot">•</span>
              <div className="hero-trust-item">
                <strong>100%</strong> Pure Veg
              </div>
              <span className="hero-trust-dot">•</span>
              <div className="hero-trust-item">
                B.M. Patil Circle
              </div>
            </div>
          </div>

          {/* Right Column: Genuine Atmosphere Showcase */}
          <div className="hero-editorial-visual">
            <div className="hero-visual-frame">
              <picture>
                <source srcSet="/images/instagram/hero_garden_evening.webp" type="image/webp" />
                <img 
                  src="/images/instagram/hightide_sagar.jpeg" 
                  alt="The Moras Cafe authentic open-air garden terrace dining table under warm evening pendant lights in Vijayapura"
                  className="hero-visual-img"
                  loading="eager"
                  decoding="async"
                />
              </picture>
              <div className="hero-visual-badge">
                <span className="hero-badge-dot">●</span>
                <span>Open-Air Garden Sanctuary</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: THE MORAS VIBE & CRAFT (EDITORIAL LAYERED COLLAGE) */}
      <section className="section-editorial craft-story-section">
        {/* Background Ambient Watermark Motif */}
        <div className="craft-watermark-bg" aria-hidden="true" />

        <div className="craft-grid">
          {/* Layered Collage Column */}
          <div className="craft-collage-wrap">
            {/* Base Ambient Frame */}
            <div className="craft-image-frame">
              <img 
                src="/ambiance.webp" 
                alt="The Moras Cafe cozy ambient interior in Vijayapura" 
                className="craft-image"
                loading="lazy"
              />
              <div className="craft-floating-badge">
                <span>Cozy · Books · Games · Coffee</span>
              </div>
            </div>

            {/* Official Circular Stamp Seal */}
            <div className="craft-seal-badge" aria-hidden="true">
              <img 
                src="/images/brand/secondary-badge-light.png" 
                alt="The Moras Cafe Official Seal" 
                className="craft-seal-img" 
                loading="lazy"
              />
            </div>
          </div>

          {/* Editorial Story Content */}
          <div className="craft-content">
            <span className="editorial-label">The Experience</span>
            <h2 className="editorial-heading">
              More Than a Cafe.<br />
              <em>A Space to Slow Down.</em>
            </h2>
            <div className="editorial-divider" />
            <p className="editorial-body-text">
              <strong>The Moras Cafe</strong> was born out of a simple idea — to bring authentic, slow-crafted coffee and comforting pure-vegetarian dining to Vijayapura, prepared with passion and the warmth of home. Whether you’re working over an iced hazelnut brew, diving into our complimentary library of books, or challenging friends over board games, our café is your neighborhood sanctuary.
            </p>

            <div className="craft-pillars-list">
              <div className="craft-pillar">
                <span className="pillar-num">01</span>
                <div>
                  <h4>Artisan Coffee &amp; Shakes</h4>
                  <p>Freshly ground espresso brews, handcrafted frappes, and indulgent thick shakes.</p>
                </div>
              </div>
              <div className="craft-pillar">
                <span className="pillar-num">02</span>
                <div>
                  <h4>Fresh Pure-Veg Dining</h4>
                  <p>Crispy stone-baked pizzas, loaded double-decker grilled sandwiches, and sizzling brownie treats.</p>
                </div>
              </div>
              <div className="craft-pillar">
                <span className="pillar-num">03</span>
                <div>
                  <h4>Books &amp; Tabletop Games</h4>
                  <p>Unplug from screens with classic chess, Jenga, Uno, and curated bestselling paperbacks.</p>
                </div>
              </div>
            </div>

            <div className="craft-story-action">
              <Link to="/about" className="craft-story-link">
                Read Our Story &amp; Philosophy ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4: THE SIGNATURE FOUR (CURATED HERO SELECTIONS) */}
      <section className="section-editorial signatures-section">
        <div className="editorial-header-center">
          <span className="editorial-label">Our Craft</span>
          <h2 className="editorial-heading">The Signature <em>Four</em></h2>
          <div className="editorial-divider center" />
          <p className="editorial-lead-center">
            Our most requested creations — freshly prepared every day for local coffee lovers and foodies.
          </p>
        </div>

        <div className="signatures-grid">
          {favorites.slice(0, 4).map((dish) => (
            <div key={dish.name} className="signature-card">
              <div className="signature-badge">{dish.badge}</div>
              <div className="signature-img-wrap">
                <img 
                  src={dish.image} 
                  alt={dish.name} 
                  className="signature-img" 
                  loading="eager" 
                  decoding="async" 
                />
              </div>
              <div className="signature-details">
                <div className="signature-meta">
                  <h3 className="signature-name">{dish.name}</h3>
                  <span className="signature-price">₹{dish.price}</span>
                </div>
                <p className="signature-desc">{dish.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="signatures-cta-wrap">
          <Link to="/menu" className="btn-editorial-primary">
            Explore Complete Menu (50+ Items) →
          </Link>
        </div>
      </section>

      {/* CHAPTER 5: SIGNATURE CAFE ATMOSPHERE (WIDE PHOTOGRAPHIC FEATURE) */}
      <section className="atmosphere-section">
        <div className="atmosphere-container">
          <span className="atmosphere-kicker">A Tranquil Garden Setting</span>
          <h2 className="atmosphere-heading">
            Your Little Escape <em>in Vijayapura</em>
          </h2>
          <p className="atmosphere-lead">
            An open-air garden terrace shaded by leafy canopies, softly lit with warm evening pendant lights, and filled with the unhurried aroma of freshly ground espresso. A sanctuary built for slower moments.
          </p>
          <div className="atmosphere-actions">
            <button type="button" onClick={openReserve} className="btn-atmosphere-primary">
              📅 Reserve a Garden Table
            </button>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=16.822765,75.703274" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-atmosphere-outline"
            >
              📍 Get Directions ↗
            </a>
          </div>
        </div>
      </section>

      {/* CHAPTER 6: EDITORIAL ASYMMETRICAL PHOTO GALLERY */}
      <section className="gallery-section">
        {/* Ambient Botanical Brand Watermark Motif */}
        <div className="brand-watermark-light" style={{ right: -60, top: -40, width: 440, height: 440 }} aria-hidden="true" />

        <div className="gallery-container">
          <div className="editorial-header-center">
            <span className="editorial-label">Life at The Moras Cafe</span>
            <h2 className="editorial-heading">Every Corner <em>Tells a Story</em></h2>
            <div className="editorial-divider center" />
            <p className="editorial-lead-center">
              From our hand-painted coffee mural patio to twilight garden tables and handcrafted pure-veg plates.
            </p>
          </div>

          <div className="gallery-mosaic-grid">
            {/* Major Left Feature: Coffee & Music Mural Patio */}
            <div className="gallery-mosaic-feature">
              <img 
                src="/images/instagram/manju_duddagi.jpeg" 
                alt="Outdoor seating at The Moras Cafe next to the vibrant coffee and music mural"
                loading="eager"
                decoding="async"
              />
              <div className="gallery-card-badge">
                <strong>The Mural Patio</strong>
                <span>Where vibrant street art meets your afternoon espresso</span>
              </div>
            </div>

            {/* Right Side Stack: 1 Top Banner + 2 Mini Cards */}
            <div className="gallery-mosaic-side">
              {/* Top: Night Garden Seating */}
              <div className="gallery-mosaic-top">
                <img 
                  src="/images/instagram/garden_night_seating.webp" 
                  alt="Evening garden seating under glowing pendant lights at The Moras Cafe"
                  loading="eager"
                  decoding="async"
                />
                <div className="gallery-card-badge">
                  <strong>Night Garden Seating</strong>
                  <span>Pendant bulbs, ambient greenery &amp; evening tranquility</span>
                </div>
              </div>

              {/* Bottom Split: Mindful Leisure & Artisan Table */}
              <div className="gallery-mosaic-bottom-split">
                <div className="gallery-mosaic-mini">
                  <img 
                    src="/images/instagram/cafe_chess_board.webp" 
                    alt="Handcrafted wooden chess board and slow leisure moments at The Moras Cafe"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="gallery-card-badge">
                    <strong>Mindful Leisure</strong>
                    <span>Handcrafted chess &amp; quiet corners</span>
                  </div>
                </div>
                <div className="gallery-mosaic-mini">
                  <img 
                    src="/Tandoori Paneer Pizza.png" 
                    alt="Freshly baked artisan pure vegetarian pizza at The Moras Cafe"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="gallery-card-badge">
                    <strong>Fresh Pure-Veg</strong>
                    <span>Stone-baked pizzas &amp; comfort food</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="gallery-cta-wrap">
            <Link to="/moments" className="gallery-explore-link">
              📸 Explore More Guest Moments &amp; Instagram Stories →
            </Link>
          </div>
        </div>
      </section>

      {/* CHAPTER 7: GUEST LOVE & COMMUNITY REVIEWS */}
      <section className="home-reviews-section">
        {/* Ambient Botanical Brand Watermark Motif */}
        <div className="brand-watermark-light" style={{ right: -80, bottom: -60, width: 460, height: 460 }} aria-hidden="true" />

        <div className="editorial-header-center" style={{ position: 'relative', zIndex: 1 }}>
          <span className="editorial-label">Patron Reflections</span>
          <h2 className="editorial-heading">Stories From <em>Our Guests</em></h2>
          <div className="editorial-divider center" />
          <p className="editorial-lead-center">
            Honest words from friends and neighbors who make The Moras Cafe their everyday sanctuary in Vijayapura.
          </p>
        </div>

        <div className="home-reviews-grid">
          {VERIFIED_HOME_REVIEWS.map((review, idx) => (
            <div key={idx} className="home-review-card">
              <div>
                <div className="home-review-header">
                  <div className="home-review-avatar">{review.initials}</div>
                  <div>
                    <div className="home-review-name">{review.name}</div>
                    <div className="home-review-date">{review.date}</div>
                  </div>
                </div>
                <div className="home-review-stars">{'★'.repeat(review.rating)}</div>
                <p className="home-review-quote">"{review.text}"</p>
              </div>
              <div className="home-review-verified">
                <span>✓</span> Verified Google Review
              </div>
            </div>
          ))}
        </div>

        <div className="home-reviews-cta-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/reviews" className="btn-editorial-primary">
            Explore All Guest Reviews →
          </Link>
        </div>
      </section>

      {/* CHAPTER 8: VISIT US & DIRECTIONS */}
      <section id="location" className="section-editorial visit-section">
        {/* Ambient Botanical Brand Watermark Motif */}
        <div className="brand-watermark-light visit-watermark" aria-hidden="true" />

        <div className="visit-grid">
          <div className="visit-content">
            <span className="editorial-label">Come Say Hello</span>
            <h2 className="editorial-heading">Visit <em>The Moras Cafe</em></h2>
            <div className="editorial-divider" />
            <p className="editorial-body-text">
              We are situated at B.M. Patil Circle on Ring Road, Vijayapura. Ample parking, free high-speed Wi-Fi, and welcoming hospitality await you.
            </p>
            <div className="visit-info-list">
              <div className="visit-info-item">
                <span className="info-icon">📍</span>
                <div>
                  <strong>Location</strong>
                  <div>B M Patil Circle, Ring Rd, Solapur Bypass, Vijayapura, KA 586102</div>
                </div>
              </div>
              <div className="visit-info-item">
                <span className="info-icon">🕒</span>
                <div>
                  <strong>Opening Hours</strong>
                  <div>Open Daily · 10:00 AM – 10:30 PM (All 7 Days)</div>
                </div>
              </div>
              <div className="visit-info-item">
                <span className="info-icon">📞</span>
                <div>
                  <strong>Phone / Reservations</strong>
                  <div><a href="tel:+919945446137">+91 99454 46137</a></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={openReserve} className="btn-editorial-primary">
                Book a Table Now
              </button>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=16.822765,75.703274"
                target="_blank"
                rel="noreferrer"
                className="btn-editorial-outline"
              >
                Get Directions ↗
              </a>
            </div>
          </div>

          <div className="visit-map-frame">
            <iframe
              title="The Moras Cafe Location Map"
              src="https://maps.google.com/maps?q=16.822765,75.703274&hl=en&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 360 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>


    </div>
  );
}

export default Home;
