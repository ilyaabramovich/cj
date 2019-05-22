const path = require('path');
const { readdir, symlink } = require('fs').promises;
const crypto = require('crypto');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'cj' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.File({
      filename: 'error.log',
      level: 'error',
    }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
    ),
  }));
}

const ROOT_DIR = path.join(__dirname, '..');

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
  await Promise.all(filesToCopy.map(file => symlink(path.join(src, file), path.join(dst, file))));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

module.exports = {
  createHash,
  sleep,
  getSolutionsDirPath,
  getTestsDirPath,
  getTasksDirPath,
  getRunsDirPath,
  copyFiles,
  STATUS,
  logger,
  ROOT_DIR,
};
