const path = require('path');
const {
  writeFile, readFile, unlink, mkdir, symlink,
} = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const { createHash, STATUS } = require('./utils');

const app = express();
app.use(bodyParser.json());

const ROOT_DIR = './';

app.post('/solutions', (req, res) => {
  const id = createHash(req.body.source);
  const sourceFile = path.join(ROOT_DIR, `./solutions/${id}/Main.java`);
  const metaFile = path.join(ROOT_DIR, `./solutions/${id}/meta.json`);
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
  readFile(path.join(ROOT_DIR, `./solutions/${id}/meta.json`), { encoding: 'utf8' })
    .then((data) => {
      res.send({ result: { ...JSON.parse(data) }, ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.delete('/solutions', (req, res) => {
  const { id } = req.body;
  unlink(path.join(ROOT_DIR, `./solutions/${id}.json`))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.post('/tests', (req, res) => {
  const id = createHash(JSON.stringify(req.body));
  mkdir(path.join(ROOT_DIR, `./tests/${id}`), { recursive: true })
    .then(
      Promise.all(
        writeFile(path.join(ROOT_DIR, `./tests/${id}/input.txt`), req.body.input),
        writeFile(path.join(ROOT_DIR, `./tests/${id}/output.txt`), req.body.output),
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
  readFile(path.join(ROOT_DIR, `./tests/${id}.json`), { encoding: 'utf8' })
    .then((data) => {
      res.send({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.delete('/tests', (req, res) => {
  const { id } = req.body;
  unlink(path.join(ROOT_DIR, `./tests/${id}.json`))
    .then(() => {
      res.send({ ...STATUS.ok });
    })
    .catch((error) => {
      res.send({ error, ...STATUS.error });
    });
});

app.get('/run', (req, res) => {
  const { id } = req.body;
  const file = path.join(ROOT_DIR, `./solutions/${id}.json`);
  symlink(file);
  res.send();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
