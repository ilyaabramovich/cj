const path = require('path')
const { readdir, symlink } = require('fs-extra')
const crypto = require('crypto')

const STATUS = {
  ok: { status: 'ok', statusCode: 0 },
  error: { status: 'error', statusCode: 1 },
  queue: { status: 'queue', statusCode: 2 },
  processing: { status: 'processing', statusCode: 3 }
}

const getTasksDirPath = (id = '') => path.join(__dirname, 'tasks', id)
const getSolutionsDirPath = id => path.join(__dirname, 'solutions', id)
const getRunsDirPath = id => path.join(__dirname, 'runs', id)
const getTestsDirPath = id => path.join(__dirname, 'tests', id)

const createHash = data => crypto
  .createHash('sha1')
  .update(data)
  .digest('hex')

const copyFiles = async ({ src, dst, exclude = [] }) => {
  const files = await readdir(src)
  const filesToCopy = files.filter(file => !exclude.includes(file))
  Promise.all(filesToCopy.map(file => symlink(path.join(src, file), path.join(dst, file))))
}

module.exports = {
  STATUS,
  copyFiles,
  createHash,
  getTestsDirPath,
  getTasksDirPath,
  getRunsDirPath,
  getSolutionsDirPath
}
