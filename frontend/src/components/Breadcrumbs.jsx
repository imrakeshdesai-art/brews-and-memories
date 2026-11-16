import { Link } from 'react-router-dom';

/**
 * Reusable, SEO-compliant Breadcrumbs component with Schema.org BreadcrumbList microdata.
 * 
 * @param {Array<{ label: string, path?: string }>} items
 */
function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-nav" style={{ margin: '0 0 16px', padding: '0 4px' }}>
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '0.82rem',
          color: 'var(--text-light, #777)'
        }}
      >
        {items.map((crumb, idx) => {
          const isLast = idx === items.length - 1;
          const position = idx + 1;

          return (
            <li
              key={idx}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {crumb.path && !isLast ? (
                <>
                  <Link
                    to={crumb.path}
                    itemProp="item"
                    style={{
                      color: 'var(--green, #0F3D3E)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'color 0.15s ease'
                    }}
                  >
                    <span itemProp="name">{crumb.label}</span>
                  </Link>
                  <span aria-hidden="true" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>/</span>
                </>
              ) : (
                <span
                  itemProp="name"
                  aria-current={isLast ? 'page' : undefined}
                  style={{
                    color: isLast ? 'var(--text, #1a1a1a)' : 'inherit',
                    fontWeight: isLast ? 700 : 500
                  }}
                >
                  {crumb.label}
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
