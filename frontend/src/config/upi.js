// Zero-fee, direct UPI Configuration for The Moras Cafe
export const UPI_CONFIG = {
  // Cafe official UPI Virtual Payment Address (VPA)
  // Can be overridden via VITE_CAFE_UPI_ID in environment
  upiId: import.meta.env.VITE_CAFE_UPI_ID || 'rockey63616792411@ybl',
  payeeName: 'The Moras Cafe',
  bookingAmount: 10, // ₹10 nominal commitment advance
  cafePhone: '+919945446137',
};

/**
 * Builds standard universal UPI payment URI
 * Compatible with Google Pay, PhonePe, Paytm, BHIM, Cred, and all Indian banking apps
 */
export function buildUpiUri({
  upiId = UPI_CONFIG.upiId,
  payeeName = UPI_CONFIG.payeeName,
  amount = UPI_CONFIG.bookingAmount,
  note = 'Table Booking Advance',
} = {}) {
  const cleanUpiId = upiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(note.trim());
  return `upi://pay?pa=${cleanUpiId}&pn=${cleanName}&am=${amount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Builds free, fast dynamic QR code URL
 */
export function buildUpiQrUrl(upiUri, size = 240) {
  return `https://quickchart.io/qr?text=${encodeURIComponent(upiUri)}&size=${size}&margin=1`;
}
