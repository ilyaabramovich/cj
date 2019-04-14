const path = require('path');
const { readdir, symlink } = require('fs').promises;
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const PORT = 3000;

const STATUS = {
  ok: { status: 'ok', statusCode: 0 },
  error: { status: 'error', statusCode: 1 },
  queue: { status: 'queue', statusCode: 2 },
  processing: { status: 'processing', statusCode: 3 },
};

const getTasksDirPath = (id = '.') => path.join(ROOT_DIR, 'tasks', id);
const getSolutionsDirPath = id => path.join(ROOT_DIR, 'solutions', id);
const getRunsDirPath = id => path.join(ROOT_DIR, 'runs', id);
const getTestsDirPath = id => path.join(ROOT_DIR, 'tests', id);

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex');

async function copyFiles({ src, dst, exclude = [] }) {
  const files = await readdir(src);
  const filesToCopy = files.filter(file => !exclude.includes(file));
  await Promise.all(
    filesToCopy.map(file => symlink(path.join(src, file), path.join(dst, file))),
  );
}

module.exports = {
  createHash,
  getSolutionsDirPath,
  getTestsDirPath,
  getTasksDirPath,
  getRunsDirPath,
  copyFiles,
  STATUS,
  PORT,
};
