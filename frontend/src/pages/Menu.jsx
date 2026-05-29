import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuData, menuCategories } from '../data/menuData';

function Menu({ addToCart }) {
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
          href="/menu.pdf" 
          target="_blank" 
          rel="noreferrer" 
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.9rem', borderRadius: 8, textDecoration: 'none', cursor: 'pointer' }}
        >
          📥 Download Menu PDF
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
                  <div className="menu-card-img">{item.emoji}<div className="menu-veg-badge" /></div>
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
                      <button className="btn-add" type="button" onClick={() => handleAdd(item)} aria-label={`Add ${item.name} to cart`}>
                        +
                      </button>
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
