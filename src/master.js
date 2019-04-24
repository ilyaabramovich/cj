const path = require('path');
const {
  writeFile, readFile, mkdir, access,
} = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const {
  STATUS,
  PORT,
  createHash,
  getSolutionsDirPath,
  getTestsDirPath,
  getRunsDirPath,
  getTasksDirPath,
  copyFiles,
  logger,
} = require('./utils');

const app = express();
app.use(bodyParser.json());

app.post('/solutions', async (req, res) => {
  const { source, lang } = req.body;
  const id = createHash(JSON.stringify(req.body));
  const solutionDir = getSolutionsDirPath(id);
  try {
    await access(solutionDir);
    logger.info('Duplicate solution');
    return res.send({ id, ...STATUS.queue });
  } catch (err) {
    const taskDir = getTasksDirPath(id);
    try {
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
      return res.send({ id, ...STATUS.queue });
    } catch (error) {
      return res.send({ error, ...STATUS.error });
    }
  }
});

app.get('/solutions/:id', async (req, res) => {
  try {
    const data = JSON.parse(await readFile(path.join(getTasksDirPath(req.params.id), 'meta.json')));
    res.send({ data, ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
  }
});

app.delete('/solutions/:id', async (req, res) => {
  try {
    await rimraf(getSolutionsDirPath(req.params.id));
    res.send({ ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
  }
});

app.post('/tests', async (req, res) => {
  const { input, output } = req.body;
  const id = createHash(input + output);
  const testDir = getTestsDirPath(id);
  try {
    await access(testDir);
    logger.info('Duplicate test');
    return res.send({ id, ...STATUS.ok });
  } catch (err) {
    try {
      await mkdir(testDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(testDir, 'input.txt'), input),
        writeFile(path.join(testDir, 'output.txt'), output),
      ]);
      logger.info('Test has been added');
      return res.send({ id, ...STATUS.ok });
    } catch (error) {
      logger.error('Error while trying to add new test', error);
      return res.send({ error, ...STATUS.error });
    }
  }
});

app.get('/tests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [input, output] = await Promise.all([
      readFile(path.join(getTestsDirPath(id), 'input.txt'), 'utf8'),
      readFile(path.join(getTestsDirPath(id), 'output.txt'), 'utf8'),
    ]);
    res.send({ input, output, ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
  }
});

app.delete('/tests/:id', async (req, res) => {
  try {
    await rimraf(getTestsDirPath(req.params.id));
    res.send({ ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
  }
});

app.get('/run', async (req, res) => {
  const { solution, test } = req.query;
  const id = createHash(solution + test);
  const taskDir = getTasksDirPath(id);
  const runDir = getRunsDirPath(id);
  try {
    await access(runDir);
    logger.info('Duplicate run');
    return res.send({ ...STATUS.ok });
  } catch (err) {
    const solutionDir = getSolutionsDirPath(solution);
    try {
      await Promise.all([mkdir(taskDir, { recursive: true }), mkdir(runDir, { recursive: true })]);
      const { lang } = JSON.parse(await readFile(path.join(solutionDir, 'meta.json')));
      await Promise.all([
        writeFile(
          path.join(taskDir, 'meta.json'),
          JSON.stringify({
            lang,
            task: 'run',
            solution,
            test,
            id,
          }),
        ),
        writeFile(
          path.join(runDir, 'meta.json'),
          JSON.stringify({
            id,
            lang,
            solution,
            test,
            ...STATUS.queue,
          }),
        ),
        copyFiles({
          src: solutionDir,
          dst: taskDir,
          exclude: ['meta.json'],
        }),
        copyFiles({
          src: getTestsDirPath(test),
          dst: taskDir,
          exclude: ['meta.json'],
        }),
      ]);
      return res.send({ ...STATUS.ok });
    } catch (error) {
      return res.send({ error, ...STATUS.error });
    }
  }
});

app.listen(PORT, () => logger.info(`Codejudge server is listening on port ${PORT}`));
