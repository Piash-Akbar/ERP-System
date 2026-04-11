const asyncHandler = require('../utils/asyncHandler');
const settingService = require('../services/setting.service');
const path = require('path');
const fs = require('fs');

exports.getAll = asyncHandler(async (req, res) => {
  const settings = await settingService.getAll();
  res.json({ success: true, data: settings, message: 'Settings retrieved' });
});

exports.getByGroup = asyncHandler(async (req, res) => {
  const settings = await settingService.getByGroup(req.params.group);
  res.json({ success: true, data: settings, message: 'Settings retrieved' });
});

exports.bulkUpsert = asyncHandler(async (req, res) => {
  const results = await settingService.bulkUpsert(req.body.settings);
  res.json({ success: true, data: results, message: 'Settings updated' });
});

// Public endpoint — returns only theme-related settings (no auth required)
exports.getPublicSettings = asyncHandler(async (req, res) => {
  const keys = ['company_name', 'company_logo', 'app_color', 'dark_mode'];
  const settings = await settingService.getByKeys(keys);
  // Convert array to key-value object
  const result = {};
  settings.forEach((s) => {
    result[s.key] = s.value;
  });
  res.json({ success: true, data: result });
});

// Upload company logo
exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Delete old logo if exists
  const existing = await settingService.getByKey('company_logo');
  if (existing && existing.value) {
    const oldPath = path.join(__dirname, '../../uploads', path.basename(existing.value));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  await settingService.upsert('company_logo', logoUrl, 'general');

  res.json({ success: true, data: { url: logoUrl }, message: 'Logo uploaded successfully' });
});
