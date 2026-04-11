const { ROLES } = require('../config/constants');

const authorize = (module, permission) => {
  return (req, res, next) => {
    const { user } = req;

    if (!user || !user.role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        statusCode: 403,
      });
    }

    // Super Admin has full access
    if (user.role.name === ROLES.SUPER_ADMIN) {
      return next();
    }

    const modulePermissions = user.role.permissions.find(
      (p) => p.module === module
    );

    if (!modulePermissions || !modulePermissions.actions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action',
        statusCode: 403,
      });
    }

    next();
  };
};

module.exports = { authorize };
