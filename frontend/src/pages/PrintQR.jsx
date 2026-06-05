import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function PrintQR() {
  const { tableNum } = useParams();
  const navigate = useNavigate();
  
  const tableUrl = `${window.location.origin}/order/table-${tableNum}`;
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(tableUrl)}&size=250`;

  useEffect(() => {
    const handlePrint = () => {
      // Small safety timeout to let rendering paint complete
      setTimeout(() => {
        window.print();
      }, 500);
    };

    const checkAllResources = () => {
      const imgs = Array.from(document.images);
      const checkImagesAndPrint = () => {
        const allLoaded = imgs.every(img => img.complete);
        if (allLoaded) {
          handlePrint();
        } else {
          let loadedCount = imgs.filter(img => img.complete).length;
          imgs.forEach(img => {
            if (!img.complete) {
              const onload = () => {
                img.removeEventListener('load', onload);
                img.removeEventListener('error', onload);
                loadedCount++;
                if (loadedCount === imgs.length) {
                  handlePrint();
                }
              };
              img.addEventListener('load', onload);
              img.addEventListener('error', onload);
            }
          });
        }
      };

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(checkImagesAndPrint).catch(checkImagesAndPrint);
      } else {
        checkImagesAndPrint();
      }
    };

    if (document.readyState === 'complete') {
      checkAllResources();
    } else {
      window.addEventListener('load', checkAllResources);
      return () => window.removeEventListener('load', checkAllResources);
    }
  }, []);

  return (
    <div className="print-qr-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .print-qr-page {
          background: #1a1a1a;
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .scene {
          display: flex;
          gap: 32px;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 16px;
          flex-wrap: wrap;
          font-family: 'DM Sans', sans-serif;
        }

        .card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .card-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
        }

        .card {
          width: 290px;
          height: 580px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        /* ===== FRONT ===== */
        .front { background: #1C3829; }

        .gold-bar { height: 4px; background: linear-gradient(90deg, #B8892E, #F0C85A, #D4AF64, #B8892E); flex-shrink: 0; }
        .green-bar { height: 4px; background: linear-gradient(90deg, #1C3829, #2D5A3E, #1C3829); flex-shrink: 0; }

        .front-header {
          padding: 16px 20px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .logo-ring {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(212,175,100,0.12);
          border: 1.5px solid rgba(212,175,100,0.45);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 7px;
          overflow: hidden;
        }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 12.5px; font-weight: 700;
          color: #D4AF64;
          letter-spacing: 0.4px;
          text-align: center; line-height: 1.3;
        }

        .brand-tagline {
          font-size: 8.5px; font-weight: 400;
          color: rgba(212,175,100,0.55);
          letter-spacing: 1.4px; text-transform: uppercase;
          margin-top: 2px;
        }

        .steps-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(0,0,0,0.18);
          flex-shrink: 0;
        }

        .step-item { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }

        .step-icon-wrap {
          width: 26px; height: 26px;
          border-radius: 7px;
          background: rgba(212,175,100,0.1);
          border: 1px solid rgba(212,175,100,0.22);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
        }

        .step-label { font-size: 7.5px; font-weight: 500; color: rgba(240,230,210,0.65); text-align: center; line-height: 1.2; }
        .step-arrow { font-size: 9px; color: rgba(212,175,100,0.3); margin-top: -6px; }

        .headline-block {
          padding: 10px 20px 6px;
          text-align: center;
          flex-shrink: 0;
        }

        .scan-headline {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 900;
          color: #F5EDD8;
          line-height: 1.0; letter-spacing: -0.3px;
        }

        .sub-benefits { margin-top: 5px; }
        .sub-benefit { display: block; font-size: 9px; font-weight: 400; color: rgba(212,175,100,0.82); letter-spacing: 0.3px; line-height: 1.5; }

        .qr-zone {
          margin: 8px 16px 6px;
          background: #F5EDD8;
          border-radius: 12px;
          padding: 12px 12px 8px;
          display: flex; flex-direction: column; align-items: center;
          flex-shrink: 0;
          position: relative;
        }

        .qr-corners { position: absolute; inset: -2px; pointer-events: none; }
        .qr-corner { position: absolute; width: 13px; height: 13px; border-color: #1C3829; border-style: solid; border-width: 0; }
        .qr-corner.tl { top:0;left:0;border-top-width:2.5px;border-left-width:2.5px;border-top-left-radius:4px; }
        .qr-corner.tr { top:0;right:0;border-top-width:2.5px;border-right-width:2.5px;border-top-right-radius:4px; }
        .qr-corner.bl { bottom:0;left:0;border-bottom-width:2.5px;border-left-width:2.5px;border-bottom-left-radius:4px; }
        .qr-corner.br { bottom:0;right:0;border-bottom-width:2.5px;border-right-width:2.5px;border-bottom-right-radius:4px; }

        .qr-table-badge {
          margin-top: 7px;
          background: #1C3829; color: #D4AF64;
          font-family: 'Playfair Display', serif;
          font-size: 12px; font-weight: 700;
          padding: 3px 18px; border-radius: 20px; letter-spacing: 1px;
        }

        .cta-strip {
          margin: 6px 16px;
          background: #D4AF64;
          border-radius: 9px;
          padding: 9px 12px;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          flex-shrink: 0;
        }

        .cta-text {
          font-size: 11px; font-weight: 600; color: #1C3829;
          letter-spacing: 0.5px; text-transform: uppercase; text-align: center; line-height: 1.15;
        }

        .trust-row {
          display: flex; justify-content: center; gap: 10px;
          padding: 5px 16px 2px;
          flex-shrink: 0;
        }

        .trust-item { display: flex; align-items: center; gap: 3px; font-size: 7.5px; font-weight: 500; color: rgba(240,230,210,0.6); }
        .trust-check { font-size: 8px; color: #D4AF64; }

        .food-deco {
          display: flex; justify-content: center; gap: 7px;
          font-size: 13px; opacity: 0.45;
          flex: 1;
          align-items: center;
          padding: 0 16px;
        }

        /* ===== BACK ===== */
        .back { background: #F5EDD8; }

        .back-header {
          background: #1C3829;
          padding: 16px 20px 14px;
          display: flex; flex-direction: column; align-items: center;
          flex-shrink: 0;
        }

        .back-logo-row { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
        .back-brand { font-family: 'Playfair Display', serif; font-size: 12.5px; font-weight: 700; color: #D4AF64; letter-spacing: 0.4px; }

        .back-headline {
          font-family: 'Playfair Display', serif;
          font-size: 21px; font-weight: 700; color: #F5EDD8; letter-spacing: 0.2px;
        }

        .back-subhead { font-size: 8.5px; font-weight: 400; color: rgba(212,175,100,0.65); letter-spacing: 1.4px; text-transform: uppercase; margin-top: 3px; }

        .steps-list {
          padding: 14px 18px 10px;
          display: flex; flex-direction: column; gap: 9px;
          flex-shrink: 0;
        }

        .step-row { display: flex; align-items: flex-start; gap: 11px; }

        .step-num-wrap {
          width: 30px; height: 30px; border-radius: 50%;
          background: #1C3829;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .step-num { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: #D4AF64; }

        .step-content { flex: 1; padding-top: 3px; }
        .step-title { font-family: 'Playfair Display', serif; font-size: 12.5px; font-weight: 700; color: #1C3829; line-height: 1.2; }
        .step-desc { font-size: 9px; font-weight: 400; color: #5A6B5A; margin-top: 1px; line-height: 1.3; }
        .step-icon-right { font-size: 16px; padding-top: 3px; flex-shrink: 0; }

        .divider { height: 1px; background: rgba(28,56,41,0.1); margin: 0 18px; flex-shrink: 0; }

        .assist-block {
          margin: 10px 16px 8px;
          background: #1C3829;
          border-radius: 11px;
          padding: 12px 14px;
          display: flex; gap: 10px; align-items: flex-start;
          flex-shrink: 0;
        }

        .assist-icon-wrap {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(212,175,100,0.13);
          border: 1px solid rgba(212,175,100,0.32);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }

        .assist-title { font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700; color: #D4AF64; margin-bottom: 2px; }
        .assist-desc { font-size: 8.5px; font-weight: 400; color: rgba(240,230,210,0.72); line-height: 1.4; }

        .back-food-deco {
          display: flex; justify-content: center; gap: 7px;
          font-size: 13px; opacity: 0.38;
          flex: 1;
          align-items: center;
          padding: 0 18px;
        }

        .back-bottom-strip {
          background: #D4AF64;
          padding: 7px 18px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          flex-shrink: 0;
        }

        .back-bottom-text { font-size: 8.5px; font-weight: 600; color: #1C3829; letter-spacing: 1px; text-transform: uppercase; }
        .dot-sep { width: 3px; height: 3px; border-radius: 50%; background: #1C3829; opacity: 0.4; }

        @media print {
          @page {
            size: portrait;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-qr-page {
            background: #fff !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .scene {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-items: center !important;
            gap: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          .card-label {
            display: none !important;
          }
          .card-wrapper {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
          }
          .card-wrapper:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .card {
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Back button for digital view */}
      <button 
        onClick={() => navigate('/admin')}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: 'var(--green)',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        className="no-print"
      >
        ← Back to Admin
      </button>

      <div className="scene">
        {/* FRONT */}
        <div className="card-wrapper">
          <span className="card-label">Front Side</span>
          <div class="card front">
            <div class="gold-bar"></div>

            <div class="front-header">
              <div class="logo-ring">
                <img src="/logo.jpg" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} alt="Cafe Logo" />
              </div>
              <div class="brand-name">Brews & Memories<br />Café</div>
              <div class="brand-tagline">Crafted with love · Est. 2020</div>
            </div>

            <div class="steps-row">
              <div class="step-item">
                <div class="step-icon-wrap">📱</div>
                <div class="step-label">Scan QR</div>
              </div>
              <span class="step-arrow">›</span>
              <div class="step-item">
                <div class="step-icon-wrap">🍔</div>
                <div class="step-label">Pick Favorites</div>
              </div>
              <span class="step-arrow">›</span>
              <div class="step-item">
                <div class="step-icon-wrap">🚀</div>
                <div class="step-label">Get Served</div>
              </div>
            </div>

            <div class="headline-block">
              <div class="scan-headline">SCAN &<br />ORDER</div>
              <div class="sub-benefits">
                <span class="sub-benefit">◆ No Waiting &nbsp;◆ No Calling Staff</span>
                <span class="sub-benefit">Order Directly From Your Table</span>
              </div>
            </div>

            <div class="qr-zone">
              <div class="qr-corners">
                <div class="qr-corner tl"></div><div class="qr-corner tr"></div>
                <div class="qr-corner bl"></div><div class="qr-corner br"></div>
              </div>
              <img src={qrImageUrl} style={{ width: 148, height: 148, background: 'white', padding: 8, borderRadius: 8, display: 'block', objectFit: 'contain' }} alt="QR Code" />
              <div class="qr-table-badge">TABLE {String(tableNum).padStart(2, '0')}</div>
            </div>

            <div class="cta-strip">
              <span style={{ fontSize: 15 }}>👉</span>
              <div class="cta-text">SCAN NOW &<br />START ORDERING</div>
            </div>

            <div class="trust-row">
              <div class="trust-item"><span class="trust-check">✓</span> Fast Ordering</div>
              <div class="trust-item"><span class="trust-check">✓</span> Freshly Prepared</div>
              <div class="trust-item"><span class="trust-check">✓</span> At Your Table</div>
            </div>

            <div class="food-deco">☕ 🍔 🍕 🥪 🍹 🍟</div>

            <div class="gold-bar"></div>
          </div>
        </div>

        {/* BACK */}
        <div className="card-wrapper">
          <span className="card-label">Back Side</span>
          <div class="card back">
            <div class="green-bar"></div>

            <div class="back-header">
              <div class="back-logo-row">
                <img src="/logo.jpg" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', display: 'block' }} alt="Cafe Logo Icon" />
                <span class="back-brand">Brews & Memories Café</span>
              </div>
              <div class="back-headline">How It Works</div>
              <div class="back-subhead">Simple · Fast · Delightful</div>
            </div>

            <div class="steps-list">
              <div class="step-row">
                <div class="step-num-wrap"><span class="step-num">1</span></div>
                <div class="step-content">
                  <div class="step-title">Scan QR Code</div>
                  <div class="step-desc">Point your camera at the code on this card</div>
                </div>
                <span class="step-icon-right">📱</span>
              </div>
              <div class="step-row">
                <div class="step-num-wrap"><span class="step-num">2</span></div>
                <div class="step-content">
                  <div class="step-title">Browse Full Menu</div>
                  <div class="step-desc">Explore drinks, bites & chef's specials</div>
                </div>
                <span class="step-icon-right">📋</span>
              </div>
              <div class="step-row">
                <div class="step-num-wrap"><span class="step-num">3</span></div>
                <div class="step-content">
                  <div class="step-title">Add Items to Cart</div>
                  <div class="step-desc">Customise your order just the way you like</div>
                </div>
                <span class="step-icon-right">🛒</span>
              </div>
              <div class="step-row">
                <div class="step-num-wrap"><span class="step-num">4</span></div>
                <div class="step-content">
                  <div class="step-title">Place Your Order</div>
                  <div class="step-desc">Confirm your order</div>
                </div>
                <span class="step-icon-right">✅</span>
              </div>
              <div class="step-row">
                <div class="step-num-wrap"><span class="step-num">5</span></div>
                <div class="step-content">
                  <div class="step-title">Relax & Enjoy</div>
                  <div class="step-desc">We'll bring it fresh to your table</div>
                </div>
                <span class="step-icon-right">😊</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="assist-block">
              <div class="assist-icon-wrap">🤝</div>
              <div>
                <div class="assist-title">Need Assistance?</div>
                <div class="assist-desc">Our team is always happy to help.<br />Just wave and we'll come right to you.</div>
              </div>
            </div>

            <div class="back-food-deco">🥐 ☕ 🍰 🥤 🍜 🧁</div>

            <div class="back-bottom-strip">
              <span class="back-bottom-text">Freshly Brewed</span>
              <div class="dot-sep"></div>
              <span class="back-bottom-text">Crafted With Love</span>
              <div class="dot-sep"></div>
              <span class="back-bottom-text">Just For You</span>
            </div>

            <div class="green-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintQR;
