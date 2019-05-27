const path = require('path');
const {
  writeFile, readFile, mkdir, access,
} = require('fs').promises;
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const {
  STATUS,
  createHash,
  getSolutionsDirPath,
  getTasksDirPath,
} = require('../utils');
const logger = require('../config/winston');

module.exports = {
  async postSolution(req, res) {
    const { source, lang } = req.body;
    const id = createHash(JSON.stringify(source + lang));
    const solutionDir = getSolutionsDirPath(id);
    try {
      await access(solutionDir);
      logger.info('Recieved duplicate solution');
      return res.send({ id, ...STATUS.queue });
    } catch (err) {
      const taskDir = getTasksDirPath(id);
      await Promise.all([
        mkdir(solutionDir, { recursive: true }),
        mkdir(taskDir, { recursive: true }),
      ]);
      await Promise.all([
        writeFile(path.join(solutionDir, 'Main.java'), source),
        writeFile(
          path.join(solutionDir, 'meta.json'),
          JSON.stringify({ id, lang, ...STATUS.queue }),
        ),
        writeFile(path.join(taskDir, 'meta.json'), JSON.stringify({ id, lang, task: 'compile' })),
      ]);
      logger.info(`Solution ${id} has been added`);
      return res.send({ id, ...STATUS.queue });
    }
  },
  async getSolution(req, res) {
    const data = JSON.parse(
      await readFile(path.join(getSolutionsDirPath(req.params.id), 'meta.json')),
    );
    res.send({ data, ...STATUS.ok });
  },
  async deleteSolution(req, res) {
    const { id } = req.params;
    await rimraf(getSolutionsDirPath(id));
    logger.info(`Solution ${id} has been deleted`);
    res.send({ ...STATUS.ok });
  },
};
