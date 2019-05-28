const path = require('path');
const {
  writeFile, readFile, remove, mkdirp, pathExists,
} = require('fs-extra');

const {
  STATUS,
  createHash,
  getTestsDirPath,
} = require('../utils');
const logger = require('../config/winston');

module.exports = {
  async postTest(req, res) {
    const { input, output } = req.body;
    const id = createHash(input + output);
    const testDir = getTestsDirPath(id);
    const exists = await pathExists(testDir);
    if (exists) {
      logger.info('Recieved duplicate test');
      return res.send({ id, ...STATUS.ok });
    }
    await mkdirp(testDir);
    await Promise.all([
      writeFile(path.join(testDir, 'input.txt'), input),
      writeFile(path.join(testDir, 'output.txt'), output),
    ]);
    return res.send({ id, ...STATUS.ok });
  },

  async getTest(req, res) {
    const { id } = req.params;
    const [input, output] = await Promise.all([
      readFile(path.join(getTestsDirPath(id), 'input.txt'), 'utf8'),
      readFile(path.join(getTestsDirPath(id), 'output.txt'), 'utf8'),
    ]);
    res.send({ input, output, ...STATUS.ok });
  },

  async deleteTest(req, res) {
    await remove(getTestsDirPath(req.params.id));
    res.send({ ...STATUS.ok });
  },
};
