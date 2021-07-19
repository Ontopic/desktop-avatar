'use strict'
const chat = require('./chat.js')
const setup = require('./setup.js')
const backend = require('./backend.js')
const data = require('./data.js')
const schedule = require('./schedule.js')
const ww = require('./ww.js')

/*    understand/
 * the default entry point - starts the engine!
 */
function start(log, store) {
  const ui = store.get("user.ui")
  if(!ui) return setTimeout(() => start(log, store), 500)

  welcome_1(() => setup_1(() => users_1(() => startdb_1(() => work_1()))))


  function welcome_1(cb) {
    chat.greeting(store, () => chat.letsGetStarted(store, cb))
  }

  function setup_1(cb) {
    chat.checkingSetup(store, () => {
      setup.setupServerURL(store, () => {
        chat.gettingPlugins(store, () => {
          setup.getPlugins(store, log, () => {
            chat.gotPlugins(store, cb)
          })
        })
      })
    })
  }

  function users_1(cb) {
    chat.gettingUsers(store, () => {
      backend.getUsers(log, store, () => chat.manageUsers(store, () => {
        chat.browserSetup(store, () => {
          ww.set.users(store.getUsers())
          cb()
        })
      }))
    })
  }

  function startdb_1(cb) {
    chat.startingDB(store, () => {
      data.start(log, store, () => chat.dbStarted(store, cb))
    })
  }

  function work_1(cb) {
    chat.looksGood(store, cb)
    run(log, store)
  }
}

/*    way/
 * do the tasks and send updates to the server
 */
function run(log, store) {
  const users = store.getUsers()
  const last = {
    nothing: 0,
    gotTasks: 0,
  }
  do_1()
  up_1()


  /*    way/
   * periodically go from user to user, getting the next task to do,
   * fetching tasks from server if we don't have anything locally
   */
  function do_1() {
    const delay = (Math.random() * 1000) + 500

    do_ndx_1(0, performing => {
      if(performing) return

      const now = Date.now()
      if(now - last.gotTasks < 2 * 1000 * 60) return setTimeout(do_1, delay)
      last.gotTasks = now
      chat.gettingTasks(store)
      backend.getTasks(log, store, (err, tasks) => {
        if(err) {
          log("err/getTasks", err)
          chat.say(store, "ERROR: Failed getting tasks from Server!", () => setTimeout(do_1, delay))
        } else {
          if(!tasks || !tasks.length) warn_nothing_1(() => setTimeout(do_1, delay))
          else add_1(tasks, () => setTimeout(do_1, delay))
        }
      })
    })

    function do_ndx_1(ndx, cb) {
      if(ndx >= users.length) return cb()
      const user = users[ndx]
      const tasks = data.get(user)
      const card = schedule.get(tasks, user)
      if(card.type === "performing") return cb(true)
      if(card.type === "too-soon") return do_ndx_1(ndx+1, cb)
      if(card.type === "nothing-to-do") return do_ndx_1(ndx+1, cb)
      if(card.type === "daily-limit-reached") {
        return mark_limit_1(user, card, () => do_ndx_1(ndx+1, cb))
      }
      if(card.type === "task") {
        perform_1(user, card, () => setTimeout(do_1, delay))
        return cb(true)
      }
      do_ndx_1(ndx+1, cb)
    }

  }

  function perform_1(user, card, cb) {
    log("performing/task", { task: card.task })
    data.log("task/status", {
      id: card.task.data.id,
      msg: "task/scheduled",
      code: 101,
    }, user.id, log, store, () => {

      const auth = {
        id: user.id,
        linkedinUsername: user.linkedinUsername,
        linkedinPassword: user.linkedinPassword,
      }
      chat.performing(store, card.task, () => {
        ww.x.cute(auth, card.task.data)
          .then(msg => cb())
          .catch(err => {
            log("err/performing/task", err)
            data.log("task/status", {
              id: card.task.data.id,
              msg: "task/failed",
              code: 500
            }, user.id, log, store, () => chat.errPerforming(store, card.task, cb))
          })
      })

    })
  }

  function mark_limit_1(user, card, cb) {
    data.log("task/status", card.task, user.id, log, store, () => {
      chat.limit(store, card.task, cb)
    })
  }

  function warn_nothing_1(cb) {
    const now = Date.now()
    if(now - last.nothing < 30 * 60 * 1000) return cb()
    last.nothing = now
    chat.nothingToDo(store, cb)
  }

  function add_1(tasks, cb) {
    add_ndx_1(0)

    function add_ndx_1(ndx) {
      if(ndx >= tasks.length) return cb()
      const task = tasks[ndx]
      data.log("task/new", task, task.userId, log, store, () => {
        add_ndx_1(ndx+1)
      })
    }
  }

  /*    way/
   * periodically send user updates to the server
   */
  function up_1() {
    const delay = (Math.random() * 1500) + 500
    const users = store.getUsers()
    send_update_1(0)

    function send_update_1(ndx) {
      if(ndx >= users.length) return setTimeout(up_1, delay)
      const user = users[ndx]
      const tasks = data.get(user)
      const statuses = get_pending_status_updates_1(tasks)
      if(!statuses || !statuses.length) return send_update_1(ndx+1)
      chat.say(store, `Sending updates to server...`)
      backend.sendStatuses(log, store, user, statuses, ok => {
        if(ok) markCompleted(user.id, statuses)
        send_update_1(ndx+1)
      })
    }
  }

  function markCompleted(userid, statuses) {
    statuses.map(s => data.log("task/status", {
      id: s.id,
      msg: "task/completed",
      code: 202
    }, userid, log, store))
  }

  function get_pending_status_updates_1(tasks) {
    const statuses = []
    for(let id in tasks) {
      const task = tasks[id]
      if(task.fin > task.sent) {
        const updt = { id }
        for(let i = 0;i < task.steps.length;i++) {
          const task_ = task.steps[i]
          if(task_.e !== "task/status") continue
          if(!task_.data) continue
          if(task_.data.code < 200) continue
          if(task_.data.code == 202) continue
          updt.status = task_.data.code === 200 ? "success" : "failed"
          if(task_.data.notify) updt.notify = task_.data.notify
          else delete updt.notify
          if(task_.data.notifydata) updt.notifydata = task_.data.notifydata
          else delete updt.notifydata
        }
        statuses.push(updt)
      }
    }
    return statuses
  }

}

module.exports = {
  start,
}

