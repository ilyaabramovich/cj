const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = './';
const PORT = 3000;

const STATUS = {
  ok: { status: 'ok', statusCode: 0 },
  error: { status: 'error', statusCode: 1 },
};

const getTasksDirPath = id => path.join(ROOT_DIR, `./tasks/${id}`);
const getSolutionsDirPath = id => path.join(ROOT_DIR, `./solutions/${id}`);
const getTestsDirPath = id => path.join(ROOT_DIR, `./tests/${id}`);
const getSourcePath = id => path.join(getSolutionsDirPath(id), '/Main.java');
const getMetaPath = id => path.join(getTasksDirPath(id), '/meta.json');
const getTestInputPath = id => path.join(getTestsDirPath(id), '/input.txt');
const getTestOutputPath = id => path.join(getTestsDirPath(id), '/output.txt');

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex');

module.exports = {
  createHash,
  getSourcePath,
  getMetaPath,
  getTestInputPath,
  getTestOutputPath,
  getSolutionsDirPath,
  getTestsDirPath,
  getTasksDirPath,
  STATUS,
  PORT,
};
