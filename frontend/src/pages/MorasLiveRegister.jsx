import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const PARTICIPATION_ROLES = [
  'Singer',
  'Rapper',
  'Poet / Spoken Word Artist',
  'Comedian',
  'Dancer',
  'Beatboxer',
  'Musician / Instrumentalist',
  'Freestyle Artist',
  'Content Creator',
  'Audience / Attendee',
  'Other',
];

export default function MorasLiveRegister() {
  useSEO({
    title: 'MORAS LIVE — Official Event Registration | The Moras Cafe',
    description:
      "Register for MORAS LIVE — an open stage celebration of poetry, music, rap, comedy, and creative expression at The Moras Cafe. Your mic. Your moment.",
    canonical: '/moras-live/register',
  });

  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    participationRole: 'Singer',
    otherRole: '',
    instagramUsername: '',
    performanceDescription: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const isPerformer = formData.participationRole !== 'Audience / Attendee';
  const isOther = formData.participationRole === 'Other';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error on change
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

    // 1. Full Name
    const cleanName = formData.fullName.trim();
    if (!cleanName) {
      newErrors.fullName = 'Please enter your full name';
    } else if (cleanName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // 2. Mobile Number (Indian 10-digit)
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

    // 3. Email
    const cleanEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // 4. Other Role
    if (isOther && !formData.otherRole.trim()) {
      newErrors.otherRole = 'Please specify your creative role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast('Please review the form for errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/moras-live/register', {
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        participationRole: formData.participationRole,
        otherRole: isOther ? formData.otherRole.trim() : '',
        instagramUsername: formData.instagramUsername.trim().replace(/^@+/, ''),
        performanceDescription: formData.performanceDescription.trim(),
      });

      if (res.data && res.data.success) {
        setSubmissionSuccess(res.data);
        toast('Registration successful! You are on the list 🎉');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      if (err.response?.status === 409) {
        // Duplicate registration
        const dupData = err.response.data;
        setErrors({
          duplicate:
            dupData.message ||
            `You are already registered for MORAS LIVE with ID: ${dupData.registrationId}`,
        });
        toast('Already registered! See details above.');
      } else if (err.response?.data?.field) {
        setErrors((prev) => ({
          ...prev,
          [err.response.data.field]: err.response.data.message,
        }));
        toast(err.response.data.message);
      } else {
        const msg =
          err.response?.data?.message ||
          'Unable to complete registration. Please check your connection and try again.';
        setErrors({ general: msg });
        toast(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submissionSuccess?.registrationId) {
      navigator.clipboard.writeText(submissionSuccess.registrationId);
      setCopiedId(true);
      toast('Registration ID copied to clipboard 📋');
      setTimeout(() => setCopiedId(false), 3000);
    }
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setFormData({
      fullName: '',
      mobileNumber: '',
      email: '',
      participationRole: 'Singer',
      otherRole: '',
      instagramUsername: '',
      performanceDescription: '',
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="section moras-live-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto 16px', padding: '0 16px', position: 'relative', zIndex: 2 }}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'MORAS LIVE' }]} />
      </div>

      {/* Decorative ambient watermark */}
      <div className="brand-watermark-light menu-watermark-top" aria-hidden="true" />

      <div className="moras-live-container" style={{ maxWidth: 780, margin: '0 auto', padding: '0 16px 60px', position: 'relative', zIndex: 2 }}>
        
        {/* ================= HERO HEADER ================= */}
        <header className="moras-live-header" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="moras-live-badge-wrapper">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(18, 63, 61, 0.08)',
                border: '1px solid rgba(18, 63, 61, 0.2)',
                color: '#123F3D',
                borderRadius: 24,
                padding: '6px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              <span>🎙️</span>
              <span>THE MORAS CAFE PRESENTS</span>
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
              color: '#123F3D',
              margin: '0 0 8px',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              fontWeight: 800,
            }}
          >
            MORAS LIVE
          </h1>

          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: '#8B0000',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              margin: '0 0 16px',
            }}
          >
            YOUR MIC. YOUR MOMENT.
          </div>

          <div
            style={{
              display: 'inline-block',
              width: 60,
              height: 3,
              background: '#8B0000',
              borderRadius: 2,
              margin: '0 auto 20px',
            }}
          />

          <div
            style={{
              background: 'var(--white, #ffffff)',
              border: '1px solid var(--cream-dark, #e8d4a8)',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: 'var(--shadow, 0 8px 32px rgba(15, 61, 62, 0.08))',
              textAlign: 'left',
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.25rem',
                color: '#123F3D',
                margin: '0 0 8px',
                fontWeight: 700,
              }}
            >
              BE A PART OF SOMETHING CREATIVE.
            </h2>
            <p
              style={{
                color: 'var(--text-light, #6b4c35)',
                fontSize: '0.96rem',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Whether you’re here to perform, express yourself, or simply experience the vibrant café atmosphere, we’d love to have you with us. Register your interest below and become a part of MORAS LIVE.
            </p>
          </div>
        </header>

        {/* ================= SUCCESS CONFIRMATION STATE ================= */}
        {submissionSuccess ? (
          <div
            className="moras-live-success-card"
            style={{
              background: 'var(--white, #ffffff)',
              border: '2px solid #10b981',
              borderRadius: 20,
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(16, 185, 129, 0.14)',
              animation: 'fadeInUp 0.4s ease-out forwards',
            }}
          >
            <div style={{ fontSize: '3.6rem', marginBottom: 12 }} aria-hidden="true">
              🎉
            </div>

            <span
              style={{
                display: 'inline-block',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Official Registration Confirmed
            </span>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '2rem',
                color: '#123F3D',
                margin: '0 0 8px',
                fontWeight: 800,
              }}
            >
              YOU'RE ON THE LIST!
            </h2>

            <p
              style={{
                color: 'var(--text-light, #6b4c35)',
                fontSize: '1.02rem',
                lineHeight: 1.6,
                maxWidth: 540,
                margin: '0 auto 24px',
              }}
            >
              Thank you for registering for MORAS LIVE, <strong>{submissionSuccess.registration?.fullName || formData.fullName}</strong>. We've received your details and look forward to having you with us.
            </p>

            {/* Registration ID Badge */}
            <div
              style={{
                background: 'var(--cream-light, #fdf8f0)',
                border: '1.5px dashed var(--cream-dark, #e8d4a8)',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
                minWidth: 260,
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#6b4c35', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                Your Official Registration ID
              </span>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#123F3D',
                  letterSpacing: 2,
                }}
              >
                {submissionSuccess.registrationId}
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  background: copiedId ? '#059669' : '#123F3D',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginTop: 4,
                }}
              >
                {copiedId ? '✓ Copied to Clipboard!' : '📋 Copy ID'}
              </button>
            </div>

            {/* Registration Summary details */}
            <div
              style={{
                background: 'var(--cream-light, #fdf8f0)',
                border: '1px solid var(--cream-dark, #e8d4a8)',
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'left',
                maxWidth: 480,
                margin: '0 auto 28px',
                fontSize: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-light)' }}>Role:</span>
                <strong style={{ color: '#123F3D' }}>
                  {submissionSuccess.registration?.participationRole}
                  {submissionSuccess.registration?.otherRole ? ` (${submissionSuccess.registration.otherRole})` : ''}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-light)' }}>Mobile:</span>
                <strong style={{ color: '#123F3D' }}>+91 {submissionSuccess.registration?.mobileNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Email:</span>
                <strong style={{ color: '#123F3D' }}>{submissionSuccess.registration?.email}</strong>
              </div>
            </div>

            {/* Note on Paid Entry */}
            <div
              style={{
                background: 'rgba(139, 0, 0, 0.05)',
                border: '1px solid rgba(139, 0, 0, 0.2)',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: '0.86rem',
                color: '#8B0000',
                lineHeight: 1.5,
                maxWidth: 540,
                margin: '0 auto 28px',
              }}
            >
              <strong>Event Schedule & Entry Note:</strong> MORAS LIVE is a ticketed gathering. Official event dates, stage slots, and entry ticketing will be communicated via WhatsApp and Email to registered participants before public release.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/menu"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 24,
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                <span>☕</span>
                <span>Explore The Cafe Menu</span>
              </Link>
              <button
                type="button"
                onClick={handleResetForm}
                className="btn-outline"
                style={{
                  padding: '12px 22px',
                  borderRadius: 24,
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Register Another Person
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN REGISTRATION FORM ================= */
          <form
            onSubmit={handleSubmit}
            className="moras-live-form"
            noValidate
            style={{
              background: 'var(--white, #ffffff)',
              border: '1px solid var(--cream-dark, #e8d4a8)',
              borderRadius: 20,
              padding: 'clamp(20px, 4vw, 36px)',
              boxShadow: 'var(--shadow, 0 8px 32px rgba(15, 61, 62, 0.08))',
            }}
          >
            {/* Top error alert banner */}
            {errors.duplicate && (
              <div
                role="alert"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: '14px 18px',
                  color: '#991b1b',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  marginBottom: 24,
                }}
              >
                <strong>⚠️ Already Registered:</strong> {errors.duplicate}
              </div>
            )}

            {errors.general && (
              <div
                role="alert"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: '14px 18px',
                  color: '#991b1b',
                  fontSize: '0.92rem',
                  marginBottom: 24,
                }}
              >
                <strong>Error:</strong> {errors.general}
              </div>
            )}

            {/* FIELD 1: PARTICIPATION ROLE */}
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label
                htmlFor="participationRole"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                1. How would you like to participate? <span style={{ color: '#8B0000' }}>*</span>
              </label>

              <select
                id="participationRole"
                name="participationRole"
                value={formData.participationRole}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${errors.participationRole ? '#dc2626' : 'var(--cream-dark, #e8d4a8)'}`,
                  background: 'var(--cream-light, #fdf8f0)',
                  color: 'var(--text, #2c1810)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto',
                }}
              >
                {PARTICIPATION_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <small style={{ display: 'block', color: 'var(--text-light, #6b4c35)', marginTop: 6, fontSize: '0.82rem' }}>
                {isPerformer
                  ? '🎤 Performer slot — showcase your craft on our curated stage.'
                  : '👥 Audience entry — enjoy live acoustics, stories, and café vibes.'}
              </small>
            </div>

            {/* FIELD 1.1: CONDITIONAL OTHER ROLE */}
            {isOther && (
              <div className="form-group" style={{ marginBottom: 22 }}>
                <label
                  htmlFor="otherRole"
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    color: '#123F3D',
                    fontSize: '0.94rem',
                    marginBottom: 8,
                  }}
                >
                  Specify Your Creative Role <span style={{ color: '#8B0000' }}>*</span>
                </label>
                <input
                  type="text"
                  id="otherRole"
                  name="otherRole"
                  value={formData.otherRole}
                  onChange={handleChange}
                  placeholder="e.g. Magic / Illusionist, Storyteller, Beat Producer"
                  required
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${errors.otherRole ? '#dc2626' : 'var(--cream-dark, #e8d4a8)'}`,
                    background: 'var(--cream-light, #fdf8f0)',
                    color: 'var(--text, #2c1810)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                {errors.otherRole && (
                  <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                    {errors.otherRole}
                  </span>
                )}
              </div>
            )}

            {/* FIELD 2: FULL NAME */}
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label
                htmlFor="fullName"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                2. Full Name <span style={{ color: '#8B0000' }}>*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your official full name"
                required
                autoComplete="name"
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${errors.fullName ? '#dc2626' : 'var(--cream-dark, #e8d4a8)'}`,
                  background: 'var(--cream-light, #fdf8f0)',
                  color: 'var(--text, #2c1810)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              {errors.fullName && (
                <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* FIELD 3: MOBILE NUMBER */}
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label
                htmlFor="mobileNumber"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                3. Mobile Number (WhatsApp) <span style={{ color: '#8B0000' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    background: 'var(--cream, #f5e6c8)',
                    border: '1.5px solid var(--cream-dark, #e8d4a8)',
                    borderRight: 'none',
                    borderRadius: '10px 0 0 10px',
                    padding: '13px 14px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#123F3D',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                  autoComplete="tel"
                  maxLength={15}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    borderRadius: '0 10px 10px 0',
                    border: `1.5px solid ${errors.mobileNumber ? '#dc2626' : 'var(--cream-dark, #e8d4a8)'}`,
                    background: 'var(--cream-light, #fdf8f0)',
                    color: 'var(--text, #2c1810)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
              {errors.mobileNumber ? (
                <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                  {errors.mobileNumber}
                </span>
              ) : (
                <small style={{ color: 'var(--text-light, #6b4c35)', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                  We will share stage slot confirmation & entry details via WhatsApp.
                </small>
              )}
            </div>

            {/* FIELD 4: EMAIL ADDRESS */}
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                4. Email Address <span style={{ color: '#8B0000' }}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                maxLength={150}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${errors.email ? '#dc2626' : 'var(--cream-dark, #e8d4a8)'}`,
                  background: 'var(--cream-light, #fdf8f0)',
                  color: 'var(--text, #2c1810)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              {errors.email && (
                <span style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* OPTIONAL FIELD 5: INSTAGRAM USERNAME */}
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label
                htmlFor="instagramUsername"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                5. Instagram Handle <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>(Optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    background: 'var(--cream, #f5e6c8)',
                    border: '1.5px solid var(--cream-dark, #e8d4a8)',
                    borderRight: 'none',
                    borderRadius: '10px 0 0 10px',
                    padding: '13px 14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#8B0000',
                    userSelect: 'none',
                  }}
                >
                  @
                </span>
                <input
                  type="text"
                  id="instagramUsername"
                  name="instagramUsername"
                  value={formData.instagramUsername}
                  onChange={handleChange}
                  placeholder="your_handle"
                  maxLength={60}
                  style={{
                    flex: 1,
                    padding: '13px 16px',
                    borderRadius: '0 10px 10px 0',
                    border: '1.5px solid var(--cream-dark, #e8d4a8)',
                    background: 'var(--cream-light, #fdf8f0)',
                    color: 'var(--text, #2c1810)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>
              <small style={{ color: 'var(--text-light, #6b4c35)', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                Allows our curation team to feature your art & tag you in event highlights.
              </small>
            </div>

            {/* OPTIONAL FIELD 6: PERFORMANCE DESCRIPTION */}
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label
                htmlFor="performanceDescription"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#123F3D',
                  fontSize: '0.94rem',
                  marginBottom: 8,
                }}
              >
                {isPerformer ? '6. What would you like to showcase at MORAS LIVE?' : '6. Any notes or favorite performances you hope to see?'}{' '}
                <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>(Optional)</span>
              </label>
              <textarea
                id="performanceDescription"
                name="performanceDescription"
                value={formData.performanceDescription}
                onChange={handleChange}
                rows={3}
                placeholder={
                  isPerformer
                    ? 'Tell us briefly about your style, song/poem language, track vs acoustic instrument needs, etc.'
                    : 'Any favorite genres or vibes you are looking forward to?'
                }
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: '1.5px solid var(--cream-dark, #e8d4a8)',
                  background: 'var(--cream-light, #fdf8f0)',
                  color: 'var(--text, #2c1810)',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* ================= IMPORTANT PAID ENTRY NOTICE ================= */}
            <div
              className="moras-live-notice-card"
              style={{
                background: 'rgba(18, 63, 61, 0.04)',
                border: '1.5px solid rgba(18, 63, 61, 0.15)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 24,
                fontSize: '0.88rem',
                color: '#123F3D',
                lineHeight: 1.55,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }} aria-hidden="true">
                  🎟️
                </span>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4, color: '#123F3D' }}>
                    Notice Regarding Event Entry & Ticketing
                  </strong>
                  <span>
                    MORAS LIVE is a curated, ticketed experience. Official event dates, stage schedules, and entry passes are currently being finalized. Registering today places you on our priority list for performer curation and early access without requiring payment now.
                  </span>
                </div>
              </div>
            </div>

            {/* PRIVACY NOTICE */}
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-light, #6b4c35)',
                lineHeight: 1.5,
                margin: '0 0 24px',
                textAlign: 'center',
              }}
            >
              🔒 <strong>Privacy Assurance:</strong> Your contact information will be used solely for MORAS LIVE registration, schedule updates, and communication by The Moras Cafe team.
            </p>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px 28px',
                borderRadius: 30,
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                boxShadow: '0 8px 24px rgba(18, 63, 61, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  <span>Registering Your Spot…</span>
                </>
              ) : (
                <>
                  <span>REGISTER FOR MORAS LIVE</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: '0.88rem',
                  color: '#8B0000',
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                BREWED WITH CHARACTER.
              </span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
