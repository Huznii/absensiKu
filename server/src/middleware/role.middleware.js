const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Anda tidak memiliki akses untuk fitur ini.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }
    next();
  };
};

module.exports = { authorize };
