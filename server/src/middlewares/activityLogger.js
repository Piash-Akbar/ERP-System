const ActivityLog = require('../models/ActivityLog');

const logActivity = (module, action) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Only log successful mutations
      if (data.success && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        try {
          await ActivityLog.create({
            user: req.user?._id,
            action,
            module,
            description: `${action} in ${module}`,
            ipAddress: req.ip,
            metadata: {
              method: req.method,
              path: req.originalUrl,
            },
          });
        } catch (err) {
          console.error('Activity log error:', err.message);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = { logActivity };
