const path = require('path');
const fs = require('fs');

const {
  writeFile, readFile, mkdir, access,
} = fs.promises;
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
  async getRun(req, res, next) {
    const { id } = req.params;
    fs.createReadStream(path.join(getRunsDirPath(id), 'meta.json')).on('error', err => next(err)).pipe(res);
  },
  async postRun(req, res) {
    const { solution, test } = req.query;
    const id = createHash(solution + test);
    const taskDir = getTasksDirPath(id);
    const runDir = getRunsDirPath(id);
    try {
      await access(runDir);
      logger.info('Duplicate run');
      return res.send({ id, ...STATUS.ok });
    } catch (err) {
      const solutionDir = getSolutionsDirPath(solution);

      await Promise.all([mkdir(taskDir, { recursive: true }), mkdir(runDir, { recursive: true })]);
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
      logger.info(`Run ${id} has been added`);
      return res.send({ id, ...STATUS.ok });
    }
  },
};
