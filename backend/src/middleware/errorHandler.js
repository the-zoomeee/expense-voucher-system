const { failure } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'MulterError' || err.message?.includes('signature images')) {
    return failure(res, 400, err.message);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return failure(res, 409, 'A record with this unique value already exists.');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server.';
  return failure(res, statusCode, message);
}

function notFound(req, res) {
  return failure(res, 404, `Route ${req.originalUrl} not found.`);
}

module.exports = { errorHandler, notFound };
