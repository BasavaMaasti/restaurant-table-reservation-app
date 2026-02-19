require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Mongo URI:", process.env.MONGO_URI);

  console.log('Connected to DB, seeding...');

  // Clear existing
  await Promise.all([User.deleteMany(), Restaurant.deleteMany(), Table.deleteMany()]);

  // Create users
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@restaurant.com',
    password: 'Password123!',
    role: 'admin',
    isVerified: true,
  });

  const customer = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
    role: 'customer',
    phone: '+1234567890',
    isVerified: true,
  });

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@restaurant.com',
    password: 'Password123!',
    role: 'super_admin',
    isVerified: true,
  });

  // Create restaurants
  const restaurants = await Restaurant.insertMany([
    {
      name: 'The Green Bistro',
      owner: adminUser._id,
      description: 'A cozy farm-to-table restaurant featuring seasonal ingredients from local farms.',
      cuisine: ['Italian', 'Mediterranean'],
      address: {
        street: '123 Garden Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India',
        location: { type: 'Point', coordinates: [72.8777, 19.0760] },
      },
      priceRange: '$$',
      phone: '+91-22-12345678',
      email: 'info@greenbistro.com',
      features: ['WiFi', 'Outdoor Seating', 'Parking'],
      rating: 4.5,
      totalReviews: 128,
      isActive: true,
      isVerified: true,
      reservationDuration: 90,
      slotInterval: 30,
    },
    {
      name: 'Spice Garden',
      owner: adminUser._id,
      description: 'Authentic Indian cuisine with a modern twist. Experience the flavors of India.',
      cuisine: ['Indian', 'Asian'],
      address: {
        street: '456 Spice Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400002',
        country: 'India',
        location: { type: 'Point', coordinates: [72.8356, 19.1136] },
      },
      priceRange: '$$$',
      phone: '+91-22-87654321',
      email: 'info@spicegarden.com',
      features: ['WiFi', 'Private Dining', 'Valet Parking', 'Bar'],
      rating: 4.7,
      totalReviews: 89,
      isActive: true,
      isVerified: true,
    },
    {
      name: 'Ocean View Grill',
      owner: adminUser._id,
      description: 'Fresh seafood with stunning ocean views. Perfect for romantic dinners.',
      cuisine: ['Seafood', 'Continental'],
      address: {
        street: '789 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400020',
        country: 'India',
        location: { type: 'Point', coordinates: [72.8236, 18.9648] },
      },
      priceRange: '$$$$',
      phone: '+91-22-11223344',
      features: ['WiFi', 'Outdoor Seating', 'Bar', 'Private Dining', 'Live Music'],
      rating: 4.8,
      totalReviews: 203,
      isActive: true,
      isVerified: true,
    },
  ]);

  // Update admin's restaurantId
  await User.findByIdAndUpdate(adminUser._id, { restaurantId: restaurants[0]._id });

  // Create tables for each restaurant
  for (const restaurant of restaurants) {
    const tables = [];
    const sections = ['Indoor', 'Outdoor', 'Private'];
    let tableNum = 1;

    for (const section of sections) {
      const count = section === 'Private' ? 2 : 5;
      for (let i = 0; i < count; i++) {
        const capacity = section === 'Private' ? 8 : [2, 4, 4, 6, 6][i % 5];
        tables.push({
          restaurant: restaurant._id,
          tableNumber: `T${String(tableNum).padStart(2, '0')}`,
          capacity,
          section,
          status: 'available',
          features: section === 'Private' ? ['Private'] : capacity === 2 ? ['Romantic'] : [],
          positionX: (tableNum % 5) * 100,
          positionY: Math.floor(tableNum / 5) * 100,
          shape: capacity <= 4 ? 'round' : 'rectangle',
        });
        tableNum++;
      }
    }

    const createdTables = await Table.insertMany(tables);
    await Restaurant.findByIdAndUpdate(restaurant._id, {
      totalTables: createdTables.length,
      totalCapacity: createdTables.reduce((sum, t) => sum + t.capacity, 0),
    });
  }

  console.log('Seeding complete!');
  console.log('Admin login: admin@restaurant.com / Password123!');
  console.log('Super Admin: superadmin@restaurant.com / Password123!');
  console.log('Customer: john@example.com / Password123!');

  await mongoose.disconnect();
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
