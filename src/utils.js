const crypto = require('crypto');

const STATUS = {
  ok: { status: 'ok', statusCode: 0 },
  error: { status: 'error', statusCode: 1 },
};

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex');

module.exports = {
  createHash,
  STATUS,
};
