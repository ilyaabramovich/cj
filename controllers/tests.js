const path = require('path');
const {
  writeFile, readFile, mkdir, access,
} = require('fs').promises;
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
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
    try {
      await access(testDir);
      logger.info('Recieved duplicate test');
      return res.send({ id, ...STATUS.ok });
    } catch (err) {
      await mkdir(testDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(testDir, 'input.txt'), input),
        writeFile(path.join(testDir, 'output.txt'), output),
      ]);
      logger.info(`Test ${id} has been added`);
      return res.send({ id, ...STATUS.ok });
    }
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
    const { id } = req.params;
    await rimraf(getTestsDirPath(id));
    logger.info(`Test ${id} has been deleted`);
    res.send({ ...STATUS.ok });
  },
};
