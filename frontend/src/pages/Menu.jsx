import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuData, menuCategories } from '../data/menuData';

function Menu({ addToCart, activeTable, endTableSession }) {
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
        <h2 className="section-title">Crafted with <em>Love</em></h2>
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
                <article key={item.name} className="menu-card">
                  <div className="menu-card-img" style={{ overflow: 'hidden', position: 'relative' }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transform: 'scale(1.28)', /* Crop closer by scaling up 28% */
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                        className="menu-card-img-el"
                      />
                    ) : (
                      item.emoji
                    )}
                    {item.name === 'Paneer Tikka Roll' && (
                      <span style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: '#fbbf24',
                        color: '#0f3d3e',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        ⭐ Popular
                      </span>
                    )}
                    <div className="menu-veg-badge" />
                  </div>
                  <div className="menu-card-body">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-desc">{item.desc}</div>
                    {item.multi ? (
                      <div className="price-variants">
                        <label htmlFor={`size-${item.name}`} style={{ display: 'block', marginBottom: 6 }}>
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
                        >
                          <option value="S">Small — ₹{item.priceS}</option>
                          <option value="M">Medium — ₹{item.priceM}</option>
                          <option value="L">Large — ₹{item.priceL}</option>
                        </select>
                      </div>
                    ) : null}
                    <div className="menu-card-foot">
                      <span className="menu-price">₹{getDisplayPrice(item)}</span>
                      {activeTable && (
                        <button className="btn-add" type="button" onClick={() => handleAdd(item)} aria-label={`Add ${item.name} to cart`}>
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Menu;
