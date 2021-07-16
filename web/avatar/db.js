'use strict'
const kc = require('../../kafclient.js')

const DB = {}

function start(id, log, store) {
  if(DB[id]) return

  const tasks = {}
  DB[id] = tasks

  const name = `User-${id}`
  const ctrl = kc.get(name, resp => {
    for(let i = 0;i < resp.length;i++) {
      if(!process_1(resp[i])) {
        console.error(resp[i])
        ctrl.stop = true
        return
      }
    }
  }, (err, end) => {
    if(err) log(`err/dbstart/${id}`, err)
    if(!end) return 10
    for(let id in tasks) {
      const task = tasks[id]
      if(task.last !== 'closed') console.log(task)
    }
  })

  function process_1(rec) {
    if(rec.e === "task/new") return new_task_1(rec)
    if(rec.e === "task/status") return task_status_1(rec)
  }

  /*    understand/
   * linkedin has urls of the form:
   *    http://www.linkedin.com/profile/view?id=12345678&trk=tab_pro
   * and
   *    www.linkedin.com/in/paige-lorden-doepke-10142b22/
   */
  function get_lead_1(task) {
    const u = task.data.linkedInURL
    if(!u) return
    const p = u.split('/').filter(v => v)
    let v = p[p.length-1]
    let ndx = v.indexOf("?")
    if(ndx !== -1) {
      let vv = v.substring(ndx+1)
      ndx = vv.indexOf("id=")
      if(ndx !== -1) {
        v = vv.substring(ndx+"id=".length)
        ndx = v.indexOf("&")
        if(ndx !== -1) v = v.substring(0, ndx)
      }
    }
    return v
  }

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
      case 423: return task_updt_status_1("fin", "failed/page-updated", task)
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
    return true
  }

  /*    way/
   * if this is a new task, save it against the lead, otherwise just
   * update the time at which we got it to the latest
   */
  function new_task_1(task) {
    const inserted = nsert_1(task, true)
    if(inserted.got < task.t) inserted.got = task.t
    return true
  }
}

function dbStr(DB) {
  return JSON.stringify(DB, (k,v) => {
    if(k === "steps") return v.map(v => JSON.stringify(v).replace(/"/g, ""))
    else return v
  }, 2)
}

module.exports = {
  start,
}
