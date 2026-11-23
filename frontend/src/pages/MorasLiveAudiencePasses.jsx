import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

export default function MorasLiveAudiencePasses() {
  useSEO({
    title: 'MORAS LIVE — Limited Audience Passes (60 Max) | The Moras Cafe',
    description:
      'Reserve your exclusive limited audience pass for MORAS LIVE at The Moras Cafe in Vijayapura. Exactly 60 passes available. Each pass includes one complimentary freshly-brewed Cappuccino.',
    canonical: '/moras-live/passes',
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

  // Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [activeTab, setActiveTab] = useState('reserve'); // 'reserve' | 'lookup'

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

  // Handle URL params for direct pass lookup (e.g. /moras-live/passes?passId=ML-0001&token=...)
  useEffect(() => {
    const urlPassId = searchParams.get('passId');
    const urlToken = searchParams.get('token');
    const urlMobile = searchParams.get('mobile');

    if (urlPassId || urlToken || urlMobile) {
      lookupPass({ passId: urlPassId, token: urlToken, mobileNumber: urlMobile });
    }
  }, [searchParams]);

  // Lookup Pass Helper
  const lookupPass = async (params) => {
    setIsLookingUp(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.passId) queryParams.set('passId', params.passId);
      if (params.token) queryParams.set('token', params.token);
      if (params.mobileNumber) queryParams.set('mobileNumber', params.mobileNumber);

      const res = await api.get(`/moras-live/passes/lookup?${queryParams.toString()}`);
      if (res.data?.success && res.data?.pass) {
        setConfirmedPass(res.data.pass);
        setQrCodeDataUrl(res.data.qrCodeDataUrl || '');
        setPassUrl(res.data.passUrl || '');
        toast(`Pass ${res.data.pass.passId} loaded successfully`);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Pass not found. Please check your Pass ID or Mobile Number.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    const query = lookupQuery.trim();
    if (!query) {
      toast('Please enter your Pass ID (e.g. ML-0001) or 10-digit mobile number');
      return;
    }

    if (/^[6-9]\d{9}$/.test(query.replace(/\D/g, ''))) {
      lookupPass({ mobileNumber: query.replace(/\D/g, '') });
    } else if (query.toUpperCase().startsWith('ML-')) {
      lookupPass({ passId: query.toUpperCase() });
    } else {
      lookupPass({ passId: query });
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
              background: inventory.isSoldOut ? 'rgba(139,0,0,0.85)' : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: inventory.isSoldOut ? '1px solid #FF6B6B' : '1px solid rgba(245, 232, 208, 0.35)',
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
                background: inventory.isSoldOut ? '#FF6B6B' : '#4ADE80',
                boxShadow: inventory.isSoldOut ? '0 0 10px #FF6B6B' : '0 0 10px #4ADE80',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: 0.5 }}>
              {inventory.isSoldOut ? (
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
        {/* Toggle between Register and Find Existing Pass */}
        {!confirmedPass && (
          <div
            style={{
              display: 'flex',
              background: '#EAE1D2',
              borderRadius: 12,
              padding: 4,
              marginBottom: 26,
              border: '1px solid rgba(18, 63, 61, 0.15)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('reserve')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 9,
                border: 'none',
                background: activeTab === 'reserve' ? '#123F3D' : 'transparent',
                color: activeTab === 'reserve' ? '#F5E8D0' : '#4A5568',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🎟️ Reserve New Pass (1 Person = 1 Pass)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lookup')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 9,
                border: 'none',
                background: activeTab === 'lookup' ? '#123F3D' : 'transparent',
                color: activeTab === 'lookup' ? '#F5E8D0' : '#4A5568',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔍 View My Reserved Pass / QR
            </button>
          </div>
        )}

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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background:
                    confirmedPass.paymentStatus === 'PAID'
                      ? 'rgba(74, 222, 128, 0.15)'
                      : 'rgba(251, 191, 36, 0.15)',
                  border:
                    confirmedPass.paymentStatus === 'PAID'
                      ? '1px solid #22C55E'
                      : '1px solid #F59E0B',
                  marginBottom: 24,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>
                    Pass Status
                  </div>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: confirmedPass.paymentStatus === 'PAID' ? '#15803D' : '#B45309',
                    }}
                  >
                    {confirmedPass.paymentStatus === 'PAID' ? '✅ CONFIRMED & ACTIVE' : '⏳ PAYMENT PENDING AT CAFÉ'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}>
                    Payable Amount
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#123F3D' }}>
                    ₹{confirmedPass.payableAmount || 149}
                    <small style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginLeft: 4 }}>
                      (Pay at Cafe)
                    </small>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 10px',
                  background: '#F9F7F2',
                  borderRadius: 14,
                  border: '1px dashed #123F3D',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#123F3D', marginBottom: 12 }}>
                  YOUR SINGLE OFFICIAL PASS QR CODE
                </div>

                {qrCodeDataUrl ? (
                  <div style={{ display: 'inline-block', padding: 10, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <img
                      src={qrCodeDataUrl}
                      alt={`MORAS LIVE QR Pass ${confirmedPass.passId}`}
                      style={{ width: 220, height: 220, display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', color: '#666' }}>Generating high-res QR code...</div>
                )}

                <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 12, maxWidth: 440, margin: '12px auto 0' }}>
                  This exact QR remains your only pass for payment verification, complimentary cappuccino, and event entry.
                </div>
              </div>

              {/* Customer Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  padding: '16px 20px',
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
                    Email
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#123F3D', wordBreak: 'break-all' }}>
                    {confirmedPass.email}
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
                      ? 'Redeemed at Café Counter'
                      : confirmedPass.paymentStatus === 'PAID'
                      ? 'Ready to redeem at Café Counter'
                      : 'Available after payment confirmation'}
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
                      : 'Requires payment before entry'}
                  </div>
                </div>
              </div>

              {/* Next Steps Instructions */}
              <div
                style={{
                  background: '#FAF5EF',
                  borderLeft: '4px solid #123F3D',
                  padding: '16px 18px',
                  borderRadius: '0 10px 10px 0',
                  marginBottom: 26,
                }}
              >
                <div style={{ fontWeight: 800, color: '#123F3D', fontSize: '0.95rem', marginBottom: 8 }}>
                  📌 What to do next:
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: '#4A5568', lineHeight: 1.6 }}>
                  <li>
                    <strong>Visit THE MORAS CAFE</strong> (B M Patil Circle, Solapur Bypass, Vijayapura).
                  </li>
                  <li>
                    Show this <strong>QR Code or Pass ID (#{confirmedPass.passId})</strong> to our cashier desk.
                  </li>
                  <li>
                    Pay via <strong>UPI or Cash</strong> at the counter to activate your ticket.
                  </li>
                  <li>
                    Enjoy your <strong>complimentary freshly-brewed cappuccino</strong> and keep this QR handy for event admission!
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  style={{
                    flex: '1 1 180px',
                    padding: '12px 18px',
                    background: '#123F3D',
                    color: '#FAF5EF',
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
                  📥 Download QR Image
                </button>

                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    flex: '1 1 140px',
                    padding: '12px 18px',
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
                  onClick={handleCopyLink}
                  style={{
                    flex: '1 1 140px',
                    padding: '12px 18px',
                    background: '#FAF5EF',
                    color: '#123F3D',
                    border: '1.5px solid #123F3D',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  {copiedLink ? '✓ Link Copied' : '🔗 Copy Link'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    flex: '1 1 180px',
                    padding: '12px 18px',
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

              {/* Lookup another pass link */}
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
                  ← Register another person or look up a different pass
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* 2. REGISTRATION FORM (WHEN NOT VIEWING CONFIRMED PASS) */}
        {/* ======================================================== */}
        {!confirmedPass && activeTab === 'reserve' && (
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
            {inventory.isSoldOut ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
                <h2 style={{ color: '#8B0000', margin: '0 0 12px' }}>ALL 60 AUDIENCE PASSES HAVE BEEN RESERVED</h2>
                <p style={{ color: '#555', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Thank you for the tremendous enthusiasm from Vijayapura's creative community! All 60 individual
                  audience passes have been allocated.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('lookup')}
                  style={{
                    padding: '12px 24px',
                    background: '#123F3D',
                    color: '#FAF5EF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Already registered? View your pass &amp; QR code
                </button>
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
                    <strong>1 Person = 1 Pass.</strong> Group bookings are strictly not permitted. Fill out your details below to generate your single official QR pass immediately.
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
                      Strictly one pass per mobile number. Your QR pass is verified against this number at the café.
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
                  </div>

                  {/* Pricing and Payment Notice */}
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
                      ☕ What's included in your pass:
                    </div>
                    <div>• Full admission to MORAS LIVE live performances.</div>
                    <div>• One complimentary freshly-brewed hot Cappuccino.</div>
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#6B7280' }}>
                      <em>Note: Proposed pass price is ₹149. Payment is collected in person at THE MORAS CAFE via UPI or Cash. Online payment is not accepted.</em>
                    </div>
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

        {/* ======================================================== */}
        {/* 3. LOOKUP FORM (FIND EXISTING PASS) */}
        {/* ======================================================== */}
        {!confirmedPass && activeTab === 'lookup' && (
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
            <div style={{ borderBottom: '2px solid #F5E8D0', paddingBottom: 16, marginBottom: 24 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#123F3D' }}>
                PASS RETRIEVAL
              </div>
              <h2 style={{ margin: '4px 0 8px', color: '#123F3D', fontFamily: "'Playfair Display', serif", fontSize: '1.75rem' }}>
                Find Your MORAS LIVE Pass
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Enter your 10-digit mobile number or Pass ID (e.g. ML-0001) to view your official pass, QR code, and current status.
              </p>
            </div>

            <form onSubmit={handleManualLookup}>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="lookupQuery"
                  style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#123F3D', marginBottom: 6 }}
                >
                  Mobile Number or Pass ID
                </label>
                <input
                  id="lookupQuery"
                  type="text"
                  placeholder="e.g. 9876543210 or ML-0001"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  disabled={isLookingUp}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.98rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLookingUp}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#123F3D',
                  color: '#FAF5EF',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(18, 63, 61, 0.25)',
                }}
              >
                {isLookingUp ? 'SEARCHING...' : 'FIND MY PASS & QR CODE'}
              </button>
            </form>
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
