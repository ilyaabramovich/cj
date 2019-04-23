const { readFile, writeFile } = require('fs').promises;
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const chokidar = require('chokidar');
const path = require('path');
const { exec } = require('child_process');
const {
  getTasksDirPath,
  getRunsDirPath,
  getSolutionsDirPath,
  STATUS,
  logger,
  sleep,
} = require('./utils');

async function updateMeta(dir, patch) {
  const metaFile = path.join(dir, 'meta.json');
  const meta = JSON.parse(await readFile(metaFile));
  return writeFile(metaFile, JSON.stringify({ ...meta, ...patch }));
}

// TODO: добавить больше логирования (подключиь библиотеку для логирования?)
function processTask(dir, meta) {
  const { task, id } = meta;
  let sourceDir;
  let execPath;
  let options;
  return new Promise(async (resolve, reject) => {
    if (task === 'compile') {
      sourceDir = getSolutionsDirPath(id);
      console.log('compiling...');
      execPath = '"C:\\Program Files\\Java\\jdk-11.0.2\\bin\\javac" Main.java';
      options = { cwd: sourceDir };
    } else if (task === 'run') {
      sourceDir = getRunsDirPath(id);
      console.log('running...');
      execPath = '"C:\\Program Files\\Java\\jdk-11.0.2\\bin\\java" Main';
      options = { cwd: dir };
    }
    await updateMeta(sourceDir, STATUS.processing);
    const cp = exec(execPath, options, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        await updateMeta(sourceDir, STATUS.error);
        await rimraf(dir);
        return reject(error);
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      if (task === 'compile') {
        await updateMeta(sourceDir, STATUS.ok);
      } else if (task === 'run') {
        const output = await readFile(path.join(dir, 'output.txt'), 'utf8');
        const checkResult = +(output.trim() === stdout.trim());
        await updateMeta(sourceDir, { checkResult, ...STATUS.ok });
      }
      await rimraf(dir);
      return resolve();
    });
    if (task === 'run') {
      const input = await readFile(path.join(dir, 'input.txt'), 'utf8');
      cp.stdin.write(input);
      cp.stdin.end();
    }
  });
}

async function main() {
  const watcher = chokidar.watch(getTasksDirPath(), { usePolling: true });
  watcher.on('addDir', async (dirName) => {
    console.log(dirName);
    await sleep(1000);
    const meta = JSON.parse(await readFile(path.join(dirName, 'meta.json')));
    console.log(meta);
    await processTask(dirName, meta);
  });
}

main();
