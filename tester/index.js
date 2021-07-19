'use strict'
const express = require('express')
const app = express()
const babydb = require('baby-db')
const cors = require('cors')

const port = 5555

const users = require('./users.js')
const tasks = require('./tasks.js')

app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.post('/user/add', (req, res) => {
  o('adding user', req.body)
  users.add(req.body)
  res.end()
})

app.post('/dapp/v2/login', (req, res) => {
  o('logging in', req.body)
  const ui = users.login(req.body)
  if(!ui) res.status(400).end()
  else res.send(ui)
})

app.post('/dapp/v2/myusers', (req, res) => {
  o('fetching users to manage', req.body)
  res.send("[]")
})

app.post('/tasks/add', (req, res) => {
  o('adding task', req.body)
  tasks.add(req.body)
  res.end()
})

app.post('/dapp/v2/tasks', (req, res) => {
  o('getting tasks', req.body)
  const users = req.body.forUsers
  if(!users) res.status(400).end()
  else res.send(tasks.getFor(users.map(u => u.id)))
})

app.post('/dapp/v2/status', (req, res) => {
  o('updating status', req.body)
  const statusUpdates = req.body.statusUpdates
  if(!statusUpdates) res.status(400).end()
  else {
    tasks.updateStatus(statusUpdates)
    res.end()
  }
})

app.use('/', (req, res, next) => {
  console.log('UNHANDLED REQUEST:', `${req.originalUrl} ${req.method}`)
  console.log(req.body)
  next()
})

function o(msg, data) { console.log(`${msg}: ${JSON.stringify(data)}`) }

babydb.onExitSignal(() => process.exit())

users.ondone(ondbLoaded)
tasks.ondone(ondbLoaded)

let num_db_loaded = 0
function ondbLoaded() {
  num_db_loaded++
  if(num_db_loaded === babydb.numdb()) app.listen(port, () => console.log(`Listening at port ${port}...`))
}
