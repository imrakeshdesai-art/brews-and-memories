const crypto = require('crypto');
const { MorasLiveRegistration } = require('../models/MorasLiveRegistration');

const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(length = 6) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CHARACTERS[bytes[i] % CHARACTERS.length];
  }
  return result;
}

async function generateUniqueRegistrationId() {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = `ML-${generateRandomCode(6)}`;
    const existing = await MorasLiveRegistration.findOne({ registrationId: candidateId }).select('_id');
    if (!existing) {
      return candidateId;
    }
  }
  // Fallback with timestamp-based suffix if collisions occur
  return `ML-${Date.now().toString(36).toUpperCase()}`;
}

module.exports = {
  generateUniqueRegistrationId,
};
