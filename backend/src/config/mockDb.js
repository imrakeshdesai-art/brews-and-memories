// Mock database for development/testing
let mockOrders = [];
let mockUsers = [{
  email: 'admin@brews-memories.local',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
  role: 'admin'
}];

let orderIdCounter = 1;

class MockUser {
  constructor(data) {
    Object.assign(this, data);
  }

  static findOne(query) {
    const user = mockUsers.find(user => user.email === query.email);
    return Promise.resolve(user ? new MockUser(user) : null);
  }

  static create(data) {
    const user = new MockUser(data);
    mockUsers.push(user);
    return Promise.resolve(user);
  }

  async comparePassword(password) {
    return password === 'brew123'; // Demo password for easy testing
  }
}

class MockOrder {
  static create(data) {
    const order = {
      ...data,
      _id: `mock_${orderIdCounter++}`,
      status: 'pending',
      createdAt: new Date()
    };
    mockOrders.push(order);
    return Promise.resolve(order);
  }

  static find() {
    return Promise.resolve(mockOrders);
  }

  static findByIdAndUpdate(id, update, options = {}) {
    const order = mockOrders.find(o => o._id === id);
    if (order) {
      Object.assign(order, update);
      return Promise.resolve(options.new ? order : null);
    }
    return Promise.resolve(null);
  }
}

module.exports = {
  User: MockUser,
  Order: MockOrder,
  getMockData: () => ({ orders: mockOrders, users: mockUsers })
};