const crypto = require('crypto');

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex');

module.exports = { createHash };
