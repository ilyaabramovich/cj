const path = require('path');
const {
  writeFile, readFile, unlink, mkdir,
} = require('fs').promises;
const express = require('express');
const bodyParser = require('body-parser');
const { createHash, STATUS } = require('./utils');

const app = express();
app.use(bodyParser.json());

const ROOT_DIR = './';

app.post('/solutions', (req, res) => {
  const id = createHash(req.body.source);
  const file = path.join(ROOT_DIR, `./solutions/${id}.json`);
  mkdir(path.dirname(file), { recursive: true })
    .then(() => writeFile(file, JSON.stringify({ id, ...req.body })))
    .then(() => {
      res.json({ result: { id }, ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.get('/solutions', (req, res) => {
  const { id } = req.body;
  readFile(path.join(ROOT_DIR, `./solutions/${id}.json`), { encoding: 'utf8' })
    .then((data) => {
      res.json({ result: { ...JSON.parse(data) }, ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/solutions', (req, res) => {
  const { id } = req.body;
  unlink(path.join(ROOT_DIR, `./solutions/${id}.json`))
    .then(() => {
      res.json({ ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
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
      res.json({ error, ...STATUS.error });
    })
    .then(() => {
      res.json({ id, ...STATUS.ok });
    });
});

app.get('/tests', (req, res) => {
  const { id } = req.body;
  readFile(path.join(ROOT_DIR, `./tests/${id}.json`), { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/tests', (req, res) => {
  const { id } = req.body;
  unlink(path.join(ROOT_DIR, `./tests/${id}.json`))
    .then(() => {
      res.json({ ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.get('/run', (req, res) => {
  res.send();
  // TODO: дописать логику
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
