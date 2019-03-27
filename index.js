const express = require('express');
const bodyParser = require('body-parser');
const {
  createHash, STATUS, writeFile, readFile, unlink, mkdir,
} = require('./utils');

const app = express();
app.use(bodyParser.json());

app.post('/tasks', (req, res) => {
  const hash = createHash(req.body.source);
  writeFile(`./tasks/${hash}.json`, JSON.stringify({ ...req.body, id: hash }))
    .then(() => {
      res.json({ id: hash, ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.get('/tasks', (req, res) => {
  const { taskId } = req.body;
  readFile(`./tasks/${taskId}.json`, { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/tasks', (req, res) => {
  const { taskId } = req.body;
  unlink(`./tasks/${taskId}.json`)
    .then(() => {
      res.json({ ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.post('/tests', (req, res) => {
  const hash = createHash(JSON.stringify(req.body));
  mkdir(`./tests/${hash}`).then(Promise.all(writeFile(`./tests/${hash}/input.txt`, req.body.input),
    writeFile(`./tests/${hash}/output.txt`, req.body.output)))
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    })
    .then(() => {
      res.json({ id: hash, ...STATUS.ok });
    });
});

app.get('/tests', (req, res) => {
  const { testId } = req.body;
  readFile(`./tests/${testId}.json`, { encoding: 'utf8' })
    .then((data) => {
      res.json({ ...JSON.parse(data), ...STATUS.ok });
    })
    .catch((error) => {
      res.json({ error, ...STATUS.error });
    });
});

app.delete('/tests', (req, res) => {
  const { taskId } = req.body;
  unlink(`./tasks/${taskId}.json`)
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
