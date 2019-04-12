const path = require('path');
const {
  writeFile, readFile, unlink, mkdir, copyFile,
} = require('fs').promises;
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
} = require('./utils');

const app = express();
app.use(bodyParser.json());

app.post('/solutions', (req, res) => {
  const { source } = req.body;
  const id = createHash(source);
  const sourceFile = getSourcePath(id);
  const metaFile = getMetaPath(id);
  Promise.all([
    mkdir(path.dirname(sourceFile), { recursive: true }),
    mkdir(path.dirname(metaFile), { recursive: true }),
  ])
    .then(
      Promise.all([
        writeFile(sourceFile, source),
        writeFile(metaFile, JSON.stringify({ ...req.body, task: 'compile' })),
      ]),
    )
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    })
    .then(() => {
      res.send({ result: { id }, ...STATUS.ok });
    });
});

app.get('/solutions/:id', (req, res) => {
  const { id } = req.params;
  const metaFile = getMetaPath(id);
  readFile(metaFile)
    .then((data) => {
      res.send({ result: JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.delete('/solutions', (req, res) => {
  const { id } = req.body;
  unlink(getSolutionsDirPath(id))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.post('/tests', (req, res) => {
  const { input, output } = req.body;
  const id = createHash(JSON.stringify(req.body));
  mkdir(getTestsDirPath(id), { recursive: true })
    .then(
      Promise.all([
        writeFile(getTestInputPath(id), input),
        writeFile(getTestOutputPath(id), output),
      ]),
    )
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    })
    .then(() => {
      res.send({ result: { id }, ...STATUS.ok });
    });
});

app.get('/tests/:id', (req, res) => {
  const { id } = req.params;
  readFile(getTestsDirPath(id))
    .then((data) => {
      res.send({ result: JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
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

app.get('/run/:solution&:test', (req, res) => {
  const { solution, test } = req.params;
  const sourceFile = getSourcePath(solution);
  const metaFile = getMetaPath(solution);
  const destDir = getTasksDirPath(solution);
  mkdir(destDir, { recursive: true })
    .then(
      Promise.all([
        writeFile(metaFile, JSON.stringify({ lang: 'java', task: 'run' })),
        copyFile(sourceFile, path.join(destDir, 'Main.java')),
        copyFile(getTestInputPath(test), path.join(destDir, 'input.txt')),
        copyFile(getTestOutputPath(test), path.join(destDir, 'output.txt')),
      ]),
    )
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.listen(PORT, () => console.log(`Codejudge server is listening on port ${PORT}`));
