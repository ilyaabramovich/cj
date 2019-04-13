const path = require('path');
const { writeFile, readFile, unlink, mkdir } = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const {
  STATUS,
  PORT,
  createHash,
  getSourcePath,
  getMetaPath,
  getTestInputPath,
  getTestOutputPath,
  getSolutionsDirPath,
  getTestsDirPath,
  getTasksDirPath,
  copyFiles,
} = require('./utils');

const app = express();
app.use(bodyParser.json());

app.post('/solutions', (req, res) => {
  const { source } = req.body;
  const id = createHash(JSON.stringify(req.body));
  const dir = getSolutionsDirPath(id);
  const taskDir = getTasksDirPath(id);
  mkdir(dir, { recursive: true })
    .then(() =>
      Promise.all([
        writeFile(path.join(dir, 'Main.java'), source),
        writeFile(
          path.join(dir, 'meta.json'),
          JSON.stringify({ id, lang: req.body.lang, ...STATUS.queue })
        ),
      ])
    )
    .then(() =>
      mkdir(taskDir, { recursive: true }).then(() =>
        writeFile(
          path.join(taskDir, 'meta.json'),
          JSON.stringify({ id, lang: req.body.lang, task: 'compile' })
        )
      )
    )
    .then(() => {
      res.send({ result: { id }, ...STATUS.queue });
    })
    .catch(error => {
      res.send({ error, ...STATUS.error });
    });
});

app.get('/solutions/:id', (req, res) => {
  const { id } = req.params;
  const metaFile = getMetaPath(id);
  readFile(metaFile)
    .then(data => {
      res.send({ result: JSON.parse(data), ...STATUS.ok });
    })
    .catch(error => {
      res.send({ error, ...STATUS.error });
    });
});

app.delete('/solutions', (req, res) => {
  const { id } = req.body;
  unlink(getSolutionsDirPath(id))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch(error => {
      res.send({ error, ...STATUS.error });
    });
});

app.post('/tests', (req, res) => {
  const { input, output } = req.body;
  const id = createHash(JSON.stringify(req.body));
  mkdir(getTestsDirPath(id), { recursive: true })
    .then(() =>
      Promise.all([
        writeFile(getTestInputPath(id), input),
        writeFile(getTestOutputPath(id), output),
      ])
    )
    .catch(error => {
      res.send({ error, ...STATUS.error });
    })
    .then(() => {
      res.send({ result: { id }, ...STATUS.ok });
    });
});

app.get('/tests/:id', (req, res) => {
  const { id } = req.params;
  readFile(getTestsDirPath(id))
    .then(data => {
      res.send({ result: JSON.parse(data), ...STATUS.ok });
    })
    .catch(error => {
      res.send({ error, ...STATUS.error });
    });
});

app.delete('/tests', (req, res) => {
  const { id } = req.body;
  unlink(getTestsDirPath(id))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.get('/run', (req, res) => {
  const { solution, test } = req.query;
  const id = createHash(solution + test);
  const destDir = getTasksDirPath(id);
  // TODO: создавать runs/{id} здесь (и помещать STATUS - queue)
  mkdir(destDir, { recursive: true })
    .then(
      Promise.all([
        writeFile(
          path.join(destDir, 'meta.json'),
          // TODO: читать lang из solution
          JSON.stringify({ lang: 'java', task: 'run', solution, test, id })
        ), 
        copyFiles({
          src: getSolutionsDirPath(solution),
          dst: destDir,
          exclude: ['meta.json'],
        }),
        copyFiles({
          src: getTestsDirPath(test),
          dst: destDir,
          exclude: ['meta.json'],
        }),
      ])
    )
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch(error => {
      res.send({ error, ...STATUS.error });
    });
});

app.listen(PORT, () =>
  console.log(`Codejudge server is listening on port ${PORT}`)
);
