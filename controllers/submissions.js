const path = require('path')
const {
  writeFile, mkdirp, pathExists, remove, createReadStream
} = require('fs-extra')
const {
  STATUS,
  createHash,
  getSubmissionsDirPath,
  getTasksDirPath
} = require('../utils')
const logger = require('../config/winston')

module.exports = {
  async postSubmission (req, res) {
    const { source, lang } = req.body
    const id = createHash(JSON.stringify(source + lang))
    const submissionDir = getSubmissionsDirPath(id)
    const exists = await pathExists(submissionDir)
    if (exists) {
      logger.info('Recieved duplicate submission')
      return res.send({ id, ...STATUS.queue })
    }
    const taskDir = getTasksDirPath(id)
    await Promise.all([
      mkdirp(submissionDir),
      mkdirp(taskDir)
    ])

    await Promise.all([
      writeFile(path.join(submissionDir, 'Main.java'), source),
      writeFile(
        path.join(submissionDir, 'meta.json'),
        JSON.stringify({ id, lang, ...STATUS.queue })
      ),
      writeFile(path.join(taskDir, 'meta.json'), JSON.stringify({ id, lang, task: 'compile' }))
    ])
    return res.send({ id, ...STATUS.queue })
  },

  getSubmission (req, res, next) {
    createReadStream(path.join(getSubmissionsDirPath(req.params.id), 'meta.json')).on('error', err => next(err)).pipe(res)
  },

  async deleteSubmission (req, res) {
    await remove(getSubmissionsDirPath(req.params.id))
    res.send({ ...STATUS.ok })
  }
}
