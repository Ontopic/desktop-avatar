'use strict'
const kc = require('../../kafclient.js')
const ww = require('./ww.js')

const DB = {}

function start(log, store, cb) {
  const users = store.getUsers()
  start_1(0)

  function start_1(ndx) {
    if(ndx >= users.length) return cb()
    startUserDB(users[ndx], log, store, () => start_1(ndx+1))
  }
}

function startUserDB(user, log, store, cb) {
  if(DB[user.id]) return

  const tasks = {}
  DB[user.id] = tasks

  const name = `User-${user.id}`
  log(`trace/engine/db/${name}`, "starting")
  const ctrl = kc.get(name, resp => {
    for(let i = 0;i < resp.length;i++) {
      if(!process(resp[i], tasks, log, store)) {
        ERR(resp[i])
        ctrl.stop = true
        return
      }
    }
  }, (err, end) => {
    if(err) return ERR(err)
    if(!end) return 10
    run(user, log, store)
    cb()
  })

}

function run(user, log, store) {
  const tasks = DB[user.id]
  const name = `User-${user.id}`
  log(`trace/engine/db/${name}`, "running")
  kc.get(name, resp => {
    resp.map(rec => process(rec, tasks, log, store))
  }, err => {
    if(err) return ERR(err)
    return 500 + (Math.random() * 1500)
  })
}

function process(rec, tasks, log, store) {
  if(rec.e === "task/new") return new_task_1(rec)
  if(rec.e === "task/status") return task_status_1(rec)

  function nsert_1(task, create) {
    const id = task.data && task.data.id
    if(!id) {
      log('err/db/task/noid', task)
      return
    }
    const ex = tasks[id]
    if(!ex && create) {
      const inserted = {
        got: "",
        beg: "",
        fin: "",
        sent: "",
        last: "new",
        steps: [ task ],
      }
      tasks[id] = inserted
      return inserted
    }
    ex.steps.push(task)
    return ex
  }

  function task_status_1(task) {
    const code = task.data && task.data.code
    if(!code && code !== 0) {
      log('err/db/task/nocode', task)
      return
    }
    switch(code) {
      case 102: return task_updt_status_1("beg", "started", task)
      case 200: return task_updt_status_1("fin", "successful", task)
      case 202: return task_updt_status_1("sent", "closed", task)
      case 400: return task_updt_status_1("fin", "failed/bad-task", task)
      case 401: return task_updt_status_1("fin", "failed/captcha", task)
      case 403: return task_updt_status_1("fin", "failed/bad-user", task)
      case 424: return task_updt_status_1("fin", "failed/update-needed", task)
      case 500: return task_updt_status_1("fin", "failed/error", task)
      case 501: return task_updt_status_1("fin", "failed/no-plugin", task)
      case 504: return task_updt_status_1("fin", "failed/timeout", task)
    }
    const msg = task.data && task.data.msg
    if(msg === "task/retry") return task_updt_status_1("got", "retry", task)
  }

  function task_updt_status_1(k, msg, task) {
    const inserted = nsert_1(task)
    if(!inserted) {
      log('err/db/task/missing', task)
      return
    }
    inserted.last = msg
    if(inserted[k] < task.t) inserted[k] = task.t
    store.event("status/add", task.data)
    return true
  }

  /*    way/
   * if this is a new task, save it against the lead, otherwise just
   * update the time at which we got it to the latest
   */
  function new_task_1(task) {
    const inserted = nsert_1(task, true)
    if(inserted.got < task.t) inserted.got = task.t
    store.event("task/add", task.data)
    return true
  }
}

/*    understand/
 * helper function to print out the DB in a readable format
 */
function dbStr(DB) {
  return JSON.stringify(DB, (k,v) => {
    if(k === "steps") return v.map(v => JSON.stringify(v).replace(/"/g, ""))
    else return v
  }, 2)
}

function ERR(msg) {
  log("err/engine/db/start", msg)
  chat.say(store, `**DATA ERROR**!
Please check the data file:
    ${name}
for errors.

More details should be available in the log file: ${log.getName()}

`, () => ww.x.it())
}

module.exports = {
  start,
  dbStr,
}
