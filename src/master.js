const path = require('path');
const {
  writeFile, readFile, unlink, mkdir, copyFile,
} = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const {
  createHash,
  STATUS,
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
  const id = createHash(req.body.source);
  const sourceFile = getSourcePath(id);
  const metaFile = getMetaPath(id);
  Promise.all([
    mkdir(path.dirname(sourceFile), { recursive: true }),
    writeFile(sourceFile, req.body.source),
    mkdir(path.dirname(metaFile), { recursive: true }),
    writeFile(metaFile, JSON.stringify({ id, lang: 'java' })),
  ])
    .then(() => {
      res.send({ result: { id }, ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.get('/solutions', (req, res) => {
  const { id } = req.body;
  const metaFile = getMetaPath(id);
  readFile(metaFile, { encoding: 'utf8' })
    .then((data) => {
      res.send({ result: { ...JSON.parse(data) }, ...STATUS.ok });
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
  const id = createHash(JSON.stringify(req.body));
  mkdir(getTestsDirPath(id), { recursive: true })
    .then(
      Promise.all(
        writeFile(getTestInputPath(id), req.body.input),
        writeFile(getTestOutputPath(id), req.body.output),
      ),
    )
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    })
    .then(() => {
      res.send({ id, ...STATUS.ok });
    });
});

app.get('/tests', (req, res) => {
  const { id } = req.body;
  readFile(getTestsDirPath(id), { encoding: 'utf8' })
    .then((data) => {
      res.send({ ...JSON.parse(data), ...STATUS.ok });
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

app.get('/run', (req, res) => {
  const { id } = req.body;
  const sourceFile = getSourcePath(id);
  const destDir = getTasksDirPath(id);
  mkdir(destDir, { recursive: true });
  copyFile(sourceFile, path.join(destDir, '/Main.java'))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
