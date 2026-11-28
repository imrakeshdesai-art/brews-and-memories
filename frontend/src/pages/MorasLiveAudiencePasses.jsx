import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';
import { AUDIENCE_PASSES_ANNOUNCED } from '../config/eventsConfig';

export default function MorasLiveAudiencePasses() {
  useSEO({
    title: 'MORAS LIVE — Limited Audience Passes (60 Max) | The Moras Cafe',
    description:
      'Reserve your exclusive limited audience pass for MORAS LIVE at The Moras Cafe in Vijayapura. Exactly 60 passes available. Each pass includes one complimentary freshly-brewed Cappuccino.',
    canonical: '/moras-live/passes',
    image: 'https://themorascafe.in/moras-live-og.jpg',
    imageAlt: 'MORAS LIVE — Limited Audience Passes at The Moras Cafe',
  });

  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Settings & Inventory state
  const [settings, setSettings] = useState(null);
  const [inventory, setInventory] = useState({
    maximumPasses: 60,
    availablePasses: 60,
    totalAllocated: 0,
    isSoldOut: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active / Confirmed Pass State (Single QR)
  const [confirmedPass, setConfirmedPass] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [passUrl, setPassUrl] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Public Settings & Live Inventory
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await api.get('/moras-live/passes/settings');
      if (res.data?.success) {
        setSettings(res.data.settings);
        setInventory(res.data.inventory);
      }
    } catch (err) {
      console.warn('Could not load live settings, using defaults', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle URL params for secure email access link or scanned QR code (e.g. /moras-live/passes?passId=ML-0001&access=... or &token=...)
  useEffect(() => {
    const urlPassId = searchParams.get('passId');
    const urlAccess = searchParams.get('access');
    const urlToken = searchParams.get('token');

    if (urlPassId && (urlAccess || urlToken)) {
      loadSecurePass(urlPassId, urlAccess, urlToken);
    }
  }, [searchParams]);

  // Secure Pass Retrieval via high-entropy email token or QR token
  const loadSecurePass = async (passId, access, token) => {
    try {
      const params = new URLSearchParams();
      params.set('passId', passId);
      if (access) params.set('access', access);
      if (token) params.set('token', token);

      const res = await api.get(`/moras-live/passes/secure-view?${params.toString()}`);
      if (res.data?.success && res.data?.pass) {
        setConfirmedPass(res.data.pass);
        setQrCodeDataUrl(res.data.qrCodeDataUrl || '');
        setPassUrl(res.data.passUrl || '');
        toast(`Pass ${res.data.pass.passId} loaded successfully`);
      }
    } catch (err) {
      toast(
        err.response?.data?.message ||
          'Invalid or expired secure pass link. Please open your pass from your official email.'
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const cleanName = formData.fullName.trim();
    if (!cleanName) {
      newErrors.fullName = 'Please enter your full name';
    } else if (cleanName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    const rawMobile = formData.mobileNumber.replace(/\D/g, '');
    let normalized = rawMobile;
    if (normalized.length === 12 && normalized.startsWith('91')) {
      normalized = normalized.slice(2);
    } else if (normalized.length === 11 && normalized.startsWith('0')) {
      normalized = normalized.slice(1);
    }
    if (!normalized) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(normalized)) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number (e.g. 9845012345)';
    }

    const cleanEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast('Please correct the highlighted fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/moras-live/passes/reserve', formData);
      if (res.data?.success) {
        setConfirmedPass(res.data.pass);
        setQrCodeDataUrl(res.data.qrCodeDataUrl);
        setPassUrl(res.data.passUrl);
        toast(res.data.message || 'Audience pass reserved successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchSettings(); // Refresh inventory
      }
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.duplicate && resData?.pass) {
        // Person already registered: show their existing pass immediately
        setConfirmedPass(resData.pass);
        setQrCodeDataUrl(resData.qrCodeDataUrl || '');
        setPassUrl(resData.passUrl || '');
        toast(resData.message || "You're already registered. Here is your official QR pass.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (resData?.soldOut) {
        toast('ALL 60 MORAS LIVE PASSES HAVE BEEN RESERVED.');
        fetchSettings();
      } else {
        toast(resData?.message || 'Failed to reserve pass. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!confirmedPass?.passId) return;
    navigator.clipboard.writeText(confirmedPass.passId);
    setCopiedId(true);
    toast('Pass ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyLink = () => {
    const url = passUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast('Pass URL copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `MORAS_LIVE_PASS_${confirmedPass?.passId || 'PASS'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('QR Code downloaded!');
  };

  const handleWhatsAppShare = () => {
    if (!confirmedPass) return;
    const shareText = `🎟️ My Official Audience Pass for MORAS LIVE (#${confirmedPass.passId}) presented by THE MORAS CAFE! View pass & QR: ${passUrl || window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleReset = () => {
    setConfirmedPass(null);
    setQrCodeDataUrl('');
    setPassUrl('');
    setFormData({ fullName: '', mobileNumber: '', email: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="moras-live-passes-page" style={{ background: '#FAF5EF', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Top Banner Navigation & Breadcrumbs */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'MORAS LIVE', to: '/moras-live/register' },
            { label: 'Audience Passes', to: '/moras-live/passes' },
          ]}
        />
      </div>

      {/* Hero Header */}
      <section
        style={{
          background: 'linear-gradient(180deg, #123F3D 0%, #0D2C2B 100%)',
          color: '#FAF5EF',
          padding: '48px 20px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '3px solid rgba(245, 232, 208, 0.2)',
        }}
      >
        <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Cafe Presenter Signature */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245, 232, 208, 0.12)',
              border: '1px solid rgba(245, 232, 208, 0.25)',
              borderRadius: 24,
              padding: '6px 16px',
              fontSize: '0.82rem',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#F5E8D0',
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <span>☕</span> THE MORAS CAFE PRESENTS
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
              fontWeight: 900,
              letterSpacing: 2,
              margin: '0 0 8px',
              color: '#F5E8D0',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            MORAS LIVE
          </h1>

          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#E0D4BE',
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            YOUR MIC. YOUR MOMENT.
          </div>

          <div
            style={{
              display: 'inline-block',
              background: '#8B0000',
              color: '#FAF5EF',
              padding: '6px 18px',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(139, 0, 0, 0.4)',
              marginBottom: 22,
            }}
          >
            LIMITED AUDIENCE PASSES — STRICT CAPACITY: 60
          </div>

          <p
            style={{
              color: '#DDD4C4',
              fontSize: '1.02rem',
              lineHeight: 1.65,
              margin: '0 auto',
              maxWidth: 600,
            }}
          >
            Experience Vijayapura's finest poets, singers, rappers, musicians, and creators live on stage.
            Each pass includes full event admission and <strong>one complimentary freshly-brewed Cappuccino</strong>.
          </p>

          {/* Live Inventory Counter Pill */}
          <div
            style={{
              marginTop: 26,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: !AUDIENCE_PASSES_ANNOUNCED
                ? 'rgba(251, 191, 36, 0.15)'
                : inventory.isSoldOut
                ? 'rgba(139,0,0,0.85)'
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: !AUDIENCE_PASSES_ANNOUNCED
                ? '1px solid rgba(251, 191, 36, 0.45)'
                : inventory.isSoldOut
                ? '1px solid #FF6B6B'
                : '1px solid rgba(245, 232, 208, 0.35)',
              borderRadius: 30,
              padding: '8px 20px',
              color: '#FAF5EF',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: !AUDIENCE_PASSES_ANNOUNCED ? '#FBBF24' : inventory.isSoldOut ? '#FF6B6B' : '#4ADE80',
                boxShadow: !AUDIENCE_PASSES_ANNOUNCED
                  ? '0 0 10px #FBBF24'
                  : inventory.isSoldOut
                  ? '0 0 10px #FF6B6B'
                  : '0 0 10px #4ADE80',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: 0.5 }}>
              {!AUDIENCE_PASSES_ANNOUNCED ? (
                '📢 PASS DISTRIBUTION ANNOUNCING SOON · CAPACITY: 60 PASSES'
              ) : inventory.isSoldOut ? (
                'SOLD OUT — ALL 60 PASSES RESERVED'
              ) : (
                <>
                  <span style={{ color: '#FBBF24', fontSize: '1.15rem' }}>{inventory.availablePasses}</span> /{' '}
                  {inventory.maximumPasses} Passes Remaining
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '30px 16px 0' }}>
        {/* ======================================================== */}
        {/* 1. CONFIRMED PASS VIEW (SINGLE QR LIFECYCLE DISPLAY) */}
        {/* ======================================================== */}
        {confirmedPass ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              boxShadow: '0 12px 36px rgba(18, 63, 61, 0.12)',
              border: '2px solid #123F3D',
              overflow: 'hidden',
              marginBottom: 30,
            }}
          >
            {/* Pass Header */}
            <div
              style={{
                background: '#123F3D',
                color: '#FAF5EF',
                padding: '24px 20px',
                textAlign: 'center',
                borderBottom: '4px solid #8B0000',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#F5E8D0',
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                THE MORAS CAFE · OFFICIAL EVENT PASS
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.85rem',
                  color: '#F5E8D0',
                  letterSpacing: 1,
                }}
              >
                MORAS LIVE AUDIENCE PASS
              </h2>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#FBBF24',
                  marginTop: 8,
                  letterSpacing: 1.5,
                }}
              >
                #{confirmedPass.passId}
              </div>
            </div>

            {/* Pass Body */}
            <div style={{ padding: '28px 24px' }}>
              {/* Status Banner */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background:
                    confirmedPass.paymentStatus === 'PAID'
                      ? 'rgba(74, 222, 128, 0.15)'
                      : '#FEF3C7',
                  border:
                    confirmedPass.paymentStatus === 'PAID'
                      ? '1px solid #22C55E'
                      : '1px solid #F59E0B',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: confirmedPass.paymentStatus === 'PAID' ? '#15803D' : '#92400E',
                  }}
                >
                  {confirmedPass.paymentStatus === 'PAID'
                    ? '✅ PASS CONFIRMED & ACTIVE'
                    : '🎟️ RESERVATION CONFIRMED — PAYMENT DUE AT EVENT ENTRY'}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#4B5563', marginTop: 6, lineHeight: 1.5 }}>
                  {confirmedPass.paymentStatus === 'PAID'
                    ? 'Your pass is confirmed. Please present your QR code at the event entrance.'
                    : 'Your MORAS LIVE pass is reserved. Please present your QR code at the event entrance and pay ₹149 by cash or UPI to receive entry.'}
                </div>
              </div>

              {/* QR Code Section */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  background: '#F9F7F2',
                  borderRadius: 14,
                  border: '1.5px dashed #123F3D',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#123F3D', marginBottom: 12 }}>
                  OFFICIAL EVENT ENTRY QR CODE
                </div>

                {qrCodeDataUrl ? (
                  <div style={{ display: 'inline-block', padding: 12, background: '#FFFFFF', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <img
                      src={qrCodeDataUrl}
                      alt={`MORAS LIVE QR Pass ${confirmedPass.passId}`}
                      style={{ width: 220, height: 220, display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', color: '#666' }}>Generating high-res QR code...</div>
                )}

                <div style={{ fontSize: '0.84rem', color: '#555', marginTop: 12, maxWidth: 440, margin: '12px auto 0', lineHeight: 1.5 }}>
                  Present this exact QR code at the entrance desk to pay ₹149 (Cash/UPI), check in, and redeem your complimentary cappuccino.
                </div>
              </div>

              {/* Customer Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  padding: '18px 20px',
                  background: '#F5E8D0',
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
                    Attendee Name
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#123F3D' }}>
                    {confirmedPass.customerName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
                    Mobile Number
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#123F3D' }}>
                    +91 {confirmedPass.normalizedMobileNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
                    Pass Fee
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#123F3D' }}>
                    ₹{confirmedPass.payableAmount || 149} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8B0000' }}>(Payable at Entrance)</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
                    Perks Included
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#8B0000' }}>
                    ☕ 1 Complimentary Cappuccino
                  </div>
                </div>
              </div>

              {/* Status Checklist (Cappuccino & Entry Check-in) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: confirmedPass.cappuccinoRedeemed ? '#F0FDF4' : '#FFFBEB',
                    border: confirmedPass.cappuccinoRedeemed ? '1px solid #86EFAC' : '1px solid #FDE68A',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: confirmedPass.cappuccinoRedeemed ? '#166534' : '#92400E' }}>
                    ☕ Cappuccino Status
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: 4, color: '#555' }}>
                    {confirmedPass.cappuccinoRedeemed
                      ? 'Redeemed at Café Bar'
                      : confirmedPass.paymentStatus === 'PAID'
                      ? 'Ready to redeem at Café Bar'
                      : 'Available upon entrance check-in'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: confirmedPass.entryCheckedIn ? '#F0FDF4' : '#F8FAFC',
                    border: confirmedPass.entryCheckedIn ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: confirmedPass.entryCheckedIn ? '#166534' : '#475569' }}>
                    🚪 Event Entry Status
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: 4, color: '#555' }}>
                    {confirmedPass.entryCheckedIn
                      ? 'Admitted / Checked In'
                      : confirmedPass.paymentStatus === 'PAID'
                      ? 'Ready for Door Check-In'
                      : 'Pay ₹149 at entrance desk to enter'}
                  </div>
                </div>
              </div>

              {/* Next Steps Instructions */}
              <div
                style={{
                  background: '#FAF5EF',
                  borderLeft: '4px solid #123F3D',
                  padding: '18px 20px',
                  borderRadius: '0 10px 10px 0',
                  marginBottom: 26,
                }}
              >
                <div style={{ fontWeight: 800, color: '#123F3D', fontSize: '0.95rem', marginBottom: 8 }}>
                  📌 Event Entrance Instructions:
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: '#4A5568', lineHeight: 1.65 }}>
                  <li>
                    Tap <strong>DOWNLOAD MY PASS</strong> below to save your pass image, or check your registered email for your pass copy.
                  </li>
                  <li>
                    Arrive at <strong>THE MORAS CAFE</strong> on event day and present this QR code at the entrance desk.
                  </li>
                  <li>
                    Pay <strong>₹149 via Cash or UPI</strong> directly to the entrance team to complete check-in.
                  </li>
                  <li>
                    Head over to the coffee bar to claim your <strong>complimentary freshly brewed cappuccino</strong> and enjoy the show!
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  style={{
                    flex: '1 1 200px',
                    padding: '14px 20px',
                    background: '#123F3D',
                    color: '#FAF5EF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(18, 63, 61, 0.25)',
                  }}
                >
                  📥 DOWNLOAD MY PASS
                </button>

                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    flex: '1 1 140px',
                    padding: '14px 18px',
                    background: '#FAF5EF',
                    color: '#123F3D',
                    border: '1.5px solid #123F3D',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId ? '✓ ID Copied' : '📋 Copy Pass ID'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    flex: '1 1 180px',
                    padding: '14px 18px',
                    background: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  💬 Share on WhatsApp
                </button>
              </div>

              {/* Reset link */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  ← Register another person
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* 2. REGISTRATION FORM (WHEN NOT VIEWING CONFIRMED PASS) */}
        {/* ======================================================== */}
        {!confirmedPass && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              border: '1px solid #E5DFD5',
              padding: '32px 24px',
              marginBottom: 30,
            }}
          >
            {!AUDIENCE_PASSES_ANNOUNCED ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{ fontSize: '3.2rem', marginBottom: 12 }}>🎟️</div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: '#8B0000',
                    marginBottom: 8,
                  }}
                >
                  OFFICIAL ANNOUNCEMENT PENDING
                </div>
                <h2
                  style={{
                    margin: '0 0 14px',
                    color: '#123F3D',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
                    fontWeight: 800,
                  }}
                >
                  Audience Passes Opening Soon
                </h2>
                <p
                  style={{
                    color: '#555',
                    maxWidth: 540,
                    margin: '0 auto 24px',
                    lineHeight: 1.65,
                    fontSize: '1rem',
                  }}
                >
                  Official audience pass distribution for <strong>MORAS LIVE</strong> has not officially opened yet.
                  Stay tuned on Instagram{' '}
                  <a
                    href="https://instagram.com/themorascafe"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#8B0000', fontWeight: 700 }}
                  >
                    @themorascafe
                  </a>{' '}
                  for the official release date and time announcement.
                </p>

                <div
                  style={{
                    background: '#FAF5EF',
                    border: '1px solid #EADDCF',
                    borderRadius: 14,
                    padding: '24px 20px',
                    maxWidth: 520,
                    margin: '0 auto',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: '#7A6B62',
                      marginBottom: 6,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    ARE YOU AN ARTIST OR CREATOR?
                  </div>
                  <div style={{ fontSize: '1rem', color: '#123F3D', fontWeight: 700, marginBottom: 16 }}>
                    Performer registrations are opening! Showcase your singing, rap, poetry, comedy, or music on the Moras stage.
                  </div>
                  <Link
                    to="/moras-live/register"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#123F3D',
                      color: '#FAF5EF',
                      padding: '12px 26px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      textDecoration: 'none',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 14px rgba(18, 63, 61, 0.25)',
                    }}
                  >
                    <span>🎤 REGISTER AS A PERFORMER</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ) : inventory.isSoldOut ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
                <h2 style={{ color: '#8B0000', margin: '0 0 12px' }}>ALL 60 AUDIENCE PASSES HAVE BEEN RESERVED</h2>
                <p style={{ color: '#555', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Thank you for the tremendous enthusiasm from Vijayapura's creative community! All 60 individual
                  audience passes have been allocated. If you already registered, please check your email for your confirmation pass.
                </p>
              </div>
            ) : (
              <>
                <div style={{ borderBottom: '2px solid #F5E8D0', paddingBottom: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8B0000' }}>
                    OFFICIAL REGISTRATION
                  </div>
                  <h2 style={{ margin: '4px 0 8px', color: '#123F3D', fontFamily: "'Playfair Display', serif", fontSize: '1.75rem' }}>
                    Reserve Your Audience Pass
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.92rem', lineHeight: 1.5 }}>
                    <strong>1 Person = 1 Pass.</strong> Group bookings are strictly not permitted. Fill out your details below to reserve your individual pass and receive your unique entry QR code immediately.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Field 1: Full Name */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      htmlFor="fullName"
                      style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#123F3D', marginBottom: 6 }}
                    >
                      Full Name <span style={{ color: '#8B0000' }}>*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="e.g. Ramesh Kulkarni"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: errors.fullName ? '1.5px solid #DC2626' : '1.5px solid #D1D5DB',
                        fontSize: '0.98rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.fullName && (
                      <div style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: 4 }}>{errors.fullName}</div>
                    )}
                  </div>

                  {/* Field 2: Mobile Number */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      htmlFor="mobileNumber"
                      style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#123F3D', marginBottom: 6 }}
                    >
                      10-Digit Mobile Number <span style={{ color: '#8B0000' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#F3F4F6',
                          border: '1.5px solid #D1D5DB',
                          borderRadius: 8,
                          fontWeight: 700,
                          color: '#4B5563',
                          fontSize: '0.98rem',
                        }}
                      >
                        +91
                      </div>
                      <input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: 8,
                          border: errors.mobileNumber ? '1.5px solid #DC2626' : '1.5px solid #D1D5DB',
                          fontSize: '0.98rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {errors.mobileNumber && (
                      <div style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: 4 }}>{errors.mobileNumber}</div>
                    )}
                    <small style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                      Strictly one pass per mobile number. Your QR pass is verified against this number at the entrance desk.
                    </small>
                  </div>

                  {/* Field 3: Email Address */}
                  <div style={{ marginBottom: 24 }}>
                    <label
                      htmlFor="email"
                      style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#123F3D', marginBottom: 6 }}
                    >
                      Email Address <span style={{ color: '#8B0000' }}>*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ramesh@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: errors.email ? '1.5px solid #DC2626' : '1.5px solid #D1D5DB',
                        fontSize: '0.98rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.email && (
                      <div style={{ color: '#DC2626', fontSize: '0.82rem', marginTop: 4 }}>{errors.email}</div>
                    )}
                    <small style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                      Your official QR ticket will also be emailed to this address.
                    </small>
                  </div>

                  {/* Pricing and Entrance Payment Notice */}
                  <div
                    style={{
                      background: '#F9F7F2',
                      border: '1px solid #E5DFD5',
                      borderRadius: 10,
                      padding: '16px 18px',
                      marginBottom: 24,
                      fontSize: '0.88rem',
                      color: '#4B5563',
                      lineHeight: 1.55,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#123F3D', marginBottom: 4 }}>
                      ☕ Official Pass Details:
                    </div>
                    <div>• <strong>Price:</strong> ₹149 per person (no payment needed today).</div>
                    <div>• <strong>Payment Method:</strong> Cash or UPI collected physically at the event entrance upon arrival.</div>
                    <div>• <strong>Perk Included:</strong> Full admission plus one complimentary freshly-brewed hot Cappuccino.</div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || inventory.isSoldOut}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: inventory.isSoldOut ? '#9CA3AF' : '#123F3D',
                      color: '#FAF5EF',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      cursor: inventory.isSoldOut ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(18, 63, 61, 0.25)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSubmitting ? 'GENERATING YOUR UNIQUE PASS...' : 'RESERVE MY AUDIENCE PASS'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Performer Registration Callout */}
        <div
          style={{
            background: '#F5E8D0',
            border: '1.5px solid #D4C3A3',
            borderRadius: 14,
            padding: '20px 24px',
            textAlign: 'center',
            marginBottom: 30,
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#123F3D', marginBottom: 6 }}>
            🎤 Are you a Performer or Artist?
          </div>
          <p style={{ margin: '0 auto 14px', maxWidth: 520, fontSize: '0.9rem', color: '#4A5568', lineHeight: 1.5 }}>
            Singers, rappers, poets, comedians, musicians, dancers, and creative performers have their own dedicated stage registration!
          </p>
          <Link
            to="/moras-live/register"
            style={{
              display: 'inline-block',
              background: '#8B0000',
              color: '#FAF5EF',
              padding: '10px 22px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              letterSpacing: 0.5,
            }}
          >
            Register as a Performer →
          </Link>
        </div>
      </div>
    </div>
  );
}
