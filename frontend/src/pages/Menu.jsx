import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuData, menuCategories } from '../data/menuData';
import { reviewsData } from '../data/reviewsData';
import { useToast } from '../components/ToastProvider';
import useSEO from '../hooks/useSEO';

const INSTAGRAM_FEED = [
  {
    username: 'hightide.sagar',
    image: '/images/instagram/hightide_sagar.jpeg',
    likes: 412,
    comments: 63,
    postUrl: 'https://www.instagram.com/reels/DQ05-lUDzup/'
  },
  {
    username: 'behind_ourlens_06',
    image: '/images/instagram/behind_ourlens_06.jpeg',
    likes: 245,
    comments: 34,
    postUrl: 'https://www.instagram.com/reels/DXb9UdHj9jh/'
  },
  {
    username: 'manju.duddagi',
    image: '/images/instagram/manju_duddagi.jpeg',
    likes: 356,
    comments: 52,
    postUrl: 'https://www.instagram.com/reels/DQssSCUibgo/'
  },
  {
    username: 'mahantesh_loni',
    image: '/images/instagram/mahantesh_loni.jpeg',
    likes: 294,
    comments: 21,
    postUrl: 'https://www.instagram.com/reel/DXlAGMzkX4g/?igsh=aXhkN3NlOWlxMXVo'
  }
];

