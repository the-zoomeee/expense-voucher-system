const jwt = require('jsonwebtoken');
const { failure } = require('../utils/response');

// Verifies the JWT and attaches { id, role, name, email } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return failure(res, 401, 'Authentication required. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return failure(res, 401, 'Invalid or expired token.');
  }
}

// Restricts a route to a set of roles, e.g. authorize('director', 'accounts')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return failure(res, 403, 'You do not have permission to perform this action.');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
