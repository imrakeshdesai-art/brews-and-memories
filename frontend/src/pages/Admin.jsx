import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import useSEO from '../hooks/useSEO';
import {
  saveAdminToken,
  clearAdminToken,
  getAdminToken,
} from '../services/auth';
import { useToast } from '../components/ToastProvider';

function getRoleFromToken(tok) {
  if (!tok) return null;
  try {
    const payload = JSON.parse(atob(tok.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}

const playNewOrderChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);
    
    // Second tone (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

function Admin() {
  const toast = useToast();

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  // IMPORTANT
  const [token, setToken] = useState(getAdminToken());

  const [authChecked, setAuthChecked] = useState(false);

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);
  const [billEmailInput, setBillEmailInput] = useState('');
  const [isSendingBillEmail, setIsSendingBillEmail] = useState(false);
  const [selectedBirthdayBill, setSelectedBirthdayBill] = useState(null);
  const [birthdayFoodTotal, setBirthdayFoodTotal] = useState('');

  const handlePrintBill = () => {
    document.body.classList.add('printing-bill');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-bill');
    }, 500);
  };

  const handleSendBillEmail = async (orderId, targetEmail) => {
    if (!targetEmail || !targetEmail.trim()) {
      toast('Please enter the customer email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      toast('Please enter a valid email address format');
      return;
    }
    setIsSendingBillEmail(true);
    try {
      const res = await api.post(`/orders/${orderId}/send-bill`, { email: targetEmail.trim() });
      toast(res.data.message || 'Bill receipt sent to customer email successfully!');
      setIsSendingBillEmail(false);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, email: targetEmail.trim() } : o));
    } catch (err) {
      setIsSendingBillEmail(false);
      toast(err.response?.data?.message || 'Failed to send bill email');
    }
  };

  // ================= FETCH ORDERS =================
  const fetchOrders = async () => {

    setLoading(true);
    setError('');

    try {

      const res = await api.get('/orders');

      setOrders(res.data);

    } catch (err) {

      console.error('FETCH ORDERS ERROR:', err);

      // Unauthorized
      if (err.response?.status === 401) {

        logout();

        setError('Session expired. Please login again.');

        return;
      }

      // Forbidden
      if (err.response?.status === 403) {

        setError('Access denied.');

        return;
      }

      // Network/CORS
      if (!err.response) {

        setError('Network or CORS error.');

        return;
      }

      setError(
        err.response?.data?.message ||
        'Could not fetch orders'
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH RESERVATIONS =================
  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error('FETCH RESERVATIONS ERROR:', err);
    }
  };

  const role = useMemo(() => getRoleFromToken(token), [token]);
  const prevPendingCountRef = useRef(0);

  useSEO({
    title: role === 'kitchen' ? 'Kitchen KDS' : 'Staff Admin Portal',
    noindex: true,
  });

  // ================= MENU AVAILABILITY (INVENTORY) STATE =================
  const [catalogItems, setCatalogItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [availabilitySearch, setAvailabilitySearch] = useState('');
  const [availabilityCategory, setAvailabilityCategory] = useState('All');
  const [showSoldOutOnly, setShowSoldOutOnly] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  const fetchCatalogAvailability = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.get('/menu/admin/availability');
      if (res.data?.items) {
        setCatalogItems(res.data.items);
      }
    } catch (err) {
      toast('Failed to load menu availability: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingCatalog(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'inventory' && role === 'admin') {
      fetchCatalogAvailability();
    }
  }, [activeTab, role, fetchCatalogAvailability]);

  const handleToggleAvailability = async (item) => {
    const newStatus = !item.isAvailable;
    setTogglingKey(item.itemKey);

    // Optimistic UI update
    setCatalogItems((prev) =>
      prev.map((it) => (it.itemKey === item.itemKey ? { ...it, isAvailable: newStatus } : it))
    );

    try {
      await api.patch(`/menu/admin/availability/${encodeURIComponent(item.itemKey)}`, {
        isAvailable: newStatus,
      });
      toast(`${newStatus ? '✅' : '⚠️'} "${item.name}" is now ${newStatus ? 'Available' : 'Sold Out'}`);
    } catch (err) {
      // Rollback on error
      setCatalogItems((prev) =>
        prev.map((it) => (it.itemKey === item.itemKey ? { ...it, isAvailable: !newStatus } : it))
      );
      toast('Failed to update availability: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingKey(null);
    }
  };

  // Helper: Generate professional prefilled WhatsApp messages based on registration status or explicit intent
  const getPerformerWhatsAppMessage = (reg, intent = null, customNote = '') => {
    if (!reg) return '';
    const name = reg.fullName || 'there';
    const regId = reg.registrationId || 'ML-REG';
    const role = reg.participationRole || 'Performer';
    const otherRole = reg.otherRole ? ` (${reg.otherRole})` : '';

    const effectiveType = intent || (
      reg.registrationStatus === 'Rejected'
        ? 'rejected'
        : reg.registrationStatus === 'Confirmed'
        ? 'confirmed'
        : 'pending'
    );

    if (effectiveType === 'rejected' || effectiveType === 'rejection') {
      const noteSection = customNote && customNote.trim() ? `\n\nNote from our team:\n${customNote.trim()}` : '';
      return `Hi ${name}!\nGreetings from THE MORAS CAFE.\n\nThank you for registering for *MORAS LIVE (Season 1)* (Reg ID: #${regId}).\n\nDue to limited stage slots, our curation team could select *only the top 4 performers* for this edition. Unfortunately, your registration was not selected this time.\n\nWe have saved your details for our upcoming open mics and future editions.${noteSection}\n\nIf you would like to attend and watch the show, audience passes are available for *₹149* (includes 1 complimentary cappuccino) at themorascafe.in.\n\nThank you,\nTHE MORAS CAFE, Vijayapura\n📞 +91 99454 46137`;
    }

    if (effectiveType === 'confirmed' || effectiveType === 'confirmation') {
      const slotText = reg.stageSlot ? `Allocated Slot: *${reg.stageSlot}*\n` : '';
      return `Hi ${name}!\nCongratulations from THE MORAS CAFE! 🎤\n\nYour live performance slot for *MORAS LIVE (Season 1)* (Reg ID: #${regId}) as a *${role}${otherRole}* has been officially CONFIRMED!\n\n${slotText}Please arrive at least 30 minutes prior to your slot for soundcheck. Complimentary barista coffee is on the house for you!\n\nFor any audio/stage questions, contact our artist desk at +91 99454 46137.\n\nSee you on stage!\nThe Moras Cafe Team`;
    }

    return `Hi ${name}!\nGreetings from THE MORAS CAFE.\n\nWe have received your registration for *MORAS LIVE* (ID: ${regId}) as a *${role}${otherRole}*.\n\nOur team will be in touch with you regarding performance coordination and stage schedule soon. Stay tuned!\n\nBest,\nThe Moras Cafe Team`;
  };

  // ================= MORAS LIVE EVENT REGISTRATIONS STATE & ACTIONS =================
  const [morasLiveRegistrations, setMorasLiveRegistrations] = useState([]);
  const [morasLiveStats, setMorasLiveStats] = useState({
    total: 0,
    performers: 0,
    audience: 0,
    pending: 0,
    confirmed: 0,
  });
  const [morasLiveLoading, setMorasLiveLoading] = useState(false);
  const [morasLiveRoleFilter, setMorasLiveRoleFilter] = useState('');
  const [morasLiveStatusFilter, setMorasLiveStatusFilter] = useState('');
  const [morasLiveSearch, setMorasLiveSearch] = useState('');
  const [selectedLiveParticipant, setSelectedLiveParticipant] = useState(null);
  const [updatingLiveId, setUpdatingLiveId] = useState(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [sendingLiveEmailId, setSendingLiveEmailId] = useState(null);
  const [sendingLiveRejectionId, setSendingLiveRejectionId] = useState(null);
  const [customSlotDraft, setCustomSlotDraft] = useState('');
  const [customEmailMessageDraft, setCustomEmailMessageDraft] = useState('');
  const [customRejectionMessageDraft, setCustomRejectionMessageDraft] = useState('');

  const fetchMorasLiveStats = useCallback(async () => {
    try {
      const res = await api.get('/moras-live/stats');
      if (res.data?.success && res.data?.stats) {
        setMorasLiveStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch Moras Live stats:', err.message);
    }
  }, []);

  const fetchMorasLiveRegistrations = useCallback(async () => {
    setMorasLiveLoading(true);
    try {
      const params = {};
      if (morasLiveRoleFilter) params.role = morasLiveRoleFilter;
      if (morasLiveStatusFilter) params.status = morasLiveStatusFilter;
      if (morasLiveSearch.trim()) params.search = morasLiveSearch.trim();

      const res = await api.get('/moras-live/registrations', { params });
      if (res.data?.success && res.data?.registrations) {
        setMorasLiveRegistrations(res.data.registrations);
      }
    } catch (err) {
      toast('Failed to load MORAS LIVE registrations: ' + (err.response?.data?.message || err.message));
    } finally {
      setMorasLiveLoading(false);
    }
  }, [morasLiveRoleFilter, morasLiveStatusFilter, morasLiveSearch, toast]);

  useEffect(() => {
    if (activeTab === 'moras-live' && role === 'admin') {
      fetchMorasLiveRegistrations();
      fetchMorasLiveStats();
    }
  }, [activeTab, role, fetchMorasLiveRegistrations, fetchMorasLiveStats]);

  useEffect(() => {
    if (role === 'admin') {
      fetchMorasLiveStats();
    }
  }, [role, fetchMorasLiveStats]);

  const handleUpdateLiveStatus = async (id, newStatus, adminNotes) => {
    setUpdatingLiveId(id);
    try {
      const res = await api.patch(`/moras-live/registrations/${id}/status`, {
        status: newStatus,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      });
      if (res.data?.success) {
        toast(`Status updated to "${newStatus}"`);
        setMorasLiveRegistrations((prev) =>
          prev.map((r) => (r._id === id || r.registrationId === id ? res.data.registration : r))
        );
        if (
          selectedLiveParticipant &&
          (selectedLiveParticipant._id === id || selectedLiveParticipant.registrationId === id)
        ) {
          setSelectedLiveParticipant(res.data.registration);
        }
        fetchMorasLiveStats();
      }
    } catch (err) {
      toast('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingLiveId(null);
    }
  };

  const handleSendLiveConfirmationEmail = async (id, customSlot, customMessage) => {
    setSendingLiveEmailId(id);
    try {
      const res = await api.post(`/moras-live/registrations/${id}/send-confirmation-email`, {
        customSlot,
        customMessage,
      });
      if (res.data?.success) {
        toast(`Official confirmation email sent to ${res.data.registration.email}!`);
        setMorasLiveRegistrations((prev) =>
          prev.map((r) => (r._id === id || r.registrationId === id ? res.data.registration : r))
        );
        if (
          selectedLiveParticipant &&
          (selectedLiveParticipant._id === id || selectedLiveParticipant.registrationId === id)
        ) {
          setSelectedLiveParticipant(res.data.registration);
        }
        fetchMorasLiveStats();
      }
    } catch (err) {
      toast('Failed to send confirmation email: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingLiveEmailId(null);
    }
  };

  const handleSendLiveRejectionEmail = async (id, customMessage) => {
    const reg =
      morasLiveRegistrations.find((r) => r._id === id || r.registrationId === id) ||
      selectedLiveParticipant;
    const recipientName = reg?.fullName || 'this participant';
    const recipientEmail = reg?.email || '';

    if (
      !window.confirm(
        `Are you sure you want to send the professional non-selection notification to ${recipientName} (${recipientEmail})? This email explains the top 4 act limit with utmost courtesy and keeps them on file for future showcases.`
      )
    ) {
      return;
    }

    setSendingLiveRejectionId(id);
    try {
      const res = await api.post(`/moras-live/registrations/${id}/send-rejection-email`, {
        customMessage,
      });
      if (res.data?.success) {
        toast(`Official non-selection notification sent to ${res.data.registration.email}!`);
        setMorasLiveRegistrations((prev) =>
          prev.map((r) => (r._id === id || r.registrationId === id ? res.data.registration : r))
        );
        if (
          selectedLiveParticipant &&
          (selectedLiveParticipant._id === id || selectedLiveParticipant.registrationId === id)
        ) {
          setSelectedLiveParticipant(res.data.registration);
        }
        fetchMorasLiveStats();
      }
    } catch (err) {
      toast('Failed to send rejection notification: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingLiveRejectionId(null);
    }
  };

  const handleDeleteLiveRegistration = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete registration for ${name}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/moras-live/registrations/${id}`);
      if (res.data?.success) {
        toast(`Registration deleted for ${name}`);
        setMorasLiveRegistrations((prev) => prev.filter((r) => r._id !== id && r.registrationId !== id));
        if (
          selectedLiveParticipant &&
          (selectedLiveParticipant._id === id || selectedLiveParticipant.registrationId === id)
        ) {
          setSelectedLiveParticipant(null);
        }
        fetchMorasLiveStats();
      }
    } catch (err) {
      toast('Failed to delete registration: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportLiveCSV = async () => {
    try {
      const res = await api.get('/moras-live/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moras_live_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('Exported registrations to CSV successfully!');
    } catch (err) {
      toast('Failed to export CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  // ================= MORAS LIVE AUDIENCE PASSES STATE & ACTIONS =================
  const [morasPasses, setMorasPasses] = useState([]);
  const [morasPassStats, setMorasPassStats] = useState({
    totalCapacity: 60,
    activeReservations: 0,
    pendingPayments: 0,
    confirmedPaidPasses: 0,
    availablePasses: 60,
    totalAmountCollected: 0,
    upiCollections: 0,
    cashCollections: 0,
    cappuccinosRedeemed: 0,
    eventCheckIns: 0,
  });
  const [morasEventSettings, setMorasEventSettings] = useState(null);
  const [morasPassLoading, setMorasPassLoading] = useState(false);
  const [morasPassSearch, setMorasPassSearch] = useState('');
  const [morasPassStatusFilter, setMorasPassStatusFilter] = useState('');
  const [morasPassPaymentFilter, setMorasPassPaymentFilter] = useState('');

  // Scanner & Action Desk State
  const [scannerInput, setScannerInput] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [scannerPermissions, setScannerPermissions] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState('UPI');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProcessingCappuccino, setIsProcessingCappuccino] = useState(false);
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);

  // Delete Test Records State
  const [isDeleteTestsModalOpen, setIsDeleteTestsModalOpen] = useState(false);
  const [selectedTestPassIds, setSelectedTestPassIds] = useState([]);
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeletingTests, setIsDeletingTests] = useState(false);

  const fetchMorasPassStats = useCallback(async () => {
    try {
      const res = await api.get('/moras-live/passes/admin/stats');
      if (res.data?.success && res.data?.stats) {
        const s = res.data.stats;
        setMorasPassStats({
          ...s,
          upiCollections: typeof s.upiCollections === 'object' ? (s.upiCollections?.total || 0) : (Number(s.upiCollections) || 0),
          cashCollections: typeof s.cashCollections === 'object' ? (s.cashCollections?.total || 0) : (Number(s.cashCollections) || 0),
        });
      }
    } catch (err) {
      console.warn('Failed to fetch pass stats:', err.message);
    }
  }, []);

  const fetchMorasPasses = useCallback(async () => {
    setMorasPassLoading(true);
    try {
      const params = {};
      if (morasPassStatusFilter) params.status = morasPassStatusFilter;
      if (morasPassPaymentFilter) params.paymentStatus = morasPassPaymentFilter;
      if (morasPassSearch.trim()) params.search = morasPassSearch.trim();

      const res = await api.get('/moras-live/passes/admin/list', { params });
      if (res.data?.success && res.data?.passes) {
        setMorasPasses(res.data.passes);
      }
    } catch (err) {
      toast('Failed to load audience passes: ' + (err.response?.data?.message || err.message));
    } finally {
      setMorasPassLoading(false);
    }
  }, [morasPassStatusFilter, morasPassPaymentFilter, morasPassSearch, toast]);

  useEffect(() => {
    if (activeTab === 'moras-live-passes') {
      fetchMorasPassStats();
      fetchMorasPasses();
    }
  }, [activeTab, fetchMorasPassStats, fetchMorasPasses]);

  const handleVerifyPass = async (queryOverride) => {
    const raw = (queryOverride || scannerInput).trim();
    if (!raw) {
      toast('Please enter a Pass ID (e.g. ML-0001), 10-digit mobile number, or QR token');
      return;
    }

    setScannerLoading(true);
    try {
      let body = {};
      if (raw.toUpperCase().startsWith('ML-')) {
        body.passId = raw.toUpperCase();
      } else if (raw.length === 64) {
        body.token = raw;
      } else if (raw.includes('token=')) {
        try {
          const parsedUrl = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          const tok = parsedUrl.searchParams.get('token');
          const pid = parsedUrl.searchParams.get('passId');
          if (tok) body.token = tok;
          else if (pid) body.passId = pid;
        } catch (e) {
          body.token = raw;
        }
      } else if (/^[6-9]\d{9}$/.test(raw.replace(/\D/g, ''))) {
        body.mobileNumber = raw.replace(/\D/g, '');
      } else {
        body.passId = raw;
      }

      const res = await api.post('/moras-live/passes/verify-qr', body);
      if (res.data?.success && res.data?.pass) {
        setScannedPass(res.data.pass);
        setScannerPermissions(res.data.permissions || null);
        toast(`Pass ${res.data.pass.passId} verified successfully!`);
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid pass or pass not found in system.');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleCollectPayment = async (targetPassId) => {
    if (!targetPassId) return;
    if (paymentMethodChoice === 'UPI' && (!upiUtrInput || upiUtrInput.trim().length < 6)) {
      toast('Please enter a valid UPI Transaction Reference / UTR (at least 6 digits)');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await api.post('/moras-live/passes/collect-payment', {
        passId: targetPassId,
        paymentMethod: paymentMethodChoice,
        upiTransactionReference: paymentMethodChoice === 'UPI' ? upiUtrInput.trim() : '',
        notes: paymentNotesInput.trim(),
      });

      if (res.data?.success) {
        toast(`✅ Payment collected! Pass ${targetPassId} is now PAID and active.`);
        setScannedPass(res.data.pass);
        setUpiUtrInput('');
        setPaymentNotesInput('');
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      toast('Payment collection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRedeemCappuccino = async (targetPassId) => {
    if (!targetPassId) return;
    setIsProcessingCappuccino(true);
    try {
      const res = await api.post('/moras-live/passes/redeem-cappuccino', {
        passId: targetPassId,
      });

      if (res.data?.success) {
        toast(`☕ ${res.data.message || '1 Cappuccino redeemed successfully!'}`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass((prev) => ({
            ...prev,
            cappuccinoRedeemed: true,
            cappuccinoRedeemedAt: res.data.redeemedAt || new Date().toISOString(),
          }));
        }
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to redeem cappuccino');
    } finally {
      setIsProcessingCappuccino(false);
    }
  };

  const handleCheckInEntry = async (targetPassId) => {
    if (!targetPassId) return;
    setIsProcessingEntry(true);
    try {
      const res = await api.post('/moras-live/passes/check-in-entry', {
        passId: targetPassId,
      });

      if (res.data?.success) {
        toast(`🚪 ${res.data.message || 'Entry check-in approved!'}`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass((prev) => ({
            ...prev,
            entryCheckedIn: true,
            entryCheckedInAt: res.data.checkedInAt || new Date().toISOString(),
            checkedInBy: res.data.checkedInBy || '',
          }));
        }
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyCheckedIn) {
        toast(`🚫 ALREADY CHECKED IN: Attendee was already admitted at ${data.checkedInAt ? new Date(data.checkedInAt).toLocaleTimeString() : 'earlier'}`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass((prev) => ({
            ...prev,
            entryCheckedIn: true,
            entryCheckedInAt: data.checkedInAt || new Date().toISOString(),
            checkedInBy: data.checkedInBy || '',
          }));
        }
      } else {
        toast(data?.message || 'Door check-in denied');
      }
    } finally {
      setIsProcessingEntry(false);
    }
  };

  const handleEntranceAdmit = async (targetPassId) => {
    if (!targetPassId) return;
    if (scannedPass?.paymentStatus !== 'PAID') {
      if (paymentMethodChoice === 'UPI' && (!upiUtrInput || upiUtrInput.trim().length < 4)) {
        toast('Please enter a valid UPI Transaction Reference / UTR');
        return;
      }
    }

    setIsProcessingEntry(true);
    try {
      const res = await api.post('/moras-live/passes/entrance-admit', {
        passId: targetPassId,
        paymentMethod: paymentMethodChoice,
        upiTransactionReference: paymentMethodChoice === 'UPI' ? upiUtrInput.trim() : '',
      });

      if (res.data?.success) {
        toast(`✅ ADMITTED: Entry approved for ${res.data.customerName || targetPassId}!`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass((prev) => ({
            ...prev,
            paymentStatus: 'PAID',
            paidAmount: res.data.paidAmount || 149,
            entryCheckedIn: true,
            entryCheckedInAt: res.data.checkedInAt || new Date().toISOString(),
            checkedInBy: res.data.checkedInBy || '',
          }));
        }
        setUpiUtrInput('');
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyCheckedIn) {
        toast(`🚫 ALREADY CHECKED IN: Attendee was already admitted at ${data.checkedInAt ? new Date(data.checkedInAt).toLocaleTimeString() : 'earlier'}`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass((prev) => ({
            ...prev,
            entryCheckedIn: true,
            entryCheckedInAt: data.checkedInAt || new Date().toISOString(),
            checkedInBy: data.checkedInBy || '',
          }));
        }
      } else {
        toast(data?.message || 'Entrance admission failed');
      }
    } finally {
      setIsProcessingEntry(false);
    }
  };

  const handleReactivatePass = async (targetPassId) => {
    if (!targetPassId) return;
    if (!window.confirm(`Reactivate reservation for pass ${targetPassId}? Original QR will remain active.`)) return;
    try {
      const res = await api.post('/moras-live/passes/admin/reactivate', { passId: targetPassId });
      if (res.data?.success) {
        toast(res.data.message || `Pass ${targetPassId} reactivated`);
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      toast('Failed to reactivate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRevokePass = async (targetPassId, customerName) => {
    if (!targetPassId) return;
    if (!window.confirm(`Are you sure you want to cancel and revoke pass ${targetPassId} (${customerName})?`)) return;
    try {
      const res = await api.delete(`/moras-live/passes/admin/${targetPassId}`);
      if (res.data?.success) {
        toast(`Pass ${targetPassId} has been revoked`);
        if (scannedPass && scannedPass.passId === targetPassId) {
          setScannedPass(null);
        }
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      toast('Failed to revoke pass: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportPassesCsv = async () => {
    try {
      const res = await api.get('/moras-live/passes/admin/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moras_live_audience_passes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('Exported audience passes to CSV successfully!');
    } catch (err) {
      toast('Failed to export CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenDeleteTestsModal = () => {
    // Pre-select passes marked as isTest or allow manual selection
    const initialSelected = (morasPasses || []).filter((p) => p.isTest).map((p) => p.passId);
    setSelectedTestPassIds(initialSelected);
    setDeleteStep(1);
    setIsDeleteTestsModalOpen(true);
  };

  const handleToggleSelectTestPass = (passId) => {
    setSelectedTestPassIds((prev) =>
      prev.includes(passId) ? prev.filter((id) => id !== passId) : [...prev, passId]
    );
  };

  const handleToggleClassifyTest = async (passId, currentIsTest) => {
    try {
      const res = await api.patch('/moras-live/passes/admin/classify-test', {
        passId,
        isTest: !currentIsTest,
      });
      if (res.data?.success) {
        toast(`Pass ${passId} marked as ${!currentIsTest ? 'TEST' : 'GENUINE'}`);
        setMorasPasses((prev) =>
          prev.map((p) => (p.passId === passId ? { ...p, isTest: !currentIsTest } : p))
        );
      }
    } catch (err) {
      toast('Failed to update pass classification: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExecuteDeleteTests = async () => {
    if (selectedTestPassIds.length === 0) {
      toast('Please select at least one test record to delete.');
      return;
    }
    setIsDeletingTests(true);
    try {
      const res = await api.post('/moras-live/passes/admin/delete-tests', {
        passIds: selectedTestPassIds,
      });
      if (res.data?.success) {
        toast(`🗑️ DELETED: ${res.data.deletedCount} test record(s) removed.`);
        setIsDeleteTestsModalOpen(false);
        setSelectedTestPassIds([]);
        setDeleteStep(1);
        if (scannedPass && selectedTestPassIds.includes(scannedPass.passId)) {
          setScannedPass(null);
        }
        fetchMorasPassStats();
        fetchMorasPasses();
      }
    } catch (err) {
      toast('Failed to delete test records: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeletingTests(false);
    }
  };

  useEffect(() => {
    const currentPendingCount = orders.filter((o) => o.status === 'pending').length;
    if (currentPendingCount > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
      playNewOrderChime();
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [orders]);

  // ================= AUTH + LOAD DATA =================
  useEffect(() => {
    if (!token) {
      setAuthChecked(true);
      return;
    }

    const loadData = async () => {
      const userRole = getRoleFromToken(token);
      if (userRole === 'kitchen') {
        await fetchOrders();
      } else {
        await Promise.all([fetchOrders(), fetchReservations()]);
      }
      setAuthChecked(true);
    };

    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // ================= LOGIN =================
  const handleLogin = async (e) => {

    e.preventDefault();

    setError('');

    try {

      const res = await api.post('/auth/login', {
        user,
        pass,
      });

      const receivedToken = res.data.token;

      if (!receivedToken) {
        throw new Error('Token not received');
      }

      // Save token
      saveAdminToken(receivedToken);

      // Update state
      setToken(receivedToken);

      toast('Logged in successfully ✅');

    } catch (err) {
      if (err.response?.status === 429) {
        setError(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Too many login attempts, please try again later.'
        );
      } else {
        setError(
          (typeof err.response?.data === 'string' && err.response.data.length < 150 ? err.response.data : null) ||
          err.response?.data?.message ||
          'Invalid credentials'
        );
      }
    }
  };

  // ================= LOGOUT =================
  const logout = () => {

    clearAdminToken();

    setToken(null);

    setOrders([]);

    setPass('');

    toast('Logged out');
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, status) => {

    try {

      await api.patch(`/orders/${id}`, {
        status,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id
            ? { ...o, status }
            : o
        )
      );

      toast(`Status updated to: ${status}`);

    } catch (err) {
      toast(
        err.response?.data?.message ||
        'Update failed'
      );
    }
  };

  // ================= UPDATE RESERVATION STATUS =================
  const updateReservationStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}`, {
        status,
      });
      setReservations((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status }
            : r
        )
      );
      toast(`Reservation status updated to: ${status}`);
    } catch (err) {
      toast(
        err.response?.data?.message ||
        'Update failed'
      );
    }
  };

  // ================= RE-SEND RESERVATION EMAIL =================
  const resendReservationEmail = async (id, email) => {
    try {
      toast(`Sending confirmation email to ${email}...`);
      const res = await api.post(`/reservations/${id}/resend-email`);
      toast(res.data?.message || 'Confirmation email sent!');
      setReservations((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, confirmationEmailSent: true } : r
        )
      );
    } catch (err) {
      toast(err.response?.data?.message || 'Could not send email');
    }
  };

  // ================= DELETE SINGLE ORDER =================
  const handleDeleteSingleOrder = async (id, customerName) => {
    if (!window.confirm(`Delete order #${id.slice(-6).toUpperCase()} for ${customerName || 'customer'}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
      toast('Order deleted successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete order');
    }
  };

  // ================= CLEAR ALL TEST ORDERS =================
  const handleClearAllOrders = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ALL ${orders.length} orders? All test records will be removed.`)) {
      return;
    }
    try {
      const res = await api.delete('/orders/clean-all-tests');
      setOrders([]);
      toast(res.data?.message || 'All test orders deleted successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete test orders');
    }
  };

  // ================= DELETE SINGLE RESERVATION =================
  const handleDeleteSingleReservation = async (id, guestName) => {
    if (!window.confirm(`Delete birthday booking #${id.slice(-6).toUpperCase()} for ${guestName || 'guest'}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r._id !== id));
      toast('Birthday booking deleted successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete reservation');
    }
  };

  // ================= CLEAR ALL TEST RESERVATIONS =================
  const handleClearAllReservations = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ALL ${reservations.length} birthday celebration bookings? All test records will be removed.`)) {
      return;
    }
    try {
      const res = await api.delete('/reservations/clean-all-tests');
      setReservations([]);
      toast(res.data?.message || 'All test reservations deleted successfully');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not delete test reservations');
    }
  };

  // ================= STATS =================
  const stats = useMemo(() => ({
    totalRevenue: orders.reduce(
      (s, o) => s + o.total,
      0
    ),

    pending: orders.filter(
      (o) => o.status === 'pending'
    ).length,

    preparing: orders.filter(
      (o) => o.status === 'preparing'
    ).length,

    completed: orders.filter(
      (o) => o.status === 'completed'
    ).length,

    count: orders.length,

  }), [orders]);

  // ================= LOADING =================
  if (!authChecked) {

    return (
      <section className="section admin-panel">
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            fontSize: '1.2rem',
            color: 'var(--text-light)',
          }}
        >
          Loading dashboard...
        </div>
      </section>
    );
  }

  // ================= KITCHEN DISPLAY SYSTEM (KDS) =================
  const renderKDSOrderCard = (order, actionType) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
    const getElapsedColor = () => {
      if (order.status === 'completed') return 'var(--text-light)';
      if (elapsedMinutes >= 15) return 'var(--red)';
      if (elapsedMinutes >= 8) return '#d97706';
      return 'var(--green)';
    };

    return (
      <div key={order._id} style={{ border: '2px solid var(--cream-dark)', borderRadius: 12, padding: 16, background: 'var(--cream-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green)' }}>📍 {order.address}</span>
          <span style={{ fontSize: '0.78rem', color: getElapsedColor(), fontWeight: 800 }}>
            {order.status === 'completed' ? 'Ready' : `⏳ ${elapsedMinutes}m ago`}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{item.qty}x</strong> {item.name}
                {item.variant && <small style={{ display: 'block', color: 'var(--text-light)', marginLeft: 22 }}>({item.variant})</small>}
              </span>
            </div>
          ))}
        </div>

        {order.payment === 'counter' && (
          <div style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.15)', color: '#b45309', padding: '4px 8px', borderRadius: 4, fontWeight: 700, alignSelf: 'flex-start' }}>
            💵 Pay at Counter
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
            Order: #{order._id.slice(-5).toUpperCase()} ({order.name})
          </span>
          {actionType === 'start' && (
            <button className="btn-primary" type="button" onClick={() => updateStatus(order._id, 'preparing')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--green)', border: 'none', color: '#fff', fontWeight: 800 }}>
              🍳 Start Cooking
            </button>
          )}
          {actionType === 'ready' && (
            <button className="btn-primary" type="button" onClick={() => updateStatus(order._id, 'completed')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--red)', border: 'none', color: '#fff', fontWeight: 800 }}>
              🔔 Mark as Ready
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderKitchenKDS = () => {
    const pendingOrders = orders.filter(o => o.status === 'pending').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const preparingOrders = orders.filter(o => o.status === 'preparing').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const completedOrders = orders.filter(o => o.status === 'completed').slice(0, 10);

    return (
      <div className="kds-dashboard" style={{ padding: '0 4%', color: 'var(--text)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, borderBottom: '2px solid var(--cream-dark)', paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: 0 }}>🍳 Kitchen Live Screen</h1>
            <p style={{ color: 'var(--text-light)', margin: '4px 0 0', fontSize: '0.9rem' }}>Real-time Kitchen Display System (KDS)</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-outline" type="button" onClick={fetchOrders} disabled={loading} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🔄 {loading ? 'Syncing...' : 'Sync Orders'}
            </button>
            <button className="btn-primary" type="button" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--red)', color: '#fff' }}>
              🚪 Logout
            </button>
          </div>
        </header>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="kds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* COLUMN 1: PENDING ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#b45309', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📥 New Orders</span>
              <span className="badge" style={{ background: '#b45309', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{pendingOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No pending orders</div>
              ) : (
                pendingOrders.map(order => renderKDSOrderCard(order, 'start'))
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#c2410c', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔥 In Prep</span>
              <span className="badge" style={{ background: '#c2410c', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{preparingOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {preparingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No orders in preparation</div>
              ) : (
                preparingOrders.map(order => renderKDSOrderCard(order, 'ready'))
              )}
            </div>
          </div>

          {/* COLUMN 3: COMPLETED ORDERS */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#15803d', padding: '10px 16px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✅ Recently Ready</span>
              <span className="badge" style={{ background: '#15803d', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'grid', placeItems: 'center', fontSize: '0.75rem' }}>{completedOrders.length}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
              {completedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 10px', fontStyle: 'italic', fontSize: '0.9rem' }}>No recently ready orders</div>
              ) : (
                completedOrders.map(order => renderKDSOrderCard(order, 'done'))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ================= LOGIN UI =================
  if (!token) {

    return (
      <section className="section admin-panel">

        <div className="admin-login">

          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: 8,
              }}
            >
              🔐
            </div>

            <h1 className="admin-login-title" style={{ fontSize: '1.8rem', margin: '0 0 8px', color: 'var(--green)' }}>
              Staff Login
            </h1>

            <p
              style={{
                color: 'var(--text-light)',
                fontSize: '0.9rem',
              }}
            >
              The Moras Cafe Staff Portal
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >

            <div className="form-group">

              <label htmlFor="admin-user">
                Staff Email
              </label>

              <input
                id="admin-user"
                type="email"
                value={user}
                onChange={(e) =>
                  setUser(e.target.value)
                }
                placeholder="staff@example.com"
                required
                autoComplete="email"
              />

            </div>

            <div className="form-group">

              <label htmlFor="admin-pass">
                Password
              </label>

              <input
                id="admin-pass"
                type="password"
                value={pass}
                onChange={(e) =>
                  setPass(e.target.value)
                }
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />

            </div>

            {error && (

              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                }}
              >
                ⚠️ {error}
              </div>

            )}

            <button
              className="btn-primary"
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: 8,
              }}
            >
              Login to Dashboard
            </button>

          </form>

        </div>

      </section>
    );
  }

  if (role === 'kitchen') {
    return (
      <section className="section admin-panel" style={{ padding: '100px 0 40px' }}>
        {renderKitchenKDS()}
      </section>
    );
  }

  // ================= DASHBOARD =================
  return (
    <section className="section admin-panel">

      <div className="admin-dashboard">

        <div className="admin-header">

          <h1>📊 Orders Dashboard</h1>

          <button
            className="btn-outline"
            onClick={logout}
            style={{
              color: 'var(--red)',
              borderColor: 'var(--red)',
              padding: '8px 20px',
            }}
          >
            Sign Out
          </button>

        </div>

        <nav className="admin-tabs-nav" aria-label="Admin Navigation Tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>📋 Orders</span>
            {stats.count > 0 && (
              <span className={`admin-tab-badge ${activeTab === 'orders' ? 'badge-active' : 'badge-inactive'}`}>
                {stats.count}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <span>🎂 Birthdays</span>
            {reservations.length > 0 && (
              <span className={`admin-tab-badge ${activeTab === 'reservations' ? 'badge-active' : 'badge-inactive'}`}>
                {reservations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'qrs' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrs')}
          >
            <span>📱 Table QRs</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span>📦 Menu Stock</span>
            {catalogItems.some((i) => !i.isAvailable) && (
              <span className="admin-tab-badge badge-alert">
                {catalogItems.filter((i) => !i.isAvailable).length} OFF
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'moras-live' ? 'active' : ''}`}
            onClick={() => setActiveTab('moras-live')}
          >
            <span>🎤 MORAS LIVE</span>
            {morasLiveStats.total > 0 && (
              <span className={`admin-tab-badge ${activeTab === 'moras-live' ? 'badge-active' : 'badge-inactive'}`}>
                {morasLiveStats.total}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'moras-live-passes' ? 'active' : ''}`}
            onClick={() => setActiveTab('moras-live-passes')}
          >
            <span>🎟️ Passes &amp; QR</span>
            <span className={`admin-tab-badge ${activeTab === 'moras-live-passes' ? 'badge-active' : 'badge-inactive'}`}>
              {(morasPassStats?.confirmedPaidPasses || 0)}/60
            </span>
          </button>
        </nav>

        {activeTab === 'orders' && (
          <>
            <div className="admin-stats">

          <div className="admin-stat">
            <div className="admin-stat-num">
              {stats.count}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Total Orders
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#fbbf24',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#92400e',
              }}
            >
              ₹{stats.totalRevenue}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Total Revenue
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#f97316',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#9a3412',
              }}
            >
              {stats.pending}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Pending
            </div>
          </div>

          <div
            className="admin-stat"
            style={{
              borderTopColor: '#22c55e',
            }}
          >
            <div
              className="admin-stat-num"
              style={{
                color: '#166534',
              }}
            >
              {stats.completed}
            </div>

            <div
              style={{
                color: 'var(--text-light)',
                fontSize: '0.85rem',
                marginTop: 4,
              }}
            >
              Completed
            </div>
          </div>

        </div>

        {error && (

          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>

        )}

        <div className="admin-table-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 800, fontSize: '1.08rem', color: 'var(--green)' }}>
              All Café Orders ({orders.length})
            </div>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllOrders}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Delete all previous test orders from database"
              >
                <span>🗑️</span>
                <span>Clear All Test Orders</span>
              </button>
            )}
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >

            <thead>

              <tr
                style={{
                  background: 'var(--green)',
                  color: 'var(--cream)',
                }}
              >

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  ID
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Name
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Phone
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Table
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Items
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                  Total
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Time
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                  Status
                </th>

                <th style={{ padding: '12px 14px', textAlign: 'center' }}>
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-light)',
                    }}
                  >
                    Loading orders…
                  </td>
                </tr>

              ) : orders.length === 0 ? (

                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: 32,
                      textAlign: 'center',
                      color: 'var(--text-light)',
                    }}
                  >
                    No orders yet
                  </td>
                </tr>

              ) : (

                orders.map((o, idx) => (

                  <tr
                    key={o._id}
                    style={{
                      background:
                        idx % 2 === 0
                          ? '#fff'
                          : 'var(--cream-light)',

                      borderBottom:
                        '1px solid var(--cream-dark)',
                    }}
                  >

                    <td
                      style={{
                        padding: '12px 14px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      #{o._id.slice(-6).toUpperCase()}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                      }}
                    >
                      {o.name}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {o.phone}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                        color: 'var(--green)',
                      }}
                    >
                      {o.address || 'N/A'}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        maxWidth: 200,
                        color: 'var(--text-light)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {o.items
                        .map(
                          (i) =>
                            `${i.name}${
                              i.variant
                                ? ` (${i.variant})`
                                : ''
                            } ×${i.qty}`
                        )
                        .join(', ')}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontWeight: 700,
                        textAlign: 'right',
                        color: 'var(--green)',
                      }}
                    >
                      ₹{o.total}
                    </td>

                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.8rem',
                        color: 'var(--text-light)',
                      }}
                    >
                      {new Date(
                        o.createdAt
                      ).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td style={{ padding: '12px 14px' }}>

                      <select
                        className="status-select"
                        value={o.status}
                        onChange={(e) =>
                          updateStatus(
                            o._id,
                            e.target.value
                          )
                        }
                        style={{
                          background:
                            o.status === 'pending'
                              ? '#fef3c7'
                              : o.status === 'preparing'
                              ? '#dbeafe'
                              : '#d1fae5',

                          color:
                            o.status === 'pending'
                              ? '#92400e'
                              : o.status === 'preparing'
                              ? '#1e40af'
                              : '#065f46',

                          fontWeight: 700,
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >

                        <option value="pending">
                          ⏳ Pending
                        </option>

                        <option value="preparing">
                          👨‍🍳 Preparing
                        </option>

                        <option value="completed">
                          ✅ Completed
                        </option>

                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBillOrder(o);
                          setBillEmailInput(o.email || '');
                        }}
                        style={{
                          background: '#0F3D3E',
                          color: '#FAF5EF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 6
                        }}
                        title="View, Print, or Email Bill Receipt"
                      >
                        <span>🧾</span>
                        <span>Bill Slip</span>
                      </button>

                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleOrder(o._id, o.name)}
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Permanently delete this order"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
          </>
        )}

        {activeTab === 'qrs' && (
          <div className="qr-generator-section" style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' }}>
            {/* GOOGLE REVIEW STANDEE PROMINENT CARD */}
            <div style={{
              background: '#0f3d3e',
              color: '#FAF5EF',
              borderRadius: 16,
              padding: '24px 20px',
              marginBottom: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 8px 24px rgba(15, 61, 62, 0.2)'
            }}>
              <div>
                <span style={{ color: '#c3912d', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.75rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>
                  ★ Customer Reputation &amp; Feedback
                </span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', margin: '0 0 8px', color: '#FAF5EF' }}>
                  Google 5-Star Review Standee &amp; QR
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#d2dfdf', maxWidth: 520, lineHeight: 1.5 }}>
                  Printable acrylic tent card &amp; counter QR standee. Scanning opens Google Maps with the 5-star review modal ready to tap and submit.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => window.open('/admin/print-review-qr', '_blank')}
                  className="btn-primary"
                  style={{ background: '#c3912d', color: '#1a1a1a', border: 'none', fontWeight: 800, padding: '10px 18px' }}
                >
                  🖨️ Print Standee Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/rate`);
                    toast('Review link copied! Share this or encode in your own designs.');
                  }}
                  className="btn-outline"
                  style={{ color: '#FAF5EF', borderColor: '#4a7575', padding: '10px 16px' }}
                >
                  📋 Copy /rate Link
                </button>
                <a
                  href="/the-moras-cafe-review-standee.png"
                  download
                  className="btn-outline"
                  style={{ color: '#FAF5EF', borderColor: '#4a7575', padding: '10px 16px', textDecoration: 'none' }}
                >
                  📥 Download PNG Card
                </a>
              </div>
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)', marginBottom: 12 }}>Table Ordering QR Codes</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 24 }}>
              Below are the digital ordering QR codes configured for your café tables. 
              You can print these cards or copy the links to generate your own custom layout. 
              Customers scanning these codes will be logged into the respective table session.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {Array.from({ length: Number(import.meta.env.VITE_TOTAL_TABLES) || 12 }, (_, i) => {
                const tableNum = i + 1;
                const tableUrl = `${window.location.origin}/order/table-${tableNum}`;
                const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(tableUrl)}&size=250`;
                
                return (
                  <div key={tableNum} className="qr-card" style={{ border: '2px solid var(--cream-dark)', borderRadius: 12, padding: 20, textAlign: 'center', background: 'var(--cream-light)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green)', marginBottom: 12 }}>Table {tableNum}</div>
                    
                    <div style={{ background: 'var(--white)', padding: 16, borderRadius: 8, display: 'inline-block', border: '1px solid var(--cream-dark)', marginBottom: 12 }}>
                      <img 
                        src={qrImageUrl} 
                        alt={`QR Code for Table ${tableNum}`} 
                        style={{ width: 180, height: 180, display: 'block' }} 
                      />
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', wordBreak: 'break-all', marginBottom: 16, padding: '0 8px' }}>
                      {tableUrl}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        className="btn-outline" 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(tableUrl);
                          toast(`Link for Table ${tableNum} copied!`);
                        }}
                        style={{ fontSize: '0.8rem', padding: '8px 12px', flexGrow: 1 }}
                      >
                        📋 Copy Link
                      </button>
                      <button 
                        className="btn-primary" 
                        type="button"
                        onClick={() => {
                          window.open(`/admin/print-qr/${tableNum}`, '_blank');
                        }}
                        style={{ fontSize: '0.8rem', padding: '8px 12px', background: '#fbbf24', color: '#0f3d3e', border: 'none', flexGrow: 1 }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="admin-table-wrap" style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)', margin: '0 0 4px' }}>
                  🎂 Birthday Celebration Bookings ({reservations.length})
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', margin: 0 }}>
                  Customer requests. Contact customers via Phone/WhatsApp to collect ₹59 advance online, then mark Confirmed to dispatch email confirmation.
                </p>
              </div>
              {reservations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllReservations}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Delete all previous test birthday bookings from database"
                >
                  <span>🗑️</span>
                  <span>Clear All Test Bookings</span>
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--green)',
                      color: 'var(--cream)',
                    }}
                  >
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Ref ID</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Host &amp; Birthday Person</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>People</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Slot</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>₹59 Advance / ₹199 Pkg</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Special Requests</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Status &amp; Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)' }}>
                        Loading reservations…
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)' }}>
                        No reservations yet
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r, idx) => (
                      <tr
                        key={r._id}
                        style={{
                          background: idx % 2 === 0 ? '#fff' : 'var(--cream-light)',
                          borderBottom: '1px solid var(--cream-dark)',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>
                          #{r._id.slice(-6).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--green)' }}>{r.name}</div>
                          {r.birthdayPerson && (
                            <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 600 }}>
                              🎂 For: {r.birthdayPerson}
                            </div>
                          )}
                          {r.email && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              ✉️ {r.email}
                            </div>
                          )}
                          <div style={{ fontSize: '0.82rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <a 
                              href={`tel:+91${r.phone.replace(/\D/g, '')}`} 
                              style={{ color: '#166534', fontWeight: 700, textDecoration: 'none' }}
                              title="Call customer directly"
                            >
                              📞 +91 {r.phone}
                            </a>
                            <a
                              href={`https://wa.me/91${r.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(r.name)}%2C%20greetings%20from%20The%20Moras%20Cafe!%20Regarding%20your%20birthday%20booking%20for%20${encodeURIComponent(r.date)}%20at%20${encodeURIComponent(r.time)}...`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: '#25D366',
                                color: '#fff',
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Chat on WhatsApp to collect advance"
                            >
                              <span>💬</span> WhatsApp
                            </a>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                          {r.guests}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{r.date}</div>
                          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem' }}>{r.time}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ 
                              background: r.status === 'confirmed' ? '#dcfce7' : '#fef3c7', 
                              color: r.status === 'confirmed' ? '#15803d' : '#92400e', 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              fontSize: '0.78rem', 
                              fontWeight: 700 
                            }}>
                              {r.status === 'confirmed' ? '✅ ₹59 Adv Received' : '⏳ Awaiting ₹59 Adv'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: 3 }}>
                              Bal: ₹{r.remainingBalance || 140}
                            </span>
                          </div>
                          {r.upiRef ? (
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-light)', marginTop: 4 }}>
                              UTR: {r.upiRef}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                              {r.status === 'confirmed' ? 'Online UPI' : 'Pending contact'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 180, color: 'var(--text-light)', fontSize: '0.82rem' }}>
                          {r.notes || '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <select
                              className="status-select"
                              value={r.status}
                              onChange={(e) => updateReservationStatus(r._id, e.target.value)}
                              style={{
                                background:
                                  r.status === 'pending'
                                    ? '#fef3c7'
                                    : r.status === 'confirmed'
                                    ? '#d1fae5'
                                    : '#fee2e2',
                                color:
                                  r.status === 'pending'
                                    ? '#92400e'
                                    : r.status === 'confirmed'
                                    ? '#065f46'
                                    : '#991b1b',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="confirmed">✅ Confirmed</option>
                              <option value="cancelled">❌ Cancelled</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBirthdayBill(r);
                                setBirthdayFoodTotal('');
                                setBillEmailInput(r.email || '');
                              }}
                              style={{
                                background: '#0F3D3E',
                                color: '#FAF5EF',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Generate Final Bill for Birthday Event"
                            >
                              <span>🧾</span>
                              <span>Final Bill</span>
                            </button>

                            {r.email && (
                              <button
                                type="button"
                                onClick={() => resendReservationEmail(r._id, r.email)}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--cream-dark)',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  color: 'var(--green)',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title="Re-send Confirmation Email to customer"
                              >
                                {r.confirmationEmailSent ? '✓ Sent (Resend)' : '✉️ Send Email'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteSingleReservation(r._id, r.name)}
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Permanently delete this reservation"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="admin-inventory-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--green)' }}>
                  Menu Availability & Sold-Out Manager
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  Toggle items Sold Out when ingredients run out. Customer menus update live automatically.
                </p>
              </div>
              <button
                className="btn-secondary"
                type="button"
                onClick={fetchCatalogAvailability}
                disabled={loadingCatalog}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {loadingCatalog ? 'Refreshing…' : '🔄 Refresh Status'}
              </button>
            </div>

            <div className="admin-stats" style={{ marginBottom: 24 }}>
              <div className="admin-stat">
                <div className="admin-stat-num">{catalogItems.length}</div>
                <div className="admin-stat-label">Total Catalog Items</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-num" style={{ color: '#10b981' }}>
                  {catalogItems.filter((i) => i.isAvailable).length}
                </div>
                <div className="admin-stat-label">Currently Available</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-num" style={{ color: catalogItems.some((i) => !i.isAvailable) ? '#dc2626' : 'var(--text-light)' }}>
                  {catalogItems.filter((i) => !i.isAvailable).length}
                </div>
                <div className="admin-stat-label">Sold Out Items</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, background: 'var(--white)', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--cream-dark)' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="🔍 Search items by name..."
                  value={availabilitySearch}
                  onChange={(e) => setAvailabilitySearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ flex: '0 1 200px', minWidth: 160 }}>
                <select
                  value={availabilityCategory}
                  onChange={(e) => setAvailabilityCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                >
                  <option value="All">All Categories</option>
                  {[...new Set(catalogItems.map((i) => i.category))].sort().map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600, color: 'var(--green)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showSoldOutOnly}
                  onChange={(e) => setShowSoldOutOnly(e.target.checked)}
                />
                Show Sold Out Only
              </label>
            </div>

            <div className="admin-table-wrap" style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--cream-dark)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--cream-light)', borderBottom: '2px solid var(--cream-dark)' }}>
                    <th style={{ padding: '12px 16px' }}>Item Name</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Base Price</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Availability Action</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogItems
                    .filter((item) => {
                      const matchesSearch = item.name.toLowerCase().includes(availabilitySearch.toLowerCase());
                      const matchesCat = availabilityCategory === 'All' || item.category === availabilityCategory;
                      const matchesSoldOut = !showSoldOutOnly || !item.isAvailable;
                      return matchesSearch && matchesCat && matchesSoldOut;
                    })
                    .map((item) => (
                      <tr key={item.itemKey} style={{ borderBottom: '1px solid #f1f5f9', background: item.isAvailable ? 'transparent' : '#fff1f2' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: item.isAvailable ? 'var(--green)' : '#991b1b' }}>
                          {item.name}
                          {item.multi && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 6 }}>(S/M/L)</span>}
                          {item.tempVariant && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 6 }}>(Hot/Cold)</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-light)' }}>{item.category}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹{item.price}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {item.isAvailable ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                              ● Available
                            </span>
                          ) : (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
                              ✕ SOLD OUT
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            disabled={togglingKey === item.itemKey}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: togglingKey === item.itemKey ? 'wait' : 'pointer',
                              border: item.isAvailable ? '1px solid #f87171' : '1px solid #34d399',
                              background: item.isAvailable ? '#fef2f2' : '#ecfdf5',
                              color: item.isAvailable ? '#dc2626' : '#059669',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {togglingKey === item.itemKey
                              ? 'Saving…'
                              : item.isAvailable
                              ? 'Mark Sold Out'
                              : 'Restore to Available'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MORAS LIVE EVENT REGISTRATIONS ================= */}
        {activeTab === 'moras-live' && role === 'admin' && (
          <div className="moras-live-admin-section" style={{ textAlign: 'left' }}>
            {/* Header Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20,
                background: '#123F3D',
                padding: '20px 24px',
                borderRadius: 14,
                color: '#F5E8D0',
                border: '1px solid rgba(197, 168, 128, 0.3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.8rem' }}>🎤</span>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.45rem',
                        fontFamily: "'Playfair Display', serif",
                        letterSpacing: '0.04em',
                        color: '#F5E8D0',
                      }}
                    >
                      MORAS LIVE — Registrations
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#c5a880' }}>
                      Official event registration &amp; curation portal • <em>YOUR MIC. YOUR MOMENT.</em>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href="/moras-live/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 232, 208, 0.12)',
                    color: '#F5E8D0',
                    border: '1px solid rgba(245, 232, 208, 0.3)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>🔗</span> View Form
                </a>
                <button
                  type="button"
                  onClick={() => {
                    fetchMorasLiveRegistrations();
                    fetchMorasLiveStats();
                  }}
                  disabled={morasLiveLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 232, 208, 0.12)',
                    color: '#F5E8D0',
                    border: '1px solid rgba(245, 232, 208, 0.3)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: morasLiveLoading ? 'wait' : 'pointer',
                  }}
                >
                  <span>🔄</span> Refresh
                </button>
                <button
                  type="button"
                  onClick={handleExportLiveCSV}
                  disabled={morasLiveRegistrations.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#c5a880',
                    color: '#123F3D',
                    border: 'none',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: morasLiveRegistrations.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <span>📥</span> Export CSV
                </button>
              </div>
            </div>

            {/* 4 Summary Stat Cards (Performer Focus) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: 'var(--white)',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '1px solid var(--cream-dark)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#123F3D', fontWeight: 700, letterSpacing: '0.05em' }}>
                  🎤 Total Performers
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>
                  {morasLiveStats.performers || morasLiveStats.total || 0}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--white)',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '1px solid var(--cream-dark)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#b45309', fontWeight: 700, letterSpacing: '0.05em' }}>
                  ⏳ Pending Reviews
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                  {morasLiveStats.pending || 0}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--white)',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '1px solid var(--cream-dark)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#7e22ce', fontWeight: 700, letterSpacing: '0.05em' }}>
                  📝 Under Review
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7e22ce', marginTop: 4 }}>
                  {morasLiveStats.reviewed || 0}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--white)',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '1px solid var(--cream-dark)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>
                  ✅ Confirmed Acts
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', marginTop: 4 }}>
                  {morasLiveStats.confirmed || 0}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                marginBottom: 18,
                background: 'var(--white)',
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid var(--cream-dark)',
              }}
            >
              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="🔍 Search by name, mobile, or ID..."
                  value={morasLiveSearch}
                  onChange={(e) => setMorasLiveSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ flex: '0 1 180px', minWidth: 150 }}>
                <select
                  value={morasLiveRoleFilter}
                  onChange={(e) => setMorasLiveRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="Singer">Singer</option>
                  <option value="Rapper">Rapper</option>
                  <option value="Poet / Spoken Word Artist">Poet / Spoken Word</option>
                  <option value="Comedian">Comedian</option>
                  <option value="Dancer">Dancer</option>
                  <option value="Beatboxer">Beatboxer</option>
                  <option value="Musician / Instrumentalist">Musician / Instrumentalist</option>
                  <option value="Freestyle Artist">Freestyle Artist</option>
                  <option value="Content Creator">Content Creator</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ flex: '0 1 160px', minWidth: 140 }}>
                <select
                  value={morasLiveStatusFilter}
                  onChange={(e) => setMorasLiveStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {(morasLiveSearch || morasLiveRoleFilter || morasLiveStatusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setMorasLiveSearch('');
                    setMorasLiveRoleFilter('');
                    setMorasLiveStatusFilter('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>

            {/* Registrations Table */}
            <div
              className="admin-table-wrap"
              style={{
                background: 'var(--white)',
                borderRadius: 12,
                border: '1px solid var(--cream-dark)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {morasLiveLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                  Loading registrations…
                </div>
              ) : morasLiveRegistrations.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎤</div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: 'var(--green)' }}>
                    No registrations found
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    {morasLiveSearch || morasLiveRoleFilter || morasLiveStatusFilter
                      ? 'No registrations match your current filters. Try resetting the filters.'
                      : 'New registrations submitted via /moras-live/register will appear here.'}
                  </p>
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    minWidth: 840,
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                  }}
                >
                  <thead>
                    <tr style={{ background: 'var(--cream-light)', borderBottom: '2px solid var(--cream-dark)' }}>
                      <th style={{ padding: '12px 14px', width: 110 }}>Reg ID</th>
                      <th style={{ padding: '12px 14px' }}>Participant</th>
                      <th style={{ padding: '12px 14px' }}>Role</th>
                      <th style={{ padding: '12px 14px' }}>Contact</th>
                      <th style={{ padding: '12px 14px' }}>Pitch / Details</th>
                      <th style={{ padding: '12px 14px', width: 135 }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', width: 130 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {morasLiveRegistrations.map((reg) => {
                      const isPerformer = reg.participationRole !== 'Audience / Attendee';
                      return (
                        <tr
                          key={reg._id || reg.registrationId}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: reg.registrationStatus === 'New' ? '#fffbeb' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: 'var(--green)',
                                background: '#f0fdf4',
                                padding: '3px 6px',
                                borderRadius: 4,
                                border: '1px solid #bbf7d0',
                                display: 'inline-block',
                              }}
                            >
                              {reg.registrationId}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 4 }}>
                              {new Date(reg.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.92rem' }}>
                              {reg.fullName}
                            </div>
                            {reg.instagramUsername && (
                              <a
                                href={`https://instagram.com/${reg.instagramUsername.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#e11d48',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  marginTop: 3,
                                }}
                              >
                                📸 @{reg.instagramUsername.replace(/^@/, '')}
                              </a>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isPerformer ? '#fdf2f8' : '#eff6ff',
                                color: isPerformer ? '#9d174d' : '#1d4ed8',
                                border: isPerformer ? '1px solid #fbcfe8' : '1px solid #bfdbfe',
                              }}
                            >
                              {reg.participationRole}
                            </span>
                            {reg.otherRole && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                                &quot;{reg.otherRole}&quot;
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <a
                                href={`tel:${reg.mobileNumber}`}
                                style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none', fontSize: '0.84rem' }}
                              >
                                {reg.mobileNumber}
                              </a>
                              <a
                                href={`https://wa.me/91${reg.mobileNumber}?text=${encodeURIComponent(
                                  getPerformerWhatsAppMessage(reg)
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={
                                  reg.registrationStatus === 'Rejected'
                                    ? 'Send professional non-selection note on WhatsApp'
                                    : reg.registrationStatus === 'Confirmed'
                                    ? 'Send confirmation note on WhatsApp'
                                    : 'Message on WhatsApp'
                                }
                                style={{
                                  textDecoration: 'none',
                                  fontSize: '0.9rem',
                                  lineHeight: 1,
                                }}
                              >
                                💬
                              </a>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>
                              <a
                                href={`mailto:${reg.email}`}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                {reg.email}
                              </a>
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top', maxWidth: 220 }}>
                            {reg.performanceDescription ? (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.8rem',
                                  color: '#334155',
                                  lineHeight: 1.35,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={reg.performanceDescription}
                              >
                                {reg.performanceDescription}
                              </p>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                No pitch specified
                              </span>
                            )}
                            {reg.adminNotes && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: '0.72rem',
                                  color: '#0369a1',
                                  background: '#f0f9ff',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  borderLeft: '2px solid #0284c7',
                                }}
                              >
                                📝 {reg.adminNotes}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <select
                              value={reg.registrationStatus}
                              onChange={(e) => handleUpdateLiveStatus(reg._id || reg.registrationId, e.target.value)}
                              disabled={updatingLiveId === (reg._id || reg.registrationId)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: '1px solid #cbd5e1',
                                background:
                                  reg.registrationStatus === 'Confirmed'
                                    ? '#dcfce7'
                                    : reg.registrationStatus === 'Reviewed'
                                    ? '#f3e8ff'
                                    : reg.registrationStatus === 'Rejected'
                                    ? '#fee2e2'
                                    : reg.registrationStatus === 'Cancelled'
                                    ? '#f3f4f6'
                                    : '#fef3c7',
                                color:
                                  reg.registrationStatus === 'Confirmed'
                                    ? '#15803d'
                                    : reg.registrationStatus === 'Reviewed'
                                    ? '#6b21a8'
                                    : reg.registrationStatus === 'Rejected'
                                    ? '#b91c1c'
                                    : reg.registrationStatus === 'Cancelled'
                                    ? '#4b5563'
                                    : '#92400e',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="New">New</option>
                              <option value="Reviewed">Reviewed</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            {reg.registrationStatus === 'Confirmed' && (
                              <div style={{ marginTop: 4 }}>
                                {reg.confirmationEmailSent ? (
                                  <span
                                    title={`Official confirmation email sent on ${new Date(reg.confirmationEmailSentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#047857',
                                      background: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      cursor: 'default',
                                    }}
                                  >
                                    ✉️ Email Sent
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLiveParticipant(reg);
                                      setAdminNoteDraft(reg.adminNotes || '');
                                      setCustomSlotDraft(reg.stageSlot || '');
                                      setCustomEmailMessageDraft('');
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#1e40af',
                                      background: '#dbeafe',
                                      border: '1px solid #bfdbfe',
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✉️ Send Email
                                  </button>
                                )}
                              </div>
                            )}
                            {reg.registrationStatus === 'Rejected' && (
                              <div style={{ marginTop: 4 }}>
                                {reg.rejectionEmailSent ? (
                                  <span
                                    title={`Non-selection notification sent on ${new Date(reg.rejectionEmailSentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#991b1b',
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      cursor: 'default',
                                    }}
                                  >
                                    ✉️ Rejection Sent
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLiveParticipant(reg);
                                      setAdminNoteDraft(reg.adminNotes || '');
                                      setCustomSlotDraft(reg.stageSlot || '');
                                      setCustomEmailMessageDraft('');
                                      setCustomRejectionMessageDraft('');
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#b91c1c',
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      padding: '2px 5px',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✉️ Send Rejection
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLiveParticipant(reg);
                                  setAdminNoteDraft(reg.adminNotes || '');
                                  setCustomSlotDraft(reg.stageSlot || '');
                                  setCustomEmailMessageDraft('');
                                  setCustomRejectionMessageDraft('');
                                }}
                                title="View full details &amp; curate"
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  border: '1px solid #cbd5e1',
                                  background: '#f8fafc',
                                  color: 'var(--green)',
                                  cursor: 'pointer',
                                }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteLiveRegistration(reg._id || reg.registrationId, reg.fullName)
                                }
                                title="Delete registration"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  border: '1px solid #fecaca',
                                  background: '#fff1f2',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Individual Participant Detail & Review Modal */}
            {selectedLiveParticipant && (
              <div
                className="modal-backdrop open"
                role="dialog"
                aria-modal="true"
                style={{ zIndex: 9999 }}
              >
                <div
                  className="modal-card"
                  style={{
                    maxWidth: 540,
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    padding: 0,
                    borderRadius: 16,
                  }}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: '18px 24px',
                      background: '#123F3D',
                      color: '#F5E8D0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c5a880' }}>
                        MORAS LIVE • REGISTRATION DETAILS
                      </div>
                      <h3
                        style={{
                          margin: '4px 0 0',
                          fontSize: '1.25rem',
                          fontFamily: "'Playfair Display', serif",
                          color: '#F5E8D0',
                        }}
                      >
                        {selectedLiveParticipant.fullName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLiveParticipant(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F5E8D0',
                        fontSize: '1.4rem',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '24px', background: '#fff' }}>
                    {/* Key Info Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 14,
                        paddingBottom: 18,
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: 18,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Registration ID
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--green)', marginTop: 2 }}>
                          {selectedLiveParticipant.registrationId}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Submitted At
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginTop: 2 }}>
                          {new Date(selectedLiveParticipant.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Role
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8B0000', marginTop: 2 }}>
                          {selectedLiveParticipant.participationRole}
                          {selectedLiveParticipant.otherRole && ` (${selectedLiveParticipant.otherRole})`}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Instagram
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: 2 }}>
                          {selectedLiveParticipant.instagramUsername ? (
                            <a
                              href={`https://instagram.com/${selectedLiveParticipant.instagramUsername.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#e11d48', textDecoration: 'none' }}
                            >
                              @{selectedLiveParticipant.instagramUsername.replace(/^@/, '')}
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Not provided</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Mobile Phone
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>
                          <a href={`tel:${selectedLiveParticipant.mobileNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {selectedLiveParticipant.mobileNumber}
                          </a>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                          Email Address
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: 2, wordBreak: 'break-all' }}>
                          <a href={`mailto:${selectedLiveParticipant.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {selectedLiveParticipant.email}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Performance Showcase Description */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>
                        Showcase Pitch / Performance Description
                      </div>
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '14px 16px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                          color: selectedLiveParticipant.performanceDescription ? '#1e293b' : '#94a3b8',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {selectedLiveParticipant.performanceDescription || 'No performance description provided.'}
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 8 }}>
                        Registration Status
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['New', 'Reviewed', 'Confirmed', 'Rejected', 'Cancelled'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              handleUpdateLiveStatus(
                                selectedLiveParticipant._id || selectedLiveParticipant.registrationId,
                                st,
                                adminNoteDraft
                              )
                            }
                            disabled={updatingLiveId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)}
                            style={{
                              padding: '7px 12px',
                              borderRadius: 8,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border:
                                selectedLiveParticipant.registrationStatus === st
                                  ? '2px solid #123F3D'
                                  : '1px solid #cbd5e1',
                              background:
                                selectedLiveParticipant.registrationStatus === st
                                  ? '#123F3D'
                                  : '#f8fafc',
                              color:
                                selectedLiveParticipant.registrationStatus === st
                                  ? '#F5E8D0'
                                  : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Curation Notes */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>
                        Admin Internal Notes
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Add internal notes about audition, timeslot, stage needs..."
                        value={adminNoteDraft}
                        onChange={(e) => setAdminNoteDraft(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateLiveStatus(
                            selectedLiveParticipant._id || selectedLiveParticipant.registrationId,
                            selectedLiveParticipant.registrationStatus,
                            adminNoteDraft
                          )
                        }
                        disabled={updatingLiveId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)}
                        style={{
                          marginTop: 8,
                          padding: '6px 14px',
                          borderRadius: 6,
                          background: 'var(--green)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save Note
                      </button>
                    </div>

                    {/* Official Performer Confirmation Email Card */}
                    <div
                      style={{
                        marginBottom: 20,
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#123F3D',
                            textTransform: 'uppercase',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          ✉️ Official Performer Confirmation Email
                        </div>
                        {selectedLiveParticipant.confirmationEmailSent ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#047857',
                              background: '#ecfdf5',
                              padding: '2px 8px',
                              borderRadius: 12,
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            ✅ Sent{' '}
                            {selectedLiveParticipant.confirmationEmailSentAt
                              ? new Date(selectedLiveParticipant.confirmationEmailSentAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#b45309',
                              background: '#fef3c7',
                              padding: '2px 8px',
                              borderRadius: 12,
                              border: '1px solid #fde68a',
                            }}
                          >
                            ⏳ Not Dispatched Yet
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        Send an official, branded invitation &amp; stage confirmation email to{' '}
                        <strong>{selectedLiveParticipant.email}</strong> detailing their stage act, soundcheck guidelines, artist hospitality, and desk hotline.
                      </p>

                      <div style={{ marginBottom: 10 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#334155',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                        >
                          Stage Slot / Performance Timing (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Saturday 7:30 PM (Slot 2) or 7:00 PM - 7:20 PM"
                          value={customSlotDraft}
                          onChange={(e) => setCustomSlotDraft(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                            background: '#fff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#334155',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                        >
                          Special Note from Curation Team (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Please bring your acoustic guitar. Your backing track has been loaded into our mixer."
                          value={customEmailMessageDraft}
                          onChange={(e) => setCustomEmailMessageDraft(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                            fontFamily: 'inherit',
                            background: '#fff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendLiveConfirmationEmail(
                              selectedLiveParticipant._id || selectedLiveParticipant.registrationId,
                              customSlotDraft,
                              customEmailMessageDraft
                            )
                          }
                          disabled={sendingLiveEmailId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 16px',
                            borderRadius: 6,
                            background: '#123F3D',
                            color: '#F5E8D0',
                            border: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor:
                              sendingLiveEmailId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)
                                ? 'wait'
                                : 'pointer',
                            boxShadow: '0 2px 6px rgba(18,63,61,0.25)',
                          }}
                        >
                          <span>✉️</span>
                          {sendingLiveEmailId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)
                            ? 'Dispatching Email...'
                            : selectedLiveParticipant.confirmationEmailSent
                            ? 'Resend Official Confirmation Email'
                            : 'Send Official Confirmation Email'}
                        </button>

                        <a
                          href={`https://wa.me/91${selectedLiveParticipant.mobileNumber}?text=${encodeURIComponent(
                            getPerformerWhatsAppMessage(
                              {
                                ...selectedLiveParticipant,
                                stageSlot: customSlotDraft || selectedLiveParticipant.stageSlot,
                              },
                              'confirmed'
                            )
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp with official slot confirmation message"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 14px',
                            borderRadius: 6,
                            background: '#25D366',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(37,211,102,0.25)',
                          }}
                        >
                          <span>💬</span> WhatsApp Confirmation Notice
                        </a>
                      </div>
                    </div>

                    {/* Official Performer Non-Selection / Rejection Email Card */}
                    <div
                      style={{
                        marginBottom: 20,
                        padding: '16px',
                        background: '#fef2f2',
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: '#991b1b',
                            textTransform: 'uppercase',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          ✉️ Professional Non-Selection Email (Top 4 Policy)
                        </div>
                        {selectedLiveParticipant.rejectionEmailSent ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#991b1b',
                              background: '#fee2e2',
                              padding: '2px 8px',
                              borderRadius: 12,
                              border: '1px solid #fca5a5',
                            }}
                          >
                            ✅ Sent{' '}
                            {selectedLiveParticipant.rejectionEmailSentAt
                              ? new Date(selectedLiveParticipant.rejectionEmailSentAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#6b7280',
                              background: '#f3f4f6',
                              padding: '2px 8px',
                              borderRadius: 12,
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            ⏳ Not Dispatched Yet
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.45 }}>
                        Sends a concise, professional notification explaining that only the <strong>top 4 performers</strong> could be curated for this edition, confirming their details are saved for future open mics, and sharing ₹149 audience pass details (with complimentary cappuccino) if they wish to attend.
                      </p>

                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#7f1d1d',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                        >
                          Personal Curation Note (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Loved your vocal range on the audition clip. We definitely want to feature you in our acoustic open mic session next month!"
                          value={customRejectionMessageDraft}
                          onChange={(e) => setCustomRejectionMessageDraft(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #fca5a5',
                            fontSize: '0.84rem',
                            fontFamily: 'inherit',
                            background: '#fff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendLiveRejectionEmail(
                              selectedLiveParticipant._id || selectedLiveParticipant.registrationId,
                              customRejectionMessageDraft
                            )
                          }
                          disabled={sendingLiveRejectionId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 16px',
                            borderRadius: 6,
                            background: '#991b1b',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor:
                              sendingLiveRejectionId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)
                                ? 'wait'
                                : 'pointer',
                            boxShadow: '0 2px 6px rgba(153,27,27,0.25)',
                          }}
                        >
                          <span>✉️</span>
                          {sendingLiveRejectionId === (selectedLiveParticipant._id || selectedLiveParticipant.registrationId)
                            ? 'Dispatching Non-Selection Email...'
                            : selectedLiveParticipant.rejectionEmailSent
                            ? 'Resend Non-Selection Notification'
                            : 'Send Professional Non-Selection Email'}
                        </button>

                        <a
                          href={`https://wa.me/91${selectedLiveParticipant.mobileNumber}?text=${encodeURIComponent(
                            getPerformerWhatsAppMessage(selectedLiveParticipant, 'rejected', customRejectionMessageDraft)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp with professional non-selection notice"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 14px',
                            borderRadius: 6,
                            background: '#25D366',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(37,211,102,0.25)',
                          }}
                        >
                          <span>💬</span> WhatsApp Non-Selection Notice
                        </a>
                      </div>
                    </div>

                    {/* Direct Contact Actions */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        paddingTop: 16,
                        borderTop: '1px solid #e2e8f0',
                        flexWrap: 'wrap',
                      }}
                    >
                      <a
                        href={`https://wa.me/91${selectedLiveParticipant.mobileNumber}?text=${encodeURIComponent(
                          getPerformerWhatsAppMessage(selectedLiveParticipant)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          borderRadius: 8,
                          background: '#25D366',
                          color: '#fff',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                        }}
                      >
                        <span>💬</span>{' '}
                        {selectedLiveParticipant.registrationStatus === 'Rejected'
                          ? 'WhatsApp Non-Selection Notice'
                          : selectedLiveParticipant.registrationStatus === 'Confirmed'
                          ? 'WhatsApp Confirmation Notice'
                          : 'WhatsApp Participant'}
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteLiveRegistration(
                            selectedLiveParticipant._id || selectedLiveParticipant.registrationId,
                            selectedLiveParticipant.fullName
                          )
                        }
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #fecaca',
                          background: '#fff1f2',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MORAS LIVE — AUDIENCE PASSES & DIGITAL ENTRY DASHBOARD */}
        {/* ======================================================== */}
        {activeTab === 'moras-live-passes' && (role === 'admin' || role === 'kitchen') && (
          <div className="moras-live-passes-admin-section" style={{ textAlign: 'left' }}>
            {/* Header Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20,
                background: '#123F3D',
                padding: '20px 24px',
                borderRadius: 14,
                color: '#F5E8D0',
                border: '1px solid rgba(197, 168, 128, 0.3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.8rem' }}>🎟️</span>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.45rem',
                        fontFamily: "'Playfair Display', serif",
                        letterSpacing: '0.04em',
                        color: '#F5E8D0',
                      }}
                    >
                      MORAS LIVE — Audience Passes &amp; Digital Entry
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#c5a880' }}>
                      Strict 60-Pass Capacity • Single QR Verification • Cafe Payment Desk • Cappuccino • Door Entry
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href="/moras-live/passes"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 232, 208, 0.12)',
                    color: '#F5E8D0',
                    border: '1px solid rgba(245, 232, 208, 0.3)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>🔗</span> Public Pass Page
                </a>

                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={handleOpenDeleteTestsModal}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🗑️</span> Delete Test Records
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportPassesCsv}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 232, 208, 0.15)',
                    color: '#F5E8D0',
                    border: '1px solid rgba(245, 232, 208, 0.3)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📥 Export Passes CSV
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchMorasPassStats();
                    fetchMorasPasses();
                  }}
                  disabled={morasPassLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 232, 208, 0.15)',
                    color: '#F5E8D0',
                    border: '1px solid rgba(245, 232, 208, 0.3)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: morasPassLoading ? 'wait' : 'pointer',
                  }}
                >
                  🔄 {morasPassLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Approved Business Rules Policy Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: 12,
                padding: '12px 20px',
                marginBottom: 20,
                color: '#166534',
                fontSize: '0.88rem',
              }}
            >
              <div>
                <strong>✅ MORAS LIVE Official Pass Policy:</strong> ₹149 per pass • Payment collected at event entrance (Cash or verified UPI) • Strict 60-pass capacity.
              </div>
              <div style={{ fontSize: '0.82rem', color: '#15803D' }}>
                ☕ One complimentary hot Cappuccino included with each confirmed pass.
              </div>
            </div>

            {/* 10 Operational Summary Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {/* 1. Total Capacity */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Total Capacity</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#123F3D', marginTop: 4 }}>
                  {morasPassStats.totalCapacity || 60}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Strict max ceiling</div>
              </div>

              {/* 2. Available Passes */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Available Passes</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: (morasPassStats.availablePasses ?? 60) > 0 ? '#15803D' : '#DC2626', marginTop: 4 }}>
                  {morasPassStats.availablePasses ?? 60}
                </div>
                <div style={{ fontSize: '0.72rem', color: (morasPassStats.availablePasses ?? 60) > 0 ? '#166534' : '#DC2626' }}>
                  {(morasPassStats.availablePasses ?? 60) > 0 ? 'Remaining slots' : 'SOLD OUT'}
                </div>
              </div>

              {/* 3. Confirmed Paid Passes */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Paid &amp; Active</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803D', marginTop: 4 }}>
                  {morasPassStats.confirmedPaidPasses || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Confirmed passes</div>
              </div>

              {/* 4. Active Reservations */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Reserved (Unpaid)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#D97706', marginTop: 4 }}>
                  {morasPassStats.activeReservations || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Payment pending</div>
              </div>

              {/* 5. Total Collections */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Total Collected</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#123F3D', marginTop: 4 }}>
                  ₹{morasPassStats.totalAmountCollected || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Physical collections</div>
              </div>

              {/* 6. UPI Collections */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>UPI Collections</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563EB', marginTop: 4 }}>
                  ₹{typeof morasPassStats.upiCollections === 'object' ? (morasPassStats.upiCollections?.total || 0) : (morasPassStats.upiCollections || 0)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Verified with UTR</div>
              </div>

              {/* 7. Cash Collections */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Cash Collections</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: 4 }}>
                  ₹{typeof morasPassStats.cashCollections === 'object' ? (morasPassStats.cashCollections?.total || 0) : (morasPassStats.cashCollections || 0)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Counter register</div>
              </div>

              {/* 8. Cappuccinos Redeemed */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>☕ Cappuccinos</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#92400E', marginTop: 4 }}>
                  {morasPassStats.cappuccinosRedeemed || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Served at café</div>
              </div>

              {/* 9. Event Check-Ins */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>🚪 Door Check-Ins</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>
                  {morasPassStats.eventCheckIns || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Admitted attendees</div>
              </div>

              {/* 10. Emails Delivered */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>✉️ Emails Sent</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7', marginTop: 4 }}>
                  {morasPassStats.emailsSent || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Confirmation dispatched</div>
              </div>

              {/* 11. Email Failures */}
              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>⚠️ Email Failures</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: (morasPassStats.emailsFailed || 0) > 0 ? '#DC2626' : '#10B981', marginTop: 4 }}>
                  {morasPassStats.emailsFailed || 0}
                </div>
                <div style={{ fontSize: '0.72rem', color: (morasPassStats.emailsFailed || 0) > 0 ? '#DC2626' : '#64748B' }}>
                  {(morasPassStats.emailsFailed || 0) > 0 ? 'Delivery issues' : 'All delivered'}
                </div>
              </div>
            </div>

            {/* ACTION DESK & SCANNER (The central operational tool for Cashier & Kitchen) */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '2px solid #123F3D',
                padding: '24px',
                marginBottom: 24,
                boxShadow: '0 6px 18px rgba(18, 63, 61, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#123F3D' }}>
                    Staff Action Desk &amp; Single-QR Scanner
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#666' }}>
                    Type or paste a Pass ID (e.g. <code>ML-0001</code>), 10-digit mobile number, or raw QR Token to verify customer.
                  </p>
                </div>
              </div>

              {/* Scanner Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyPass();
                }}
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}
              >
                <input
                  type="text"
                  placeholder="Scan QR payload, paste token, or enter ML-0001 / 9876543210..."
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  disabled={scannerLoading}
                  style={{
                    flex: '1 1 300px',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.98rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={scannerLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    background: '#123F3D',
                    color: '#FAF5EF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: scannerLoading ? 'wait' : 'pointer',
                  }}
                >
                  {scannerLoading ? 'Verifying…' : '🔍 Verify Pass'}
                </button>
                {scannedPass && (
                  <button
                    type="button"
                    onClick={() => {
                      setScannedPass(null);
                      setScannerInput('');
                    }}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 8,
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* Scanned Pass Action Panel */}
              {scannedPass && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 12,
                    padding: '20px',
                  }}
                >
                  {/* Pass Quick Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      borderBottom: '1px solid #E2E8F0',
                      paddingBottom: 14,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.3rem',
                          fontWeight: 900,
                          color: '#123F3D',
                          background: '#E0E7FF',
                          padding: '4px 10px',
                          borderRadius: 6,
                          marginRight: 10,
                        }}
                      >
                        #{scannedPass.passId}
                      </span>
                      <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>{scannedPass.customerName}</strong>
                      <span style={{ color: '#64748B', marginLeft: 8, fontSize: '0.9rem' }}>
                        (+91 {scannedPass.mobileNumber})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          background: scannedPass.paymentStatus === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                          color: scannedPass.paymentStatus === 'PAID' ? '#166534' : '#92400E',
                        }}
                      >
                        {scannedPass.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          background: scannedPass.ticketStatus === 'ACTIVE' ? '#E0F2FE' : '#F1F5F9',
                          color: scannedPass.ticketStatus === 'ACTIVE' ? '#0369A1' : '#475569',
                        }}
                      >
                        {scannedPass.ticketStatus}
                      </span>
                    </div>
                  </div>

                  {/* Operational Desks Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 18,
                    }}
                  >
                    {/* DESK 1: PAYMENT COLLECTION (Admin Only) */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#123F3D', marginBottom: 8 }}>
                        💰 1. Payment Desk
                      </div>

                      {scannedPass.paymentStatus === 'PAID' ? (
                        <div style={{ color: '#166534', fontSize: '0.88rem', background: '#F0FDF4', padding: '10px 12px', borderRadius: 8 }}>
                          <strong>✅ PAID ₹{scannedPass.paidAmount || scannedPass.payableAmount}</strong> via {scannedPass.paymentMethod}
                          {scannedPass.upiTransactionReference && (
                            <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 4 }}>
                              UTR: <code>{scannedPass.upiTransactionReference}</code>
                            </div>
                          )}
                        </div>
                      ) : role === 'admin' ? (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 10 }}>
                            Payable: <strong>₹{scannedPass.payableAmount}</strong> (Exact same QR will remain active)
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="radio"
                                name="payMethod"
                                value="UPI"
                                checked={paymentMethodChoice === 'UPI'}
                                onChange={() => setPaymentMethodChoice('UPI')}
                              />
                              UPI
                            </label>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="radio"
                                name="payMethod"
                                value="CASH"
                                checked={paymentMethodChoice === 'CASH'}
                                onChange={() => setPaymentMethodChoice('CASH')}
                              />
                              Cash
                            </label>
                          </div>

                          {paymentMethodChoice === 'UPI' && (
                            <div style={{ marginBottom: 10 }}>
                              <input
                                type="text"
                                placeholder="UPI UTR / Ref (e.g. 324109845612)"
                                value={upiUtrInput}
                                onChange={(e) => setUpiUtrInput(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.85rem',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCollectPayment(scannedPass.passId)}
                            disabled={isProcessingPayment || !scannedPass.priceConfirmed}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: 6,
                              background: scannedPass.priceConfirmed ? '#123F3D' : '#9CA3AF',
                              color: '#FAF5EF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: scannedPass.priceConfirmed ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isProcessingPayment
                              ? 'Recording Payment…'
                              : scannedPass.priceConfirmed
                              ? `Collect ₹${scannedPass.payableAmount} & Activate Pass`
                              : 'Price Approval Required'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: '#92400E', fontSize: '0.82rem', background: '#FFFBEB', padding: '10px 12px', borderRadius: 8 }}>
                          Payment collection is handled by Cashier / Admin.
                        </div>
                      )}
                    </div>

                    {/* DESK 2: CAPPUCCINO REDEMPTION (Kitchen & Admin) */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#123F3D', marginBottom: 8 }}>
                        ☕ 2. Cappuccino Desk
                      </div>

                      {scannedPass.cappuccinoRedeemed ? (
                        <div style={{ color: '#166534', fontSize: '0.85rem', background: '#F0FDF4', padding: '10px 12px', borderRadius: 8 }}>
                          <strong>✅ ALREADY REDEEMED</strong>
                          <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 4 }}>
                            Redeemed at: {scannedPass.cappuccinoRedeemedAt ? new Date(scannedPass.cappuccinoRedeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 10 }}>
                            1 Complimentary hot Cappuccino included with this pass.
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRedeemCappuccino(scannedPass.passId)}
                            disabled={isProcessingCappuccino || scannedPass.paymentStatus !== 'PAID'}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: 6,
                              background: scannedPass.paymentStatus === 'PAID' ? '#92400E' : '#E2E8F0',
                              color: scannedPass.paymentStatus === 'PAID' ? '#FAF5EF' : '#94A3B8',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: scannedPass.paymentStatus === 'PAID' ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isProcessingCappuccino
                              ? 'Redeeming…'
                              : scannedPass.paymentStatus === 'PAID'
                              ? '☕ Redeem 1 Cappuccino'
                              : 'Requires Payment First'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* DESK 3: EVENT DOOR ENTRY CHECK-IN (Kitchen & Admin) */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '16px',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#123F3D', marginBottom: 8 }}>
                        🚪 3. Door Entry Scanner
                      </div>

                      {scannedPass.entryCheckedIn ? (
                        <div style={{ color: '#991B1B', fontSize: '0.88rem', background: '#FEF2F2', border: '1.5px solid #DC2626', padding: '12px 14px', borderRadius: 8 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🚫</span> ALREADY CHECKED IN
                          </div>
                          <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                            Attendee was previously admitted at {scannedPass.entryCheckedInAt ? new Date(scannedPass.entryCheckedInAt).toLocaleString() : 'earlier'} {scannedPass.checkedInBy ? `by ${scannedPass.checkedInBy}` : ''}.
                          </div>
                        </div>
                      ) : scannedPass.paymentStatus !== 'PAID' ? (
                        <div>
                          <div style={{ color: '#B45309', fontSize: '0.84rem', background: '#FEF3C7', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
                            <strong>⏳ Payment of ₹149 Due at Entrance</strong>
                            <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                              Collect ₹149 (Cash or UPI) at door to admit guest.
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="radio"
                                name="entrancePayMethod"
                                value="CASH"
                                checked={paymentMethodChoice === 'CASH'}
                                onChange={() => setPaymentMethodChoice('CASH')}
                              />
                              Cash ₹149
                            </label>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="radio"
                                name="entrancePayMethod"
                                value="UPI"
                                checked={paymentMethodChoice === 'UPI'}
                                onChange={() => setPaymentMethodChoice('UPI')}
                              />
                              UPI ₹149
                            </label>
                          </div>

                          {paymentMethodChoice === 'UPI' && (
                            <div style={{ marginBottom: 10 }}>
                              <input
                                type="text"
                                placeholder="Enter UPI UTR / Ref..."
                                value={upiUtrInput}
                                onChange={(e) => setUpiUtrInput(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.85rem',
                                  boxSizing: 'border-box',
                                  marginBottom: 6,
                                }}
                              />
                              <small style={{ color: '#B45309', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>
                                ⚠️ Verify credit received in cafe merchant account before admitting.
                              </small>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEntranceAdmit(scannedPass.passId)}
                            disabled={isProcessingEntry}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: 6,
                              background: '#15803D',
                              color: '#FAF5EF',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              cursor: 'pointer',
                            }}
                          >
                            {isProcessingEntry ? 'Processing Admission…' : '🎟️ Collect ₹149 & Admit (Check-In)'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 10 }}>
                            Pass verified &amp; paid. Ready for stage admission.
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckInEntry(scannedPass.passId)}
                            disabled={isProcessingEntry}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: 6,
                              background: '#15803D',
                              color: '#FAF5EF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: 'pointer',
                            }}
                          >
                            {isProcessingEntry ? 'Admitting…' : '🚪 Admit Attendee (Check-In)'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PASSES MASTER TABLE & FILTERS */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E2E8F0',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#123F3D' }}>
                  Audience Passes Directory ({morasPasses.length})
                </div>

                {/* Filter Controls */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search name, mobile, Pass ID..."
                    value={morasPassSearch}
                    onChange={(e) => setMorasPassSearch(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      width: 220,
                    }}
                  />

                  <select
                    value={morasPassPaymentFilter}
                    onChange={(e) => setMorasPassPaymentFilter(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFF',
                    }}
                  >
                    <option value="">All Payments</option>
                    <option value="PAID">Paid Only</option>
                    <option value="PENDING">Pending Only</option>
                  </select>

                  <select
                    value={morasPassStatusFilter}
                    onChange={(e) => setMorasPassStatusFilter(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFF',
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {morasPassLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading passes…</div>
              ) : !Array.isArray(morasPasses) || morasPasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>No audience passes found.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Pass ID</th>
                        <th style={{ padding: '10px 12px' }}>Attendee</th>
                        <th style={{ padding: '10px 12px' }}>Mobile &amp; Email</th>
                        <th style={{ padding: '10px 12px' }}>Payment</th>
                        <th style={{ padding: '10px 12px' }}>Cappuccino</th>
                        <th style={{ padding: '10px 12px' }}>Door Entry</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {morasPasses.map((pass) => (
                        <tr key={pass.passId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#123F3D' }}>
                            <span>#{pass.passId}</span>
                            {pass.isTest && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                }}
                              >
                                🧪 TEST
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>
                            {pass.customerName}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            <div>+91 {pass.normalizedMobileNumber}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{pass.email}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: pass.paymentStatus === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                                color: pass.paymentStatus === 'PAID' ? '#166534' : '#92400E',
                              }}
                            >
                              {pass.paymentStatus === 'PAID' ? `PAID (₹${pass.paidAmount || pass.payableAmount})` : 'PENDING'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {pass.cappuccinoRedeemed ? (
                              <span style={{ color: '#166534', fontWeight: 700 }}>✅ Redeemed</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>Pending</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {pass.entryCheckedIn ? (
                              <span style={{ color: '#166534', fontWeight: 700 }}>✅ Admitted</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>Not checked in</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setScannerInput(pass.passId);
                                  handleVerifyPass(pass.passId);
                                  window.scrollTo({ top: 400, behavior: 'smooth' });
                                }}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  background: '#123F3D',
                                  color: '#FAF5EF',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Desk
                              </button>

                              {pass.reservationStatus === 'EXPIRED' && role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleReactivatePass(pass.passId)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: '#F59E0B',
                                    color: '#FFF',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reactivate
                                </button>
                              )}

                              {role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassifyTest(pass.passId, pass.isTest)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: pass.isTest ? '#FEF3C7' : '#F1F5F9',
                                    color: pass.isTest ? '#92400E' : '#475569',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title={pass.isTest ? 'Classified as test. Click to mark as genuine.' : 'Click to classify as test record'}
                                >
                                  {pass.isTest ? '🧪 Test' : 'Set Test'}
                                </button>
                              )}

                              {role === 'admin' && pass.ticketStatus !== 'REVOKED' && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokePass(pass.passId, pass.customerName)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DELETE TEST RECORDS MODAL (Admin Only) */}
            {isDeleteTestsModalOpen && role === 'admin' && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 99999,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    maxWidth: 580,
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: '20px 24px',
                      background: deleteStep === 2 ? '#991B1B' : '#123F3D',
                      color: '#FAF5EF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                        {deleteStep === 1 ? '🗑️ Delete Test Records' : '⚠️ Confirm Permanent Deletion'}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: deleteStep === 2 ? '#FEE2E2' : '#C5A880', marginTop: 2 }}>
                        {deleteStep === 1
                          ? 'Select only verified test reservations to delete'
                          : 'Second Confirmation — This action cannot be undone'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDeleteTestsModalOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#FAF5EF', fontSize: '1.3rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {deleteStep === 1 ? (
                      <div>
                        <div
                          style={{
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 10,
                            padding: '12px 16px',
                            marginBottom: 16,
                            fontSize: '0.84rem',
                            color: '#92400E',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>🛡️ Data Protection Notice:</strong>
                          <br />
                          Select only reservations created for internal testing. Genuine customer records, confirmed passes, payments, and QR credentials will remain completely untouched.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#123F3D' }}>
                            Audience Passes Directory ({morasPasses.length} total)
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedTestPassIds.length > 0 ? '#DC2626' : '#64748B' }}>
                            {selectedTestPassIds.length} test record(s) selected
                          </span>
                        </div>

                        {morasPasses.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                            No passes found in database.
                          </div>
                        ) : (
                          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                            {morasPasses.map((p) => {
                              const isChecked = selectedTestPassIds.includes(p.passId);
                              return (
                                <label
                                  key={p.passId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 14px',
                                    borderBottom: '1px solid #F1F5F9',
                                    background: isChecked ? '#FEF2F2' : '#FFFFFF',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleSelectTestPass(p.passId)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#123F3D', fontSize: '0.88rem' }}>
                                        #{p.passId}
                                      </span>
                                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                                        {p.customerName}
                                      </strong>
                                      {p.isTest && (
                                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: 4, fontSize: '0.66rem', fontWeight: 800 }}>
                                          TEST
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                                      +91 {p.normalizedMobileNumber} • {p.email} • {p.paymentStatus}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Step 2: Explicit Confirmation Warning */}
                        <div
                          style={{
                            background: '#FEF2F2',
                            border: '1.5px solid #DC2626',
                            borderRadius: 12,
                            padding: '18px 20px',
                            color: '#991B1B',
                            marginBottom: 20,
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span>⚠️</span> FINAL DELETION CONFIRMATION
                          </div>
                          <p style={{ margin: '0 0 12px', fontSize: '0.86rem', lineHeight: 1.5 }}>
                            You are about to permanently delete <strong>{selectedTestPassIds.length}</strong> test reservation(s):
                          </p>
                          <div
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #FECACA',
                              borderRadius: 8,
                              padding: '10px 14px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#B91C1C',
                              marginBottom: 14,
                              wordBreak: 'break-all',
                            }}
                          >
                            {selectedTestPassIds.join(', ')}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', lineHeight: 1.6 }}>
                            <li>The selected audience pass documents will be permanently purged from MongoDB.</li>
                            <li>Any associated test payment ledger records will be removed.</li>
                            <li><strong>{selectedTestPassIds.length} slot(s)</strong> will be restored to available capacity.</li>
                            <li>This action is permanently logged to the system audit trail.</li>
                            <li><strong>Genuine customer passes remain 100% safe and untouched.</strong></li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Controls */}
                  <div
                    style={{
                      padding: '16px 24px',
                      background: '#F8FAFC',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (deleteStep === 2) {
                          setDeleteStep(1);
                        } else {
                          setIsDeleteTestsModalOpen(false);
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                      }}
                    >
                      {deleteStep === 2 ? '← Back to Selection' : 'Cancel'}
                    </button>

                    {deleteStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => setDeleteStep(2)}
                        disabled={selectedTestPassIds.length === 0}
                        style={{
                          padding: '10px 22px',
                          borderRadius: 8,
                          background: selectedTestPassIds.length > 0 ? '#DC2626' : '#94A3B8',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: selectedTestPassIds.length > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Proceed to Confirmation ({selectedTestPassIds.length}) →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExecuteDeleteTests}
                        disabled={isDeletingTests}
                        style={{
                          padding: '10px 24px',
                          borderRadius: 8,
                          background: '#B91C1C',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: isDeletingTests ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {isDeletingTests ? 'Deleting Records…' : `🔴 Yes, Permanently Delete ${selectedTestPassIds.length} Test Record(s)`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* ================= ORDER BILL RECEIPT MODAL ================= */}
        {selectedBillOrder && (
          <div className="modal-backdrop open" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
            <div className="modal-card" style={{ maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
              
              {/* Header Controls (no-print) */}
              <div className="no-print" style={{ padding: '16px 20px', background: 'var(--green)', color: '#FAF5EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🧾</span>
                  <span>Order Bill Receipt</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBillOrder(null)}
                  style={{ background: 'none', border: 'none', color: '#FAF5EF', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Action Toolbar (no-print) */}
              <div className="no-print" style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintBill}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0F3D3E' }}
                >
                  <span>🖨️</span>
                  <span>Print Slip</span>
                </button>
                <a
                  href={`https://wa.me/91${selectedBillOrder.phone}?text=${encodeURIComponent(
                    `*THE MORAS CAFE — Bill Receipt*\nInvoice: #TMC-INV-${selectedBillOrder._id.slice(-6).toUpperCase()}\nCustomer: ${selectedBillOrder.name}\nTable: ${selectedBillOrder.address}\n\nItems:\n` +
                    selectedBillOrder.items.map(i => ` - ${i.name}${i.variant ? ` (${i.variant})` : ''} x ${i.qty}: Rs.${i.price * i.qty}`).join('\n') +
                    `\n\n*Grand Total: Rs.${selectedBillOrder.total}*\nPayment: ${selectedBillOrder.payment?.toUpperCase()}\n\nThank you for dining with The Moras Cafe!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Email Bill to Customer (no-print) */}
              <div className="no-print" style={{ padding: '12px 20px', background: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700, marginBottom: 4 }}>
                  ✉️ SEND DIGITAL INVOICE / BILL TO CUSTOMER EMAIL:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={billEmailInput}
                    onChange={(e) => setBillEmailInput(e.target.value)}
                    placeholder="customer@gmail.com"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', borderRadius: 6, border: '1px solid #a7f3d0' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendBillEmail(selectedBillOrder._id, billEmailInput)}
                    disabled={isSendingBillEmail}
                    style={{ background: '#047857', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {isSendingBillEmail ? 'Sending…' : 'Send Bill'}
                  </button>
                </div>
              </div>

              {/* The Actual Printable Thermal/A4 Slip */}
              <div style={{ padding: '20px' }}>
                <div className="bill-receipt-printable" style={{
                  background: '#fff',
                  color: '#1a1a1a',
                  padding: '24px 20px',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', monospace, Arial, sans-serif",
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  {/* Cafe Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0F3D3E' }}>
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F3D3E', letterSpacing: 0.5 }}>THE MORAS CAFE</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                      At Udayshree Sports Academy, Solapur Rd, Adarsh Nagar, Vijayapura, KA 586103
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Ph: +91 99454 46137 &bull; 100% Pure Vegetarian
                    </div>
                    <div style={{ display: 'inline-block', background: '#0F3D3E', color: '#FAF5EF', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800, marginTop: 6, letterSpacing: 0.5 }}>
                      TAX INVOICE / BILL RECEIPT
                    </div>
                  </div>

                  {/* Order / Invoice Meta */}
                  <div style={{ fontSize: '0.82rem', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Bill / Inv No:</span>
                      <strong style={{ fontFamily: 'monospace' }}>#TMC-INV-{selectedBillOrder._id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Date &amp; Time:</span>
                      <span>{new Date(selectedBillOrder.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Table / Location:</span>
                      <strong style={{ color: '#0F3D3E' }}>{selectedBillOrder.address}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Customer:</span>
                      <strong>{selectedBillOrder.name} ({selectedBillOrder.phone})</strong>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #0F3D3E', fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>
                        <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '6px 0' }}>Rate</th>
                        <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBillOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                          <td style={{ padding: '7px 0', fontWeight: 600 }}>
                            {item.name}
                            {item.variant ? <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}> ({item.variant})</span> : ''}
                          </td>
                          <td style={{ textAlign: 'center', padding: '7px 0' }}>{item.qty}</td>
                          <td style={{ textAlign: 'right', padding: '7px 0' }}>₹{item.price}</td>
                          <td style={{ textAlign: 'right', padding: '7px 0', fontWeight: 700 }}>₹{item.price * item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ borderTop: '1.5px solid #0F3D3E', paddingTop: 8, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: '#64748b' }}>Item Subtotal:</span>
                      <span>₹{selectedBillOrder.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.78rem', color: '#059669' }}>
                      <span>GST / Taxes:</span>
                      <span>Included (₹0.00 Extra)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '2px solid #0F3D3E', fontSize: '1.15rem', fontWeight: 900, color: '#0F3D3E' }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedBillOrder.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Payment Method:</span>
                      <strong style={{ color: '#047857' }}>{selectedBillOrder.payment?.toUpperCase() || 'COUNTER'}</strong>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div style={{ textAlign: 'center', borderTop: '1.5px dashed #cbd5e1', marginTop: 12, paddingTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
                    <div>Thank you for visiting The Moras Cafe!</div>
                    <div style={{ fontStyle: 'italic', marginTop: 2 }}>This is an official computer-generated digital bill.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= BIRTHDAY FINAL BILL GENERATOR MODAL ================= */}
        {selectedBirthdayBill && (
          <div className="modal-backdrop open" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
            <div className="modal-card" style={{ maxWidth: 490, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
              
              {/* Header Controls (no-print) */}
              <div className="no-print" style={{ padding: '16px 20px', background: 'var(--green)', color: '#FAF5EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎂</span>
                  <span>Birthday Celebration Final Bill</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBirthdayBill(null)}
                  style={{ background: 'none', border: 'none', color: '#FAF5EF', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Calculator Inputs (no-print) */}
              <div className="no-print" style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Enter Food &amp; Beverage Total Ordered in Café (₹):
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={birthdayFoodTotal}
                    onChange={(e) => setBirthdayFoodTotal(e.target.value)}
                    placeholder="e.g. 750"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '1rem', fontWeight: 800, borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={handlePrintBill}
                    className="btn-primary"
                    style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, background: '#0F3D3E' }}
                  >
                    <span>🖨️</span>
                    <span>Print Slip</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                  Formula: Food amount + ₹140 remaining setup balance = Final Bill
                </div>
              </div>

              {/* The Actual Printable Birthday Slip */}
              <div style={{ padding: '20px' }}>
                <div className="bill-receipt-printable" style={{
                  background: '#fff',
                  color: '#1a1a1a',
                  padding: '24px 20px',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', monospace, Arial, sans-serif",
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  {/* Cafe Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0F3D3E' }}>
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F3D3E', letterSpacing: 0.5 }}>THE MORAS CAFE</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                      At Udayshree Sports Academy, Solapur Rd, Adarsh Nagar, Vijayapura, KA 586103
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Ph: +91 99454 46137 &bull; 100% Pure Vegetarian
                    </div>
                    <div style={{ display: 'inline-block', background: '#0F3D3E', color: '#FAF5EF', padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800, marginTop: 6, letterSpacing: 0.5 }}>
                      BIRTHDAY EVENT FINAL BILL
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div style={{ fontSize: '0.82rem', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Booking Ref:</span>
                      <strong style={{ fontFamily: 'monospace' }}>#TMC-BDAY-{selectedBirthdayBill._id.slice(-6).toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Celebrant:</span>
                      <strong>{selectedBirthdayBill.birthdayPerson || selectedBirthdayBill.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Booked By:</span>
                      <span>{selectedBirthdayBill.name} ({selectedBirthdayBill.phone})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Date &amp; Slot:</span>
                      <span>{selectedBirthdayBill.date} at {selectedBirthdayBill.time} ({selectedBirthdayBill.guests} People)</span>
                    </div>
                  </div>

                  {/* Package Breakdown */}
                  <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: 10, marginBottom: 10, fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Birthday Setup Package (Stand &amp; Lights):</span>
                      <strong>₹199</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#047857' }}>
                      <span>Advance Token Paid (UPI):</span>
                      <strong>−₹59 (Paid)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#c2410c', fontWeight: 700 }}>
                      <span>Remaining Setup Balance Due:</span>
                      <span>₹140</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', marginTop: 4, borderTop: '1px dashed #e2e8f0' }}>
                      <span>Food &amp; Drinks Consumed:</span>
                      <strong>₹{Number(birthdayFoodTotal) || 0}</strong>
                    </div>
                  </div>

                  {/* Final Total */}
                  <div style={{ fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0F3D3E', borderTop: '2px solid #0F3D3E' }}>
                      <span>Final Cafe Bill:</span>
                      <span>₹{(Number(birthdayFoodTotal) || 0) + 140}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                      Calculation: ₹{Number(birthdayFoodTotal) || 0} (Food) + ₹140 (Setup Balance)
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div style={{ textAlign: 'center', borderTop: '1.5px dashed #cbd5e1', marginTop: 14, paddingTop: 10, fontSize: '0.72rem', color: '#64748b' }}>
                    <div>Thank you for celebrating with The Moras Cafe! 🎂✨</div>
                    <div style={{ fontStyle: 'italic', marginTop: 2 }}>This is an official computer-generated digital bill.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </section>
  );
}

export default Admin;