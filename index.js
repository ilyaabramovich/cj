const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const { createHash } = require('./utils');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

const app = express();
app.use(bodyParser.json());

app.post('/tasks', (req, res) => {
  const hash = createHash(req.body.source);
  writeFile(`./tasks/${hash}.json`, JSON.stringify({ ...req.body, id: hash }))
    .then(() => {
      res.json({ id: hash, status: 'ok', statusCode: 1 });
    })
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    });
});

app.get('/tasks', (req, res) => {
  const { taskId } = req.body;
  readFile(`./tasks/${taskId}.json`, { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), status: 'ok', statusCode: 1 });
    })
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    });
});

app.delete('/tasks', (req, res) => {
  const { taskId } = req.body;
  unlink(`./tasks/${taskId}.json`)
    .then(() => {
      res.json({ statusCode: 1 });
    })
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    });
});

app.post('/tests', (req, res) => {
  const hash = createHash(JSON.stringify(req.body));
  mkdir(`./tests/${hash}`).then(Promise.all(writeFile(`./tests/${hash}/input.txt`, req.body.input),
    writeFile(`./tests/${hash}/output.txt`, req.body.output)))
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    })
    .then(() => {
      res.json({ id: hash, status: 'ok', statusCode: 1 });
    });
});

app.get('/tests', (req, res) => {
  const { testId } = req.body;
  readFile(`./tests/${testId}.json`, { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), status: 'ok', statusCode: 1 });
    })
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    });
});

app.delete('/tests', (req, res) => {
  const { taskId } = req.body;
  unlink(`./tasks/${taskId}.json`)
    .then(() => {
      res.json({ statusCode: 1 });
    })
    .catch((error) => {
      res.json({ error, status: 'error', statusCode: 0 });
    });
});

app.get('/run', (req, res) => {
  res.send();
  // TODO: дописать логику
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
