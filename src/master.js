const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const {
  createHash, STATUS, writeFile, readFile, unlink, mkdir,
} = require('./utils');

const app = express();
app.use(bodyParser.json());

const { ROOT_DIR } = process.env || './';

app.post('/tasks', (req, res) => {
  const hash = createHash(req.body.source);
  writeFile(path.join(ROOT_DIR, `./tasks/${hash}.json`), JSON.stringify({ ...req.body, id: hash }))
    .then(() => {
      res.json({ id: hash, ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.get('/tasks', (req, res) => {
  const { taskId } = req.body;
  readFile(path.join(ROOT_DIR, `./tasks/${taskId}.json`), { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/tasks', (req, res) => {
  const { taskId } = req.body;
  unlink(path.join(ROOT_DIR, `./tasks/${taskId}.json`))
    .then(() => {
      res.json({ ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.post('/tests', (req, res) => {
  const hash = createHash(JSON.stringify(req.body));
  mkdir(path.join(ROOT_DIR, `./tests/${hash}`))
    .then(
      Promise.all(
        writeFile(path.join(ROOT_DIR, `./tests/${hash}/input.txt`), req.body.input),
        writeFile(path.join(ROOT_DIR, `./tests/${hash}/output.txt`), req.body.output),
      ),
    )
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    })
    .then(() => {
      res.json({ id: hash, ...STATUS.ok });
    });
});

app.get('/tests', (req, res) => {
  const { testId } = req.body;
  readFile(path.join(ROOT_DIR, `./tests/${testId}.json`), { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/tests', (req, res) => {
  const { testId } = req.body;
  unlink(path.join(ROOT_DIR, `./tests/${testId}.json`))
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
