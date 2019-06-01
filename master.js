const express = require('express')
const morgan = require('morgan')
const winston = require('./config/winston')
const submissions = require('./routes/submissions')
const tests = require('./routes/tests')
const runs = require('./routes/runs')

const app = express()

app.use(express.json())
app.use(morgan('combined', { stream: winston.stream }))
app.use('/submissions', submissions)
app.use('/tests', tests)
app.use('/runs', runs)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // add this line to include winston logging
  winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  res.status(err.status || 500)
  res.send('Something went wrong')
})

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Codejudge server is listening on port ${port}!`))
