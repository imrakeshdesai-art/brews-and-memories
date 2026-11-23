const { MorasLiveAudiencePass } = require('../models/MorasLiveAudiencePass');

/**
 * Generates sequential, unique Audience Pass IDs: ML-0001, ML-0002, ... ML-0060
 * Ensures no collisions by checking database.
 */
async function generateAudiencePassId(eventId = 'moras-live-2026') {
  const totalCount = await MorasLiveAudiencePass.countDocuments({ eventId });
  let nextNumber = totalCount + 1;

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidateId = `ML-${String(nextNumber).padStart(4, '0')}`;
    const exists = await MorasLiveAudiencePass.findOne({ passId: candidateId }).select('_id');
    if (!exists) {
      return candidateId;
    }
    nextNumber++;
  }

  // Fallback timestamp suffix if extreme concurrency occurs
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ML-${String(nextNumber).padStart(4, '0')}-${randomSuffix}`;
}

module.exports = {
  generateAudiencePassId,
};
