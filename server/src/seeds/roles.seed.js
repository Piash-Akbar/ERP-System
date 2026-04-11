require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Role = require('../models/Role');
const User = require('../models/User');
const { ROLES, MODULES, PERMISSIONS } = require('../config/constants');

const allPermissions = Object.values(MODULES).map((module) => ({
  module,
  actions: Object.values(PERMISSIONS),
}));

const roles = [
  {
    name: ROLES.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Full system access',
    permissions: allPermissions,
    isDefault: false,
  },
  {
    name: ROLES.ADMIN,
    displayName: 'Admin',
    description: 'Administrative access',
    permissions: allPermissions,
    isDefault: false,
  },
  {
    name: ROLES.SALES_MANAGER,
    displayName: 'Sales Manager',
    description: 'Manages sales operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.SALES, actions: Object.values(PERMISSIONS) },
      { module: MODULES.CONTACTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
    ],
    isDefault: false,
  },
  {
    name: ROLES.PURCHASE_OFFICER,
    displayName: 'Purchase Officer',
    description: 'Manages purchase operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.PURCHASE, actions: Object.values(PERMISSIONS) },
      { module: MODULES.CONTACTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
    ],
    isDefault: false,
  },
  {
    name: ROLES.INVENTORY_MANAGER,
    displayName: 'Inventory Manager',
    description: 'Manages inventory operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: Object.values(PERMISSIONS) },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.TRANSFER, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
    ],
    isDefault: false,
  },
  {
    name: ROLES.ACCOUNTANT,
    displayName: 'Accountant',
    description: 'Manages financial operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.ACCOUNTS, actions: Object.values(PERMISSIONS) },
      { module: MODULES.SALES, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.PURCHASE, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.TRANSFER, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
    ],
    isDefault: false,
  },
  {
    name: ROLES.HR_MANAGER,
    displayName: 'HR Manager',
    description: 'Manages human resources',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.HRM, actions: Object.values(PERMISSIONS) },
      { module: MODULES.LEAVE, actions: Object.values(PERMISSIONS) },
    ],
    isDefault: false,
  },
  {
    name: ROLES.BRANCH_MANAGER,
    displayName: 'Branch Manager',
    description: 'Manages branch operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.SALES, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PURCHASE, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.HRM, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.LOCATIONS, actions: [PERMISSIONS.VIEW] },
    ],
    isDefault: false,
  },
  {
    name: ROLES.STAFF,
    displayName: 'Staff',
    description: 'Basic staff access',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.LEAVE, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
    ],
    isDefault: true,
  },
];

const seedRoles = async () => {
  try {
    await connectDB();
    console.log('Seeding roles...');

    for (const roleData of roles) {
      await Role.findOneAndUpdate({ name: roleData.name }, roleData, {
        upsert: true,
        new: true,
      });
    }
    console.log('Roles seeded successfully');

    // Create Super Admin user if not exists
    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });
    const existingAdmin = await User.findOne({ email: 'admin@annexleather.com' });

    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@annexleather.com',
        password: 'Admin@123',
        role: superAdminRole._id,
      });
      console.log('Super Admin created: admin@annexleather.com / Admin@123');
    } else {
      console.log('Super Admin already exists');
    }

    await mongoose.disconnect();
    console.log('Seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedRoles();
