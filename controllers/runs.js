const path = require('path')
const {
  writeFile,
  readFile,
  mkdirp,
  pathExists
} = require('fs-extra')
const {
  STATUS,
  createHash,
  getSubmissionsDirPath,
  getTestsDirPath,
  getRunsDirPath,
  getTasksDirPath,
  copyFiles
} = require('../utils')
const logger = require('../config/winston')

module.exports = {
  async getRun (req, res, next) {
    const meta = JSON.parse(await readFile(path.join(getRunsDirPath(req.params.id), 'meta.json')))
    res.send({ ...meta, ...STATUS.ok })
  },

  async postRun (req, res) {
    const { submission, test } = req.query
    const id = createHash(submission + test)
    const taskDir = getTasksDirPath(id)
    const runDir = getRunsDirPath(id)
    const exists = await pathExists(runDir)
    if (exists) {
      logger.info('Duplicate run')
      return res.send({ id, ...STATUS.ok })
    }
    const submissionDir = getSubmissionsDirPath(submission)
    await Promise.all([mkdirp(runDir), mkdirp(taskDir)])
    const { lang } = JSON.parse(
      await readFile(path.join(submissionDir, 'meta.json'))
    )
    await Promise.all([
      writeFile(
        path.join(taskDir, 'meta.json'),
        JSON.stringify({
          lang,
          task: 'run',
          submission,
          test,
          id
        })
      ),
      writeFile(
        path.join(runDir, 'meta.json'),
        JSON.stringify({
          id,
          lang,
          submission,
          test,
          ...STATUS.queue
        })
      ),
      copyFiles({
        src: submissionDir,
        dst: taskDir,
        exclude: ['meta.json']
      }),
      copyFiles({
        src: getTestsDirPath(test),
        dst: taskDir,
        exclude: ['meta.json']
      })
    ])
    return res.send({ id, ...STATUS.queue })
  }
}
