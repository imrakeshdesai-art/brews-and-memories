// Mock database for development/testing (no real DB required)
let mockOrders = [];

let orderIdCounter = 1;

class MockOrder {
  static create(data) {
    const order = {
      ...data,
      _id: `mock_${orderIdCounter++}`,
      status: 'pending',
      createdAt: new Date(),
    };
    mockOrders.push(order);
    return Promise.resolve(order);
  }

  static find() {
    return Promise.resolve([...mockOrders].reverse());
  }

  static findByIdAndUpdate(id, update, options = {}) {
    const order = mockOrders.find((o) => o._id === id);
    if (order) {
      Object.assign(order, update);
      return Promise.resolve(options.new ? order : null);
    }
    return Promise.resolve(null);
  }
}

module.exports = {
  Order: MockOrder,
};
