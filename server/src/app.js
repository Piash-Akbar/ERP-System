const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/contacts', require('./routes/contact.routes'));
app.use('/api/v1/branches', require('./routes/branch.routes'));
app.use('/api/v1/warehouses', require('./routes/warehouse.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/brands', require('./routes/brand.routes'));
app.use('/api/v1/units', require('./routes/unit.routes'));
app.use('/api/v1/taxes', require('./routes/tax.routes'));
app.use('/api/v1/sales', require('./routes/sale.routes'));
app.use('/api/v1/purchases', require('./routes/purchase.routes'));
app.use('/api/v1/inventory', require('./routes/inventory.routes'));
app.use('/api/v1/accounts', require('./routes/account.routes'));
app.use('/api/v1/transfers', require('./routes/transfer.routes'));
app.use('/api/v1/settings', require('./routes/setting.routes'));
app.use('/api/v1/activity-logs', require('./routes/activityLog.routes'));
app.use('/api/v1/hrm', require('./routes/hrm.routes'));
app.use('/api/v1/leave', require('./routes/leave.routes'));
app.use('/api/v1/cnf', require('./routes/cnf.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/manufacturing', require('./routes/manufacturing.routes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Annex Leather ERP API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
