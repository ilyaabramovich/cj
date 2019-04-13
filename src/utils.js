/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT_DIR = 'C:\\cj';
const PORT = 3000;

const STATUS = {
  ok: { status: 'ok', statusCode: 0 }, // queued,
  error: { status: 'error', statusCode: 1 },
  queue: { status: 'queue', statusCode: 2 },
  processing: { status: 'processing', statusCode: 3 },
};

// TODO: удалить неиспользуемые функции
const getTasksDirPath = (id='.') => path.join(ROOT_DIR, 'tasks', id);
const getSolutionsDirPath = id => path.join(ROOT_DIR, `./solutions/${id}/`);
const getRunsDirPath = id => path.join(ROOT_DIR, 'runs', id);
const getTestsDirPath = id => path.join(ROOT_DIR, `./tests/${id}/`);
const getSourcePath = id => path.join(getSolutionsDirPath(id), 'Main.java');
const getMetaPath = id => path.join(getTasksDirPath(id), 'meta.json');
const getTestInputPath = id => path.join(getTestsDirPath(id), 'input.txt');
const getTestOutputPath = id => path.join(getTestsDirPath(id), 'output.txt');

const createHash = data =>
  crypto
    .createHash('sha1')
    .update(data)
    .digest('hex');



async function copyFiles({ src, dst, exclude = [] }) {
  const files = await fs.promises.readdir(src);
  const filesToCopy = files.filter(file => !exclude.includes(file));
  // eslint-disable-next-line prefer-const
  for (let file of filesToCopy) {
    // eslint-disable-next-line no-await-in-loop
    await fs.promises.symlink(path.join(src, file), path.join(dst, file));
  }
}
// taskId

module.exports = {
  createHash,
  getSourcePath,
  getMetaPath,
  getTestInputPath,
  getTestOutputPath,
  getSolutionsDirPath,
  getTestsDirPath,
  getTasksDirPath,
  getRunsDirPath,
  STATUS,
  PORT,
  copyFiles,
};
