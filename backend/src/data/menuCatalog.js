/**
 * Authoritative Server-Side Menu Catalog for THE MORAS CAFE
 *
 * Source of truth for item availability, pricing, variants, and calculations.
 * Client-submitted prices and totals must NEVER be trusted directly.
 */

const MENU_CATALOG = {
  "masala tea": {
    "name": "Masala Tea",
    "category": "Beverages",
    "multi": false,
    "price": 30
  },
  "boost": {
    "name": "Boost",
    "category": "Beverages",
    "multi": false,
    "price": 30
  },
  "bournvita": {
    "name": "Bournvita",
    "category": "Beverages",
    "multi": false,
    "price": 30
  },
  "ginger tea": {
    "name": "Ginger Tea",
    "category": "Beverages",
    "multi": false,
    "price": 40
  },
  "ginger lemon tea": {
    "name": "Ginger Lemon Tea",
    "category": "Beverages",
    "multi": false,
    "price": 50
  },
  "green tea": {
    "name": "Green Tea",
    "category": "Hot Tea",
    "multi": false,
    "price": 109
  },
  "normal hot coffee": {
    "name": "Normal Hot Coffee",
    "category": "Beverages",
    "multi": false,
    "price": 30
  },
  "cold coffee": {
    "name": "Classic Cold Coffee",
    "category": "Classic Cold",
    "multi": false,
    "price": 139
  },
  "chocolate cold coffee": {
    "name": "Chocolate Cold Coffee",
    "category": "Classic Cold",
    "multi": false,
    "price": 149
  },
  "hazelnut cold coffee": {
    "name": "Hazelnut Cold Coffee",
    "category": "Classic Cold",
    "multi": false,
    "price": 149
  },
  "cold coffee with vanilla ice cream": {
    "name": "Cold Coffee With Vanilla Ice Cream",
    "category": "Cold Beverages",
    "multi": false,
    "price": 139
  },
  "mint mojito": {
    "name": "Mint Mojito",
    "category": "Mojitos",
    "multi": false,
    "price": 119
  },
  "blue lagoon": {
    "name": "Blue Lagoon",
    "category": "Cold Beverages",
    "multi": false,
    "price": 99
  },
  "lemon soda": {
    "name": "Lemon Soda",
    "category": "Cold Beverages",
    "multi": false,
    "price": 69
  },
  "butterscotch mojito": {
    "name": "Butterscotch Mojito",
    "category": "Cold Beverages",
    "multi": false,
    "price": 99
  },
  "vanilla milk shake": {
    "name": "Vanilla Milk Shake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 109
  },
  "strawberry milkshake": {
    "name": "Strawberry Milkshake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 169
  },
  "butterscotch milkshake": {
    "name": "Butterscotch Milkshake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 119
  },
  "mango milk shake": {
    "name": "Mango Milk Shake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 119
  },
  "chocolate milk shake": {
    "name": "Chocolate Milk Shake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 139
  },
  "orange milk shake": {
    "name": "Orange Milk Shake",
    "category": "Milk Shakes",
    "multi": false,
    "price": 119
  },
  "banana milk shake": {
    "name": "Banana",
    "category": "Milk Shakes",
    "multi": false,
    "price": 179
  },
  "oreo milk shake": {
    "name": "Oreo",
    "category": "Milk Shakes",
    "multi": false,
    "price": 129
  },
  "kit kat milk shake": {
    "name": "Kit Kat",
    "category": "Milk Shakes",
    "multi": false,
    "price": 129
  },
  "just cheese pizza": {
    "name": "Just Cheese Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 159,
    "priceL": 199
  },
  "peri peri paneer pizza": {
    "name": "Peri Peri Paneer Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 179,
    "priceL": 249
  },
  "tandoori paneer pizza": {
    "name": "Tandoori Paneer Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 159,
    "priceL": 219
  },
  "american veggies hot pizza": {
    "name": "American Veggies Hot Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 189,
    "priceL": 239
  },
  "corn pizza": {
    "name": "Corn Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 159,
    "priceL": 209
  },
  "king of margherita": {
    "name": "King Of Margherita",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 159,
    "priceL": 209
  },
  "peppy paneer pizza": {
    "name": "Peppy Paneer Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 109,
    "priceM": 199,
    "priceL": 229
  },
  "veg super pizza": {
    "name": "Veg Super Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 109,
    "priceM": 189,
    "priceL": 229
  },
  "paneer tikka pizza": {
    "name": "Paneer Tikka Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 109,
    "priceM": 179,
    "priceL": 199
  },
  "veg delight pizza": {
    "name": "Veg Delight Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 109,
    "priceM": 199,
    "priceL": 239
  },
  "italian treat pizza": {
    "name": "Italian Treat Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 109,
    "priceM": 189,
    "priceL": 229
  },
  "doctor's pizza": {
    "name": "Doctor's Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 200,
    "priceM": 250,
    "priceL": 250
  },
  "spanish veggies pizza": {
    "name": "Spanish Veggies Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 200,
    "priceM": 250,
    "priceL": 250
  },
  "mexican pizza": {
    "name": "Mexican Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 199,
    "priceM": 249,
    "priceL": 249
  },
  "bbq paneer pizza": {
    "name": "BBQ Paneer Pizza",
    "category": "Pizza",
    "multi": true,
    "priceS": 99,
    "priceM": 169,
    "priceL": 220
  },
  "veg burger": {
    "name": "Veg Burger",
    "category": "Burgers",
    "multi": false,
    "price": 79
  },
  "paneer burger": {
    "name": "Paneer Burger",
    "category": "Burgers",
    "multi": false,
    "price": 139
  },
  "tandoori paneer burger": {
    "name": "Tandoori Paneer Burger",
    "category": "Burgers",
    "multi": false,
    "price": 109
  },
  "corn burger": {
    "name": "Corn Burger",
    "category": "Burgers",
    "multi": false,
    "price": 109
  },
  "veg cheese burger": {
    "name": "Veg Cheese Burger",
    "category": "Burgers",
    "multi": false,
    "price": 109
  },
  "veg classic burger": {
    "name": "Veg Classic Burger",
    "category": "Burgers",
    "multi": false,
    "price": 109
  },
  "bbq paneer burger": {
    "name": "BBQ Paneer Burger",
    "category": "Burgers",
    "multi": false,
    "price": 119
  },
  "veg sandwich": {
    "name": "Veg Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 99
  },
  "veg club sandwich": {
    "name": "Veg Club Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 109
  },
  "veg cheese sandwich": {
    "name": "Veg Cheese Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 109
  },
  "peri peri paneer sandwich": {
    "name": "Peri Peri Paneer Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 129
  },
  "tandoori paneer sandwich": {
    "name": "Tandoori Paneer Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 119
  },
  "burnt garlic mushroom sandwich": {
    "name": "Burnt Garlic Mushroom Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 149
  },
  "masala corn sandwich": {
    "name": "Masala Corn Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 129
  },
  "pizza sandwich": {
    "name": "Pizza Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 199
  },
  "surender sandwich": {
    "name": "Surender Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 99
  },
  "bbq paneer sandwich": {
    "name": "BBQ Paneer Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 109
  },
  "chocolate sandwich": {
    "name": "Chocolate Sandwich",
    "category": "Sandwiches",
    "multi": false,
    "price": 99
  },
  "salted fries": {
    "name": "Salted Fries",
    "category": "Fries",
    "multi": false,
    "price": 109
  },
  "peri peri fries": {
    "name": "Peri Peri Fries",
    "category": "Fries",
    "multi": false,
    "price": 119
  },
  "schezwan fries": {
    "name": "Schezwan Fries",
    "category": "Fries",
    "multi": false,
    "price": 129
  },
  "potato wedges": {
    "name": "Potato Wedges",
    "category": "Fries",
    "multi": false,
    "price": 119
  },
  "garlic pops": {
    "name": "Garlic Pops",
    "category": "Fries",
    "multi": false,
    "price": 99
  },
  "onion rings": {
    "name": "Onion Rings",
    "category": "Fries",
    "multi": false,
    "price": 99
  },
  "smileys": {
    "name": "Smileys",
    "category": "Fries",
    "multi": false,
    "price": 99
  },
  "honey chilli potato": {
    "name": "Honey Chilli Potato",
    "category": "Fries",
    "multi": false,
    "price": 129
  },
  "paneer tikka roll": {
    "name": "Paneer Tikka Roll",
    "category": "Rolls",
    "multi": false,
    "price": 109
  },
  "paneer chilli roll": {
    "name": "Paneer Chilli Roll",
    "category": "Rolls",
    "multi": false,
    "price": 109
  },
  "mexican roll": {
    "name": "Mexican Roll",
    "category": "Rolls",
    "multi": false,
    "price": 109
  },
  "veg roll": {
    "name": "Veg Roll",
    "category": "Rolls",
    "multi": false,
    "price": 109
  },
  "paneer momos fried": {
    "name": "Paneer Momos Fried",
    "category": "Momos",
    "multi": false,
    "price": 99
  },
  "veg momo fried": {
    "name": "Veg Momo Fried",
    "category": "Momos",
    "multi": false,
    "price": 89
  },
  "corn momos fried": {
    "name": "Corn Momos Fried",
    "category": "Momos",
    "multi": false,
    "price": 89
  },
  "veg maggi": {
    "name": "Veg Maggi",
    "category": "Maggi",
    "multi": false,
    "price": 59
  },
  "cheese maggi": {
    "name": "Cheese Maggi",
    "category": "Maggi",
    "multi": false,
    "price": 99
  },
  "peri peri maggi": {
    "name": "Peri Peri Maggi",
    "category": "Maggi",
    "multi": false,
    "price": 79
  },
  "the moras signature maggi": {
    "name": "The Moras Signature Maggi",
    "category": "Maggi",
    "multi": false,
    "price": 99
  },
  "cheese garlic bread": {
    "name": "Cheese Garlic Bread",
    "category": "Garlic Bread",
    "multi": false,
    "price": 109
  },
  "chilli and corn": {
    "name": "Chilli And Corn",
    "category": "Garlic Bread",
    "multi": false,
    "price": 149
  },
  "premium garlic bread (capsicum & onion)": {
    "name": "Premium Garlic Bread (Capsicum & Onion)",
    "category": "Garlic Bread",
    "multi": false,
    "price": 129
  },
  "supreme garlic bread": {
    "name": "Supreme Garlic Bread",
    "category": "Garlic Bread",
    "multi": false,
    "price": 149
  },
  "pizza & coffee combo": {
    "name": "Pizza & Coffee Combo",
    "category": "Combos",
    "multi": false,
    "price": 300
  },
  "double pizza feast": {
    "name": "Double Pizza Feast",
    "category": "Combos",
    "multi": false,
    "price": 459
  },
  "classic burger meal": {
    "name": "Classic Burger Meal",
    "category": "Combos",
    "multi": false,
    "price": 258
  },
  "sandwich & rings combo": {
    "name": "Sandwich & Rings Combo",
    "category": "Combos",
    "multi": false,
    "price": 238
  },
  "strawberry matcha": {
    "name": "Strawberry Matcha",
    "category": "Matcha (Special)",
    "multi": false,
    "price": 249
  },
  "mango matcha": {
    "name": "Mango Matcha",
    "category": "Matcha (Special)",
    "multi": false,
    "price": 249
  },
  "mixedberry matcha": {
    "name": "Mixedberry Matcha",
    "category": "Matcha (Special)",
    "multi": false,
    "price": 259
  },
  "coconut & float matcha": {
    "name": "Coconut & Float Matcha",
    "category": "Matcha (Special)",
    "multi": false,
    "price": 249
  },
  "classic lemonade": {
    "name": "Classic Lemonade",
    "category": "Mojitos",
    "multi": false,
    "price": 99
  },
  "green apple": {
    "name": "Green Apple",
    "category": "Mojitos",
    "multi": false,
    "price": 129
  },
  "green apple mojito": {
    "name": "Green Apple",
    "category": "Mojitos",
    "multi": false,
    "price": 129
  },
  "raspberry": {
    "name": "Raspberry",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "raspberry mojito": {
    "name": "Raspberry",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "rospberry": {
    "name": "Raspberry",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "strawberry mojito": {
    "name": "Strawberry Mojito",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "blue curacao": {
    "name": "Blue Curacao",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "blue curaco": {
    "name": "Blue Curacao",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "blue curacao mojito": {
    "name": "Blue Curacao",
    "category": "Mojitos",
    "multi": false,
    "price": 149
  },
  "kit kat": {
    "name": "Kit Kat",
    "category": "Milk Shakes",
    "multi": false,
    "price": 129
  },
  "oreo": {
    "name": "Oreo",
    "category": "Milk Shakes",
    "multi": false,
    "price": 129
  },
  "blue berry": {
    "name": "Blueberry",
    "category": "Milk Shakes",
    "multi": false,
    "price": 169
  },
  "blueberry": {
    "name": "Blueberry",
    "category": "Milk Shakes",
    "multi": false,
    "price": 169
  },
  "blueberry milkshake": {
    "name": "Blueberry",
    "category": "Milk Shakes",
    "multi": false,
    "price": 169
  },
  "dry fruit": {
    "name": "Dry Fruit",
    "category": "Milk Shakes",
    "multi": false,
    "price": 179
  },
  "dry fruit milkshake": {
    "name": "Dry Fruit",
    "category": "Milk Shakes",
    "multi": false,
    "price": 179
  },
  "banana": {
    "name": "Banana",
    "category": "Milk Shakes",
    "multi": false,
    "price": 179
  },
  "iced americano": {
    "name": "Iced Americano",
    "category": "Classic Cold",
    "multi": false,
    "price": 99
  },
  "iced mocha": {
    "name": "Iced Mocha",
    "category": "Classic Cold",
    "multi": false,
    "price": 159
  },
  "orange espresso": {
    "name": "Orange Espresso",
    "category": "Classic Cold",
    "multi": false,
    "price": 169
  },
  "cranberry espresso": {
    "name": "Cranberry Espresso",
    "category": "Classic Cold",
    "multi": false,
    "price": 169
  },
  "cran berry espresso": {
    "name": "Cranberry Espresso",
    "category": "Classic Cold",
    "multi": false,
    "price": 169
  },
  "espresso tonic": {
    "name": "Espresso Tonic",
    "category": "Classic Cold",
    "multi": false,
    "price": 169
  },
  "coconut iced espresso": {
    "name": "Coconut Iced Espresso",
    "category": "Classic Cold",
    "multi": false,
    "price": 129
  },
  "classic cold coffee": {
    "name": "Classic Cold Coffee",
    "category": "Classic Cold",
    "multi": false,
    "price": 139
  },
  "irish cold coffee": {
    "name": "Irish Cold Coffee",
    "category": "Classic Cold",
    "multi": false,
    "price": 159
  },
  "iced latte": {
    "name": "Iced Latte",
    "category": "Lattes",
    "multi": false,
    "price": 149
  },
  "hazelnut latte": {
    "name": "Hazelnut Latte",
    "category": "Lattes",
    "tempVariant": true,
    "priceHot": 139,
    "priceCold": 159,
    "price": 139
  },
  "spanish latte": {
    "name": "Spanish Latte",
    "category": "Lattes",
    "tempVariant": true,
    "priceHot": 139,
    "priceCold": 179,
    "price": 139
  },
  "vanilla latte": {
    "name": "Vanilla Latte",
    "category": "Lattes",
    "tempVariant": true,
    "priceHot": 129,
    "priceCold": 159,
    "price": 129
  },
  "caramel latte": {
    "name": "Caramel Latte",
    "category": "Lattes",
    "tempVariant": true,
    "priceHot": 139,
    "priceCold": 169,
    "price": 139
  },
  "matcha latte": {
    "name": "Matcha Latte",
    "category": "Lattes",
    "tempVariant": true,
    "priceHot": 189,
    "priceCold": 209,
    "price": 189
  },
  "espresso": {
    "name": "Espresso",
    "category": "Classic Hot",
    "multi": false,
    "price": 59
  },
  "americano": {
    "name": "Americano",
    "category": "Classic Hot",
    "multi": false,
    "price": 99
  },
  "cappuccino": {
    "name": "Cappuccino",
    "category": "Classic Hot",
    "multi": false,
    "price": 109
  },
  "caffe latte": {
    "name": "Caffe Latte",
    "category": "Classic Hot",
    "multi": false,
    "price": 119
  },
  "cortado": {
    "name": "Cortado",
    "category": "Classic Hot",
    "multi": false,
    "price": 99
  },
  "caffe mocha": {
    "name": "Caffe Mocha",
    "category": "Classic Hot",
    "multi": false,
    "price": 129
  },
  "biscoff latte": {
    "name": "Biscoff Latte",
    "category": "Classic Hot",
    "multi": false,
    "price": 149
  },
  "hot chocolate": {
    "name": "Hot Chocolate",
    "category": "Classic Hot",
    "multi": false,
    "price": 159
  },
  "affogato": {
    "name": "Affogato",
    "category": "Classic Hot",
    "multi": false,
    "price": 139
  },
  "lemon iced tea": {
    "name": "Lemon Iced Tea",
    "category": "Iced Tea",
    "multi": false,
    "price": 139
  },
  "peach iced tea": {
    "name": "Peach Iced Tea",
    "category": "Iced Tea",
    "multi": false,
    "price": 149
  },
  "passion fruit ice tea": {
    "name": "Passion Fruit Iced Tea",
    "category": "Iced Tea",
    "multi": false,
    "price": 149
  },
  "passion fruit iced tea": {
    "name": "Passion Fruit Iced Tea",
    "category": "Iced Tea",
    "multi": false,
    "price": 149
  },
  "chamomile tea": {
    "name": "Chamomile Tea",
    "category": "Hot Tea",
    "multi": false,
    "price": 129
  }
};

function normalizeVariant(variant) {
  if (!variant) return '';
  const v = String(variant).trim().toUpperCase();
  if (['S', 'SMALL'].includes(v)) return 'S';
  if (['M', 'MEDIUM'].includes(v)) return 'M';
  if (['L', 'LARGE'].includes(v)) return 'L';
  if (['COLD', 'ICED', 'C', 'I'].includes(v)) return 'Cold';
  if (['HOT', 'H'].includes(v)) return 'Hot';
  return v;
}

function validateAndPriceItem(itemInput) {
  if (!itemInput || typeof itemInput !== 'object') {
    return { valid: false, reason: 'Invalid item data structure' };
  }

  const rawName = String(itemInput.name || '').trim();
  if (!rawName) {
    return { valid: false, reason: 'Item name is required' };
  }

  const key = rawName.toLowerCase();
  const catalogItem = MENU_CATALOG[key];

  if (!catalogItem) {
    return {
      valid: false,
      reason: `Item "${rawName}" is not available on the menu.`,
    };
  }

  const qty = Number(itemInput.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
    return {
      valid: false,
      reason: `Invalid quantity for "${catalogItem.name}". Must be an integer between 1 and 50.`,
    };
  }

  let unitPrice = 0;
  let finalVariant = '';

  if (catalogItem.tempVariant) {
    const rawVariant = String(itemInput.variant || '').trim().toUpperCase();
    if (['COLD', 'ICED', 'C', 'I'].includes(rawVariant)) {
      finalVariant = 'Cold';
      unitPrice = catalogItem.priceCold;
    } else {
      finalVariant = 'Hot';
      unitPrice = catalogItem.priceHot;
    }
  } else if (catalogItem.multi) {
    finalVariant = normalizeVariant(itemInput.variant);
    if (!['S', 'M', 'L'].includes(finalVariant)) {
      return {
        valid: false,
        reason: `Please select a valid size (Small, Medium, Large) for "${catalogItem.name}".`,
      };
    }

    if (finalVariant === 'S') unitPrice = catalogItem.priceS;
    else if (finalVariant === 'M') unitPrice = catalogItem.priceM;
    else if (finalVariant === 'L') unitPrice = catalogItem.priceL;
  } else {
    unitPrice = catalogItem.price;
    finalVariant = '';
  }

  if (typeof unitPrice !== 'number' || isNaN(unitPrice) || unitPrice < 0) {
    return {
      valid: false,
      reason: `Unable to determine price for "${catalogItem.name}".`,
    };
  }

  return {
    valid: true,
    item: {
      name: catalogItem.name,
      variant: finalVariant,
      qty,
      price: unitPrice,
      lineTotal: unitPrice * qty,
    },
  };
}

function calculateOrderTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, reason: 'Order must contain at least one item' };
  }

  if (items.length > 100) {
    return { valid: false, reason: 'Order item limit exceeded (maximum 100 lines)' };
  }

  const validatedItems = [];
  let computedTotal = 0;

  for (let i = 0; i < items.length; i++) {
    const res = validateAndPriceItem(items[i]);
    if (!res.valid) {
      return res;
    }
    validatedItems.push(res.item);
    computedTotal += res.item.lineTotal;
  }

  return {
    valid: true,
    items: validatedItems,
    total: computedTotal,
  };
}

module.exports = {
  MENU_CATALOG,
  validateAndPriceItem,
  calculateOrderTotal,
  normalizeVariant,
};
