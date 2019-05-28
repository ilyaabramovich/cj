const path = require('path');
const {
  writeFile, readFile, mkdirp, createReadStream, pathExists,
} = require('fs-extra');
const {
  STATUS,
  createHash,
  getSolutionsDirPath,
  getTestsDirPath,
  getRunsDirPath,
  getTasksDirPath,
  copyFiles,
} = require('../utils');
const logger = require('../config/winston');

module.exports = {
  getRun(req, res, next) {
    createReadStream(path.join(getRunsDirPath(req.params.id), 'meta.json')).on('error', err => next(err)).pipe(res);
  },

  async postRun(req, res) {
    const { solution, test } = req.query;
    const id = createHash(solution + test);
    const taskDir = getTasksDirPath(id);
    const runDir = getRunsDirPath(id);
    const exists = await pathExists(runDir);
    if (exists) {
      logger.info('Duplicate run');
      return res.send({ id, ...STATUS.ok });
    }
    const solutionDir = getSolutionsDirPath(solution);
    await Promise.all([
      mkdirp(runDir),
      mkdirp(taskDir),
    ]);
    const { lang } = JSON.parse(await readFile(path.join(solutionDir, 'meta.json')));
    await Promise.all([
      writeFile(
        path.join(taskDir, 'meta.json'),
        JSON.stringify({
          lang,
          task: 'run',
          solution,
          test,
          id,
        }),
      ),
      writeFile(
        path.join(runDir, 'meta.json'),
        JSON.stringify({
          id,
          lang,
          solution,
          test,
          ...STATUS.queue,
        }),
      ),
      copyFiles({
        src: solutionDir,
        dst: taskDir,
        exclude: ['meta.json'],
      }),
      copyFiles({
        src: getTestsDirPath(test),
        dst: taskDir,
        exclude: ['meta.json'],
      }),
    ]);
    return res.send({ id, ...STATUS.ok });
  },
};