function Menu({ addToCart, activeTable, endTableSession, cart = [], updateCartQty }) {
  useSEO({
    title: 'Our Menu',
    description: 'Explore the Brews & Memories menu. We serve freshly brewed coffee, hot pizzas, delicious pasta, sizzling brownie, momos, rolls, and vegetarian favorites in Vijayapura.'
  });

  const showToast = useToast();

  const getCartItem = (item) => {
    const selected = item.multi ? (selectedVariants[item.name] || 'M') : '';
    const cartId = `${item.name}-${selected || 'default'}`;
    return cart ? cart.find((entry) => entry.id === cartId) : null;
  };

  const handleDecrease = (item) => {
    const cartItem = getCartItem(item);
    if (cartItem) {
      updateCartQty(cartItem.id, -1);
      showToast(`Removed 1 ${item.name} from cart`);
    }
  };

  const handleIncrease = (item) => {
    const cartItem = getCartItem(item);
    if (cartItem) {
      updateCartQty(cartItem.id, 1);
      showToast(`Added 1 ${item.name} to cart`);
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState(menuData);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && menuCategories.includes(category)) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    if (window.trackEvent) window.trackEvent('menu_view');
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query && activeCategory === 'All') {
      setMenuItems(menuData);
      return;
    }

    const filtered = Object.fromEntries(
      Object.entries(menuData).map(([category, items]) => [
        category,
        items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)
        ),
      ])
    );

    if (activeCategory !== 'All') {
      setMenuItems({ [activeCategory]: filtered[activeCategory] || [] });
      return;
    }

    setMenuItems(filtered);
  }, [searchQuery, activeCategory]);

  const categoriesToRender = useMemo(() => {
    if (activeCategory === 'All') {
      return menuCategories;
    }
    return [activeCategory];
  }, [activeCategory]);

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    setSearchQuery('');
    setSearchParams(category === 'All' ? {} : { category });
  };

  const handleAdd = (item) => {
    const selected = selectedVariants[item.name] || 'M';
    const variantPrice = item.multi
      ? item[`price${selected}`]
      : item.price;
    addToCart({
      name: item.name,
      price: variantPrice,
      emoji: item.emoji,
      desc: item.desc,
      variant: item.multi ? selected : '',
    });
    showToast(`🛒 ${item.name} added to cart!`);
    if (window.trackEvent) {
      window.trackEvent('quick_add', { item_name: item.name, price: variantPrice });
    }
  };

  const getDisplayPrice = (item) => {
    if (!item.multi) {
      return item.price;
    }
    const selected = selectedVariants[item.name] || 'M';
    return item[`price${selected}`];
  };

  return (
    <section className="section" id="menu">
      <div className="section-header">
        <span className="section-label">Our Menu</span>
        <h1 className="section-title">Crafted with <em>Love</em></h1>
        <div className="section-divider" />
      </div>

      {activeTable ? (
        <div className="table-banner" style={{
          maxWidth: 900,
          margin: '0 auto 24px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem', color: '#10b981' }}>🟢</span>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ color: '#065f46', display: 'block', fontSize: '0.95rem' }}>Ordering from {activeTable}</strong>
              <small style={{ color: '#047857', fontSize: '0.85rem' }}>Your digital session is active. Delivery will be brought directly to your table.</small>
            </div>
          </div>
          {endTableSession && (
            <button 
              onClick={endTableSession}
              style={{
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px'
              }}
            >
              Exit Session
            </button>
          )}
        </div>
      ) : (
        <div className="table-banner-info" style={{
          maxWidth: 900,
          margin: '0 auto 24px',
          background: 'var(--cream-light)',
          border: '1px solid var(--cream-dark)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📱</span>
          <div style={{ textAlign: 'left' }}>
            <strong style={{ color: 'var(--green)', display: 'block', fontSize: '0.95rem' }}>Browse-Only Mode</strong>
            <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>To order from your table, please scan the QR code located on your table.</small>
          </div>
        </div>
      )}

      <div className="menu-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', maxWidth: 900, margin: '0 auto 24px' }}>
        <div className="menu-search" style={{ flexGrow: 1, maxWidth: 500 }}>
          <span>🔍</span>
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (activeCategory !== 'All') {
                setActiveCategory('All');
              }
            }}
            placeholder="Search items…"
            aria-label="Search menu items"
          />
        </div>
        <a 
          href="/New Menu 2026.xlsx" 
          download
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.9rem', borderRadius: 8, textDecoration: 'none', cursor: 'pointer' }}
        >
          📊 Download Menu Excel
        </a>
      </div>

      <div className="cat-filters">
        <button
          className={`filter-btn ${activeCategory === 'All' ? 'active' : ''}`}
          type="button"
          onClick={() => handleSelectCategory('All')}
        >
          All
        </button>
        {menuCategories.map((category) => (
          <button
            key={category}
            className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
            type="button"
            onClick={() => handleSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {categoriesToRender.map((category) => {
        const items = menuItems[category] || [];
        if (!items.length) return null;
        return (
          <div key={category} className="menu-category">
            <div className="menu-category-title">{category}</div>
            <div className="menu-grid">
              {items.map((item) => (
                <article key={item.name} className="menu-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div 
                    className="menu-card-img" 
                    style={(category === 'Cold Beverages' || category === 'Milk Shakes') ? { 
                      overflow: 'hidden', 
                      position: 'relative',
                      height: '200px'
                    } : { 
                      overflow: 'hidden', 
                      position: 'relative' 
                    }}
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={(category === 'Cold Beverages' || category === 'Milk Shakes') ? { 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          objectPosition: 'center 40%',
                          transform: 'scale(1)',
                          transformOrigin: 'center center',
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        } : { 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transform: 'scale(1.28)', /* Crop closer by scaling up 28% */
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                        className={(category === 'Cold Beverages' || category === 'Milk Shakes') ? 'menu-card-img-el cold-bev-img' : 'menu-card-img-el'}
                      />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>{item.emoji}</span>
                    )}
                    {item.badge && (
                      <span className="menu-card-badge">
                        ⭐ {item.badge}
                      </span>
                    )}
                    <div className="menu-veg-badge" />
                  </div>
                  <div className="menu-card-body" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span className="menu-price">₹{getDisplayPrice(item)}</span>
                    </div>
                    <div className="menu-item-desc" style={{ marginBottom: 12 }}>{item.desc}</div>
                    {item.multi ? (
                      <div className="price-variants" style={{ marginTop: 'auto', marginBottom: 12 }}>
                        <label htmlFor={`size-${item.name}`} style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                          Size
                        </label>
                        <select
                          id={`size-${item.name}`}
                          value={selectedVariants[item.name] || 'M'}
                          onChange={(event) =>
                            setSelectedVariants((current) => ({
                              ...current,
                              [item.name]: event.target.value,
                            }))
                          }
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--cream-dark)', fontSize: '0.8rem' }}
                        >
                          <option value="S">Small — ₹{item.priceS}</option>
                          <option value="M">Medium — ₹{item.priceM}</option>
                          <option value="L">Large — ₹{item.priceL}</option>
                        </select>
                      </div>
                    ) : null}
                    <div className="menu-card-foot" style={{ marginTop: item.multi ? '0' : 'auto', display: 'flex', justifyContent: activeTable ? 'space-between' : 'flex-end', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed var(--cream-dark)' }}>
                      {activeTable ? (
                        (() => {
                          const cartItem = getCartItem(item);
                          const qty = cartItem ? cartItem.qty : 0;
                          if (qty > 0) {
                            return (
                              <>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>In Cart</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream-light)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--cream-dark)' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => handleDecrease(item)} 
                                    aria-label={`Decrease ${item.name} quantity`}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--green)',
                                      fontWeight: '800',
                                      fontSize: '1.2rem',
                                      cursor: 'pointer',
                                      padding: '0 4px',
                                      lineHeight: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--green)', minWidth: 16, textAlign: 'center' }}>
                                    {qty}
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleIncrease(item)} 
                                    aria-label={`Increase ${item.name} quantity`}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--green)',
                                      fontWeight: '800',
                                      fontSize: '1.2rem',
                                      cursor: 'pointer',
                                      padding: '0 4px',
                                      lineHeight: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </>
                            );
                          }
                          return (
                            <>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>Add to order</span>
                              <button className="btn-add" type="button" onClick={() => handleAdd(item)} aria-label={`Add ${item.name} to cart`}>
                                +
                              </button>
                            </>
                          );
                        })()
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--green-light)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>🟢 Pure Veg</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom Content Wrapper (Freshness Promise) */}
      <div className="menu-bottom-wrapper">
        
        {/* 1. Freshness Promise */}
        <div className="promise-section">
          <div className="section-header">
            <span className="section-label">Our Values</span>
            <h2 className="section-title" style={{ fontSize: '1.8rem' }}>The Brews &amp; Memories <em>Promise</em></h2>
            <div className="section-divider" style={{ margin: '12px auto' }} />
          </div>
          <div className="promise-grid">
            <div className="promise-card">
              <span className="promise-icon">🍳</span>
              <div className="promise-title">Prepared Fresh After Order</div>
              <div className="promise-desc">Every dish is cooked fresh from scratch upon ordering. No pre-cooked noodles or stale bases.</div>
            </div>
            <div className="promise-card">
              <span className="promise-icon">🧅</span>
              <div className="promise-title">Jain Preparation Available</div>
              <div className="promise-desc">Need it without onion and garlic? Let our team know and we will prepare it custom Jain-style.</div>
            </div>
            <div className="promise-card">
              <span className="promise-icon">🧀</span>
              <div className="promise-title">Extra Cheese &amp; Add-ons</div>
              <div className="promise-desc">Want it extra loaded or spicy? Tell our servers to customize cheese or peri-peri seasoning levels.</div>
            </div>
            <div className="promise-card">
              <span className="promise-icon">🎓</span>
              <div className="promise-title">Student Friendly Pricing</div>
              <div className="promise-desc">We offer delicious, pocket-friendly meals perfect for student groups and families alike.</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Menu;
