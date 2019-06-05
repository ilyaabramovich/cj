const { readFile, writeFile, remove } = require('fs-extra')
const chokidar = require('chokidar')
const path = require('path')
const { spawn } = require('child_process')
const {
  getTasksDirPath,
  getRunsDirPath,
  getSubmissionsDirPath,
  STATUS
} = require('./utils')
const logger = require('./config/winston')

async function updateMeta (dir, patch) {
  const metaFile = path.join(dir, 'meta.json')
  const meta = JSON.parse(await readFile(metaFile))
  return writeFile(metaFile, JSON.stringify({ ...meta, ...patch }))
}

function processTask (dir, meta) {
  logger.info('Processing task:', meta)
  const { task, id } = meta
  let sourceDir, args, options
  return new Promise(async (resolve, reject) => {
    if (task === 'compile') {
      sourceDir = getSubmissionsDirPath(id)
      logger.info('compiling...')
      args = `-Q --cwd=${sourceDir} --config ${__dirname}/java.cfg -- /usr/bin/javac ${sourceDir}/Main.java`
      options = { cwd: sourceDir }
    } else if (task === 'run') {
      sourceDir = getRunsDirPath(id)
      logger.info('running...')
      args = `-Q --cwd=${dir} --config ${__dirname}/java.cfg -- /usr/bin/java -cp ${dir} Main`
      options = { cwd: dir }
    }
    await updateMeta(sourceDir, STATUS.processing)
    const chunks = []
    const errorChunks = []
    let output, error
    const cp = spawn('nsjail', args.split(' '), options)
    if (task === 'run') {
      const input = await readFile(path.join(dir, 'input.txt'), 'utf8')
      cp.stdin.write(input)
      cp.stdin.end()
    }
    cp.stderr.on('data', chunk => {
      errorChunks.push(chunk)
    })
    cp.stderr.on('end', async () => {
      error = Buffer.concat(errorChunks).toString()
    })
    cp.stdout.on('data', chunk => {
      chunks.push(chunk)
    })
    cp.stdout.on('end', async () => {
      output = Buffer.concat(chunks).toString()
    })
    cp.on('exit', async (code) => {
      if (code === 0) {
        switch (task) {
          case 'compile':
            await updateMeta(sourceDir, STATUS.ok)
            break
          case 'run':
            const expectedOutput = await readFile(path.join(dir, 'output.txt'), 'utf8')
            const checkResult = Number(expectedOutput.trim() === output.trim())
            await updateMeta(sourceDir, { checkResult, ...STATUS.ok })
            break
          default:
            break
        }
      } else {
        logger.error(error)
        await updateMeta(sourceDir, { error, ...STATUS.error })
      }
      await remove(dir)
    })
  })
}

async function main () {
  console.log('Slave is running!')
  const watcher = chokidar.watch(getTasksDirPath(), {
    usePolling: true,
    interval: 100,
    ignoreInitial: true,
    ignored: /[/\\]\./,
    persistent: true
  })
  watcher
    .on('addDir', async (dirName) => {
      const meta = JSON.parse(await readFile(path.join(dirName, 'meta.json')))
      try {
        await processTask(dirName, meta)
      } catch (error) {
      }
    })
    .on('error', error => logger.error(`Watcher error: ${error}`))
}

main()
