const path = require('path');
const { writeFile, readFile, mkdir } = require('fs').promises;
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
} = require('./utils');

const app = express();
app.use(bodyParser.json());

app.post('/solutions', async (req, res) => {
  const { source, lang } = req.body;
  const id = createHash(JSON.stringify(req.body));
  const solutionsDir = getSolutionsDirPath(id);
  const tasksDir = getTasksDirPath(id);
  try {
    await Promise.all([
      mkdir(solutionsDir, { recursive: true }),
      mkdir(tasksDir, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(path.join(solutionsDir, 'Main.java'), source),
      writeFile(
        path.join(solutionsDir, 'meta.json'),
        JSON.stringify({ id, lang, ...STATUS.queue }),
      ),
      writeFile(path.join(tasksDir, 'meta.json'), JSON.stringify({ id, lang, task: 'compile' })),
    ]);
    res.send({ result: { id }, ...STATUS.queue });
  } catch (error) {
    res.send({ error, ...STATUS.error });
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
  const testsDir = getTestsDirPath(id);
  try {
    await mkdir(testsDir, { recursive: true });
    await Promise.all([
      writeFile(path.join(testsDir, 'input.txt'), input),
      writeFile(path.join(testsDir, 'output.txt'), output),
    ]);
    res.send({ id, ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
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
  const tasksDir = getTasksDirPath(id);
  const runsDir = getRunsDirPath(id);
  const solutionsDir = getSolutionsDirPath(solution);
  try {
    await Promise.all([mkdir(tasksDir, { recursive: true }), mkdir(runsDir, { recursive: true })]);
    const { lang } = JSON.parse(await readFile(path.join(solutionsDir, 'meta.json')));
    await Promise.all([
      writeFile(
        path.join(tasksDir, 'meta.json'),
        JSON.stringify({
          lang,
          task: 'run',
          solution,
          test,
          id,
        }),
      ),
      writeFile(
        path.join(runsDir, 'meta.json'),
        JSON.stringify({
          id,
          lang,
          solution,
          test,
          ...STATUS.queue,
        }),
      ),
      copyFiles({
        src: solutionsDir,
        dst: tasksDir,
        exclude: ['meta.json'],
      }),
      copyFiles({
        src: getTestsDirPath(test),
        dst: tasksDir,
        exclude: ['meta.json'],
      }),
    ]);
    res.send({ ...STATUS.ok });
  } catch (error) {
    res.send({ error, ...STATUS.error });
  }
});

app.listen(PORT, () => console.log(`Codejudge server is listening on port ${PORT}`));
