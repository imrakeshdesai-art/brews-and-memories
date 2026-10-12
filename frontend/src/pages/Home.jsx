import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
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
  useSEO({
    isHome: true,
    description: 'Welcome to The Moras Cafe at B.M. Patil Circle, Vijayapura. Enjoy freshly brewed coffee, pizzas, pasta, sizzling brownie, and cozy ambiance.'
  });

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
    <div className="home-page-editorial">
      {/* CHAPTER 1: THE EDITORIAL HERO */}
      <section className="hero-editorial-section">
        <div className="hero-editorial-overlay" />
        <div className="hero-editorial-container">
          <span className="hero-editorial-kicker">
            ☕ SPECIALTY COFFEE &amp; PURE VEG ARTISAN BITES · VIJAYAPURA
          </span>
          <h1 className="hero-editorial-title">
            The Moras<br />
            <em>Cafe</em>
          </h1>
          <p className="hero-editorial-lead">
            Where slow roasted coffee meets warm conversations, fresh wood-fired pizzas, and cozy corner moments.
          </p>
          <div className="hero-editorial-actions">
            <Link to="/menu" className="btn-editorial-primary">
              Explore Our Menu
            </Link>
            <button type="button" onClick={openReserve} className="btn-editorial-outline">
              Book a Table
            </button>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: REFINED CREDENTIALS BAR */}
      <section className="credentials-editorial-bar">
        <div className="credentials-container">
          <div className="credential-item">
            <strong>4.8 ★</strong>
            <span>500+ Google Reviews</span>
          </div>
          <div className="credential-sep">·</div>
          <div className="credential-item">
            <strong>100%</strong>
            <span>Pure Vegetarian Craft</span>
          </div>
          <div className="credential-sep">·</div>
          <div className="credential-item">
            <strong>Specialty Brews</strong>
            <span>Freshly Ground &amp; Poured</span>
          </div>
          <div className="credential-sep">·</div>
          <div className="credential-item">
            <strong>B.M. Patil Circle</strong>
            <span>Open Daily · 10 AM – 10:30 PM</span>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: THE MORAS VIBE & CRAFT (EDITORIAL SPLIT) */}
      <section className="section-editorial craft-story-section">
        <div className="craft-grid">
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
          <div className="craft-content">
            <span className="editorial-label">The Experience</span>
            <h2 className="editorial-heading">
              More Than a Cafe.<br />
              <em>A Space to Slow Down.</em>
            </h2>
            <div className="editorial-divider" />
            <p className="editorial-body-text">
              Nestled at B.M. Patil Circle, <strong>The Moras Cafe</strong> was created for those who cherish authentic flavors and meaningful moments. Whether you’re working over an iced hazelnut brew, diving into our complimentary library of books, or challenging friends over board games, our café is your neighborhood sanctuary.
            </p>

            <div className="craft-pillars-list">
              <div className="craft-pillar">
                <span className="pillar-num">01</span>
                <div>
                  <h4>Artisan Coffee &amp; Shakes</h4>
                  <p>Single-origin roasted espresso, hand-pulled crema, and thick handcrafted shakes.</p>
                </div>
              </div>
              <div className="craft-pillar">
                <span className="pillar-num">02</span>
                <div>
                  <h4>Fresh Pure-Veg Dining</h4>
                  <p>Wood-fired tandoori paneer pizzas, crunchy double-decker clubs, and sizzling desserts.</p>
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
            Handpicked favorites loved by hundreds of Vijayapura coffee lovers and foodies.
          </p>
        </div>

        <div className="signatures-grid">
          {favorites.slice(0, 4).map((dish) => (
            <div key={dish.name} className="signature-card">
              <div className="signature-badge">{dish.badge}</div>
              <div className="signature-img-wrap">
                <img src={dish.image} alt={dish.name} className="signature-img" loading="lazy" />
              </div>
              <div className="signature-details">
                <div className="signature-meta">
                  <h3 className="signature-name">{dish.name}</h3>
                  <span className="signature-price">₹{dish.price}</span>
                </div>
                <p className="signature-desc">{dish.desc}</p>
                <button 
                  type="button"
                  onClick={() => handleAddFavorite(dish.item)}
                  className="btn-signature-add"
                  aria-label={`Add ${dish.name} to cart`}
                >
                  Quick Add +
                </button>
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

      {/* CHAPTER 5: VISIT US & RESERVATIONS */}
      <section id="location" className="section-editorial visit-section">
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

            <div style={{ marginTop: 24 }}>
              <button type="button" onClick={openReserve} className="btn-editorial-primary">
                Book a Table Now
              </button>
            </div>
          </div>

          <div className="visit-map-frame">
            <iframe
              title="The Moras Cafe Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3818.245682380596!2d75.71334267461603!3d16.863736917680278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc65571521cbf25%3A0x8c034c8193bdc099!2sBrews%20and%20Memories%20cafe!5e0!3m2!1sen!2sus!4v1780667200850!5m2!1sen!2sus"
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
