const path = require('path');
const {
  writeFile, readFile, mkdir, access,
} = require('fs').promises;
const express = require('express');
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const {
  STATUS,
  createHash,
  getSolutionsDirPath,
  getTestsDirPath,
  getRunsDirPath,
  getTasksDirPath,
  copyFiles,
  logger,
} = require('./utils');

const app = express();
app.use(express.json());

app.post('/solutions', async (req, res) => {
  const { source, lang } = req.body;
  const id = createHash(JSON.stringify(req.body));
  const solutionDir = getSolutionsDirPath(id);
  try {
    await access(solutionDir);
    logger.info('Recieved duplicate solution');
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
      logger.info(`Solution ${id} has been added`);
      return res.send({ id, ...STATUS.queue });
    } catch (error) {
      logger.error(`Error while trying to add solution: ${error}`);
      return res.send({ error: 'Something went wrong!', ...STATUS.error });
    }
  }
});

app.get('/solutions/:id', async (req, res) => {
  try {
    const data = JSON.parse(
      await readFile(path.join(getSolutionsDirPath(req.params.id), 'meta.json')),
    );
    res.send({ data, ...STATUS.ok });
  } catch (error) {
    res.status(404).send({ error: 'The solution with the given id was not found.', ...STATUS.error });
  }
});

app.delete('/solutions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await rimraf(getSolutionsDirPath(id));
    logger.info(`Solution ${id} has been deleted`);
    res.send({ ...STATUS.ok });
  } catch (error) {
    logger.error(`Error while trying to delete solution: ${error}`);
    res.status(404).send({ error: 'The solution with the given id was not found.', ...STATUS.error });
  }
});

app.post('/tests', async (req, res) => {
  const { input, output } = req.body;
  const id = createHash(input + output);
  const testDir = getTestsDirPath(id);
  try {
    await access(testDir);
    logger.info('Recieved duplicate test');
    return res.send({ id, ...STATUS.ok });
  } catch (err) {
    try {
      await mkdir(testDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(testDir, 'input.txt'), input),
        writeFile(path.join(testDir, 'output.txt'), output),
      ]);
      logger.info(`Test ${id} has been added`);
      return res.send({ id, ...STATUS.ok });
    } catch (error) {
      logger.error(`Error while trying to add test: ${error}`);
      return res.send({ error: 'Something went wrong!', ...STATUS.error });
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
    res.status(404).send({ error: 'The test with the given id was not found.', ...STATUS.error });
  }
});

app.delete('/tests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await rimraf(getTestsDirPath(id));
    logger.info(`Test ${id} has been deleted`);
    res.send({ ...STATUS.ok });
  } catch (error) {
    logger.error(`Error while trying to delete test: ${error}`);
    res.status(404).send({ error: 'The test with the given id was not found.', ...STATUS.error });
  }
});

app.get('/runs/:id', async (req, res) => {
  const { id } = req.params;
  const meta = path.join(getRunsDirPath(id), 'meta.json');
  try {
    await access(meta);
    res.sendFile(meta);
  } catch (error) {
    logger.error(`Error while trying to get run info: ${error}`);
    res.status(404).send({ error: 'The run with the given id was not found.', ...STATUS.error });
  }
});

app.post('/runs', async (req, res) => {
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
      logger.info(`Run ${id} has been added`);
      return res.send({ id, ...STATUS.ok });
    } catch (error) {
      logger.error(`Error while trying to add run: ${error}`);
      return res.send({ error: 'Something went wrong!', ...STATUS.error });
    }
  }
});

app.listen(3000, () => console.log('Codejudge server is listening on port 3000!'));
