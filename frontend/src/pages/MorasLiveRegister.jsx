import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';
import { AUDIENCE_PASSES_ANNOUNCED } from '../config/eventsConfig';

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
  'Other',
];

export default function MorasLiveRegister() {
  useSEO({
    title: 'MORAS LIVE — Official Performer Registration | The Moras Cafe',
    description:
      "Register as a performer for MORAS LIVE — an open stage celebration of poetry, music, rap, comedy, and creative expression at The Moras Cafe in Vijayapura. Your mic. Your moment.",
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
      newErrors.otherRole = 'Please specify your creative talent';
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

          <div className="moras-live-intro-card">
            <p
              style={{
                color: '#4A3B32',
                fontSize: 'clamp(0.98rem, 1.8vw, 1.05rem)',
                lineHeight: 1.7,
                margin: '0 0 14px',
              }}
            >
              Have a talent you'd love to showcase? MORAS LIVE is opening its stage to Vijayapura's creative community. Whether you're a singer, rapper, poet, comedian, dancer, beatboxer, musician or freestyle artist, we'd love to hear from you.
            </p>
            <p
              style={{
                color: '#123F3D',
                fontSize: 'clamp(0.98rem, 1.8vw, 1.05rem)',
                lineHeight: 1.6,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Register your interest and take your first step towards becoming part of MORAS LIVE.
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
              Official Performer Registration Confirmed
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
              Thank you for registering for MORAS LIVE. Our team will get in touch with you regarding performance coordination and further event details.
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
                <span style={{ color: 'var(--text-light)' }}>Performer Role:</span>
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
                Register Another Performer
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN REGISTRATION FORM ================= */
          <form
            onSubmit={handleSubmit}
            className="moras-live-form"
            noValidate
          >
            {/* Form Section Header */}
            <div style={{ marginBottom: 26, paddingBottom: 16, borderBottom: '1.5px solid var(--cream-dark, #E8D4A8)' }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.4rem, 3vw, 1.65rem)',
                  color: '#123F3D',
                  margin: '0 0 6px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                PERFORMER REGISTRATION
              </h2>
              <p style={{ margin: 0, color: 'var(--text-light, #6B4C35)', fontSize: '0.96rem', lineHeight: 1.55 }}>
                Tell us a little about yourself and the talent you'd like to showcase.
              </p>
            </div>

            {/* Top error alert banner */}
            {errors.duplicate && (
              <div
                role="alert"
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: 12,
                  padding: '14px 18px',
                  color: '#991B1B',
                  fontSize: '0.94rem',
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
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: 12,
                  padding: '14px 18px',
                  color: '#991B1B',
                  fontSize: '0.94rem',
                  lineHeight: 1.5,
                  marginBottom: 24,
                }}
              >
                <strong>Error:</strong> {errors.general}
              </div>
            )}

            {/* FIELD 1: PARTICIPATION ROLE */}
            <div className="moras-form-group">
              <label
                htmlFor="participationRole"
                className="moras-label"
              >
                1. Participation Role <span className="moras-label-required">*</span>
              </label>

              <select
                id="participationRole"
                name="participationRole"
                value={formData.participationRole}
                onChange={handleChange}
                required
                className={`moras-select ${errors.participationRole ? 'has-error' : ''}`}
                style={{ cursor: 'pointer', appearance: 'auto' }}
              >
                {PARTICIPATION_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <small className="moras-helper-text">
                🎤 Performer slot — showcase your craft on our curated stage.
              </small>
            </div>

            {/* FIELD 1.1: CONDITIONAL OTHER ROLE */}
            {isOther && (
              <div className="moras-form-group">
                <label
                  htmlFor="otherRole"
                  className="moras-label"
                >
                  Specify Your Creative Talent <span className="moras-label-required">*</span>
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
                  className={`moras-input ${errors.otherRole ? 'has-error' : ''}`}
                />
                {errors.otherRole && (
                  <span className="moras-error-text">
                    ⚠️ {errors.otherRole}
                  </span>
                )}
              </div>
            )}

            {/* FIELD 2: FULL NAME */}
            <div className="moras-form-group">
              <label
                htmlFor="fullName"
                className="moras-label"
              >
                2. Full Name <span className="moras-label-required">*</span>
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
                className={`moras-input ${errors.fullName ? 'has-error' : ''}`}
              />
              {errors.fullName && (
                <span className="moras-error-text">
                  ⚠️ {errors.fullName}
                </span>
              )}
            </div>

            {/* FIELD 3: MOBILE NUMBER */}
            <div className="moras-form-group">
              <label
                htmlFor="mobileNumber"
                className="moras-label"
              >
                3. Mobile Number (WhatsApp) <span className="moras-label-required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="moras-prefix-badge">
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
                  className={`moras-input moras-input-with-prefix ${errors.mobileNumber ? 'has-error' : ''}`}
                />
              </div>
              {errors.mobileNumber ? (
                <span className="moras-error-text">
                  ⚠️ {errors.mobileNumber}
                </span>
              ) : (
                <small className="moras-helper-text">
                  Our team will contact you regarding performance coordination and event details via WhatsApp.
                </small>
              )}
            </div>

            {/* FIELD 4: EMAIL ADDRESS */}
            <div className="moras-form-group">
              <label
                htmlFor="email"
                className="moras-label"
              >
                4. Email Address <span className="moras-label-required">*</span>
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
                className={`moras-input ${errors.email ? 'has-error' : ''}`}
              />
              {errors.email && (
                <span className="moras-error-text">
                  ⚠️ {errors.email}
                </span>
              )}
            </div>

            {/* OPTIONAL FIELD 5: INSTAGRAM USERNAME */}
            <div className="moras-form-group">
              <label
                htmlFor="instagramUsername"
                className="moras-label"
              >
                5. Instagram Handle <span className="moras-label-optional">(Optional)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  className="moras-prefix-badge"
                  style={{ color: '#8B0000', fontSize: '1.05rem', fontWeight: 800 }}
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
                  className="moras-input moras-input-with-prefix"
                />
              </div>
              <small className="moras-helper-text">
                Share your Instagram profile so our team can discover your work and feature your talent in MORAS LIVE promotions.
              </small>
            </div>

            {/* OPTIONAL FIELD 6: PERFORMANCE DESCRIPTION */}
            <div className="moras-form-group" style={{ marginBottom: 28 }}>
              <label
                htmlFor="performanceDescription"
                className="moras-label"
              >
                6. What would you like to showcase at MORAS LIVE?{' '}
                <span className="moras-label-optional">(Optional)</span>
              </label>
              <textarea
                id="performanceDescription"
                name="performanceDescription"
                value={formData.performanceDescription}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us briefly about your style, performance, preferred language, and any specific requirements such as musical instruments or equipment."
                maxLength={1000}
                className="moras-textarea"
                style={{ resize: 'vertical', minHeight: 100 }}
              />
            </div>

            {/* PRIVACY NOTICE */}
            <div className="moras-privacy-box">
              🔒 <strong>Privacy Assurance:</strong> Your contact information will be used solely for MORAS LIVE registration, schedule updates, and communication by The Moras Cafe team.
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="moras-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  <span>Registering Your Spot…</span>
                </>
              ) : (
                <>
                  <span>REGISTER AS A PERFORMER</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: '0.92rem',
                  color: '#8B0000',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                BREWED WITH CHARACTER.
              </span>
            </div>
          </form>
        )}

        {/* Audience Pass Callout */}
        <aside
          className="moras-audience-card"
          aria-label="Audience Pass Reservation"
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
              fontWeight: 800,
              color: '#123F3D',
              margin: '0 0 8px',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            ATTENDING AS AN AUDIENCE MEMBER?
          </h3>
          <p
            style={{
              margin: '0 auto 18px',
              fontSize: 'clamp(0.92rem, 1.8vw, 1rem)',
              color: '#4A3B32',
              lineHeight: 1.55,
              maxWidth: 520,
            }}
          >
            Limited to 60 individual passes. Each pass includes one complimentary cappuccino.
          </p>
          {AUDIENCE_PASSES_ANNOUNCED ? (
            <Link
              to="/moras-live/passes"
              className="moras-audience-cta"
            >
              <span>RESERVE YOUR AUDIENCE PASS</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  background: '#F5EBE1',
                  border: '1px solid #E2D2C3',
                  borderRadius: 30,
                  color: '#123F3D',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  letterSpacing: '0.5px',
                }}
              >
                <span>🎟️ Audience Passes Opening Soon</span>
              </div>
              <span style={{ fontSize: '0.84rem', color: '#7A6B62', marginTop: 2 }}>
                Audience pass distribution will be announced soon. Stay tuned!
              </span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
