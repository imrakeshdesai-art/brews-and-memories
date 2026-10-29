const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const MenuAvailability = require('../models/MenuAvailability');
const { MENU_CATALOG } = require('../data/menuCatalog');

/**
 * Normalizes an item key to lowercase trimmed canonical format.
 */
function normalizeKey(str) {
  return String(str || '').trim().toLowerCase();
}

// ==================== PUBLIC: GET AVAILABILITY ====================
// Lightweight endpoint for customer menus and carts
router.get('/availability', async (req, res) => {
  try {
    const soldOutDocs = await MenuAvailability.find({ isAvailable: false }).lean();

    const unavailableKeys = soldOutDocs.map((doc) => doc.itemKey);
    const unavailableItems = soldOutDocs.map((doc) => doc.name);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json({
      unavailableKeys,
      unavailableItems,
      count: unavailableKeys.length,
    });
  } catch (err) {
    console.error('Error fetching menu availability:', err);
    return res.status(500).json({ message: 'Failed to retrieve menu availability' });
  }
});

// ==================== ADMIN: GET FULL CATALOG AVAILABILITY ====================
// Returns all catalog items with their active availability status
router.get('/admin/availability', auth, checkRole(['admin']), async (req, res) => {
  try {
    const overrides = await MenuAvailability.find({}).lean();
    const overrideMap = new Map();
    overrides.forEach((doc) => {
      overrideMap.set(doc.itemKey, {
        isAvailable: doc.isAvailable,
        updatedBy: doc.updatedBy,
        updatedAt: doc.updatedAt,
      });
    });

    const items = Object.entries(MENU_CATALOG).map(([key, catalogItem]) => {
      const override = overrideMap.get(key);
      return {
        itemKey: key,
        name: catalogItem.name,
        category: catalogItem.category || 'General',
        price: catalogItem.price ?? catalogItem.priceM ?? catalogItem.priceHot ?? 0,
        multi: Boolean(catalogItem.multi),
        tempVariant: Boolean(catalogItem.tempVariant),
        isAvailable: override ? override.isAvailable : true,
        updatedAt: override?.updatedAt || null,
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error('Error fetching admin menu availability:', err);
    return res.status(500).json({ message: 'Failed to retrieve admin menu availability' });
  }
});

// ==================== ADMIN: TOGGLE ITEM AVAILABILITY ====================
router.patch('/admin/availability/:itemKey', auth, checkRole(['admin']), async (req, res) => {
  try {
    const rawKey = decodeURIComponent(req.params.itemKey || '');
    const itemKey = normalizeKey(rawKey);

    const catalogItem = MENU_CATALOG[itemKey];
    if (!catalogItem) {
      return res.status(400).json({
        message: `Item key "${rawKey}" not found in official menu catalog.`,
      });
    }

    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        message: 'Field "isAvailable" is required and must be a boolean.',
      });
    }

    const updated = await MenuAvailability.findOneAndUpdate(
      { itemKey },
      {
        itemKey,
        name: catalogItem.name,
        isAvailable,
        updatedBy: req.user?.email || 'admin',
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      item: {
        itemKey: updated.itemKey,
        name: updated.name,
        isAvailable: updated.isAvailable,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error updating menu item availability:', err);
    return res.status(500).json({ message: 'Failed to update item availability' });
  }
});

module.exports = router;
