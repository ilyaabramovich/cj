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
    res.send(meta)
  },

  async postRun (req, res, next) {
    const { submission, test } = req.query
    const submissionDir = getSubmissionsDirPath(submission)
    const testDir = getTestsDirPath(test)
    const { lang, statusCode } = JSON.parse(
      await readFile(path.join(submissionDir, 'meta.json'))
    )
    if (!(statusCode === 0) || !await pathExists(testDir)) {
      return next()
    }
    const id = createHash(submission + test)
    const runDir = getRunsDirPath(id)
    if (await pathExists(runDir)) {
      logger.info('Duplicate run')
      return res.send({ id, ...STATUS.queue })
    }
    const taskDir = getTasksDirPath(id)
    await Promise.all([mkdirp(runDir), mkdirp(taskDir)])
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
        src: testDir,
        dst: taskDir,
        exclude: ['meta.json']
      })
    ])
    res.send({ id, ...STATUS.queue })
  }
}
