
const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

const STATUS = {
  ok: { status: 'ok', statusCode: 0 },
  error: { status: 'error', statusCode: 1 },
};

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex');

module.exports = { createHash, STATUS, writeFile, readFile, unlink, mkdir };
