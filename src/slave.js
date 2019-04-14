const { readFile, writeFile } = require('fs').promises;
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const chokidar = require('chokidar');
const path = require('path');
const { exec } = require('child_process');
const {
  getTasksDirPath, getRunsDirPath, getSolutionsDirPath, STATUS,
} = require('./utils');

async function updateMeta(dir, patch) {
  const metaFile = path.join(dir, 'meta.json');
  const meta = JSON.parse(await readFile(metaFile));
  return writeFile(metaFile, JSON.stringify({ ...meta, ...patch }));
}

// TODO: generalize taskCompile & taskRun
// TODO: добавить больше логирования (подключиь библиотеку для логирования?)
function taskCompile(dir, meta) {
  return new Promise(async (resolve, reject) => {
    console.log('compiling...');
    const solutionDir = getSolutionsDirPath(meta.id);
    await updateMeta(solutionDir, STATUS.processing);
    exec(
      '"C:\\Program Files\\Java\\jdk-11.0.2\\bin\\javac" Main.java',
      { cwd: solutionDir },
      async (err, stdout, stderr) => {
        console.log(err, '\n\n', stdout, '\n\n', stderr);
        if (err) {
          await updateMeta(solutionDir, STATUS.error);
          await rimraf(dir);
          return reject(err);
        }
        await updateMeta(solutionDir, STATUS.ok);
        await rimraf(dir);
        return resolve();
      },
    );
  });
}

function taskRun(dir, meta) {
  const runsDir = getRunsDirPath(meta.id);
  console.log('running...');
  return new Promise(async (resolve, reject) => {
    await updateMeta(runsDir, STATUS.processing);
    const cp = exec(
      '"C:\\Program Files\\Java\\jdk-11.0.2\\bin\\java" Main',
      { cwd: dir },
      async (err, stdout, stderr) => {
        const output = await readFile(path.join(dir, 'output.txt'), 'utf8');
        console.log(err, stdout, stderr);
        if (err) {
          await updateMeta(runsDir, STATUS.error);
          await rimraf(dir);
          return reject(err);
        }
        const checkResult = +(output.trim() === stdout.trim());
        await updateMeta(runsDir, { checkResult, ...STATUS.ok });
        await rimraf(dir);
        return resolve();
      },
    );
    const input = await readFile(path.join(dir, 'input.txt'));
    cp.stdin.write(input);
    cp.stdin.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

async function main() {
  const watcher = chokidar.watch(getTasksDirPath(), { usePolling: true });
  watcher.on('addDir', async (fileName) => {
    console.log(fileName);
    await sleep(1000);
    const meta = JSON.parse(await readFile(path.join(fileName, 'meta.json')));
    console.log(meta);
    if (meta.task === 'compile') await taskCompile(fileName, meta);
    else if (meta.task === 'run') await taskRun(fileName, meta);
  });
}

main();
