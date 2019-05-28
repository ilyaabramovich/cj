const path = require('path');
const {
  writeFile, mkdirp, pathExists, remove, createReadStream,
} = require('fs-extra');
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
    const exists = await pathExists(solutionDir);
    if (exists) {
      logger.info('Recieved duplicate solution');
      return res.send({ id, ...STATUS.queue });
    }
    const taskDir = getTasksDirPath(id);
    await Promise.all([
      mkdirp(solutionDir),
      mkdirp(taskDir),
    ]);

    await Promise.all([
      writeFile(path.join(solutionDir, 'Main.java'), source),
      writeFile(
        path.join(solutionDir, 'meta.json'),
        JSON.stringify({ id, lang, ...STATUS.queue }),
      ),
      writeFile(path.join(taskDir, 'meta.json'), JSON.stringify({ id, lang, task: 'compile' })),
    ]);
    return res.send({ id, ...STATUS.queue });
  },
  getSolution(req, res, next) {
    createReadStream(path.join(getSolutionsDirPath(req.params.id), 'meta.json')).on('error', err => next(err)).pipe(res);
  },
  async deleteSolution(req, res) {
    const { id } = req.params;
    await remove(getSolutionsDirPath(id));
    res.send({ ...STATUS.ok });
  },
};
