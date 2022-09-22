'use strict'
const req = require('@tpp/req')
const chat = require('./chat.js')
const ww = require('./ww.js')

/*    understand/
 * get a list of users information for whom this app
 * is going to do work for
 */
function getUsers(log, store, cb) {
  log("backend/gettingusers")
  const serverURL = store.get("settings.serverURL")
  let p = `${serverURL}/dapp/v2/myusers`
  let ui = store.get("user.ui")
  let allowedUsers = get_users_1(store)
  req.post(p, {
    id: ui.id,
    seed: ui.seed,
    authKey: ui.authKey,
    users: allowedUsers
  }, (err, resp) => {
    if(err || !resp || !resp.body) {
      log("err/backend/gettingusers", err)
      chat.say(store, `**FAILED GETTING USERS**
Please check the log file: ${log.getName()} for more details
`, () => ww.x.it())
    } else {
      let users = resp.body
      let t = []
      for(let i=0; i < users.length; i++) {
          if(users[i]['userName']){
            if(!allowedUsers || !allowedUsers.length ||
              allowedUsers.includes(users[i]['userName'].toLowerCase())) t.push(users[i])
          }
      }
      t = remove_duplicate_users_1(t)
      log("backend/gotusers", { num: t.length })
      log.trace("backend/gotusers", t)
      store.event("users/set", t)
      cb && cb()
    }
  })

  function get_users_1(store) {
    let userList = store.get("settings.userList")
    if(!userList) return
    return userList.toLowerCase().trim().replace(/\r?\n|\r/g,'').split(",")
  }

  function remove_duplicate_users_1(userList){
    let uniqueUserList = []
    let idList = []
    for(let i = 0;i<userList.length;i++){
      if(!idList.includes(userList[i].id)){
        idList.push(userList[i].id)
        uniqueUserList.push(userList[i])
      }
    }
    return uniqueUserList
  }

}

function sendStatuses(log, store, user, statusUpdates, cb) {
  log("trace/backend/sendstatus")
  const serverURL = store.get("settings.serverURL")
  let p = `${serverURL}/dapp/v2/status`

  req.post(p, {
    id: user.id,
    seed: user.seed,
    authKey: user.authKey,
    statusUpdates,
  }, (err, resp) => {
    if(err) {
      log("err/sendStatuses", err)
      return cb(false)
    }
    return cb(true)
  })

}

function sendNavSync(log, store, user, status, cb) {
  log("trace/backend/sendnavsync")
  const serverURL = store.get("settings.serverURL")
  let p = `${serverURL}/dapp/v2/navsync`
  let result = {
    id: status.id,
    seed: user.seed,
    authKey: user.authKey,
    navSyncUpdates :[
      {
        id : status.id,
        listID: status.syncdata.listID,
        status: status.status,
        leadDetails: status.syncdata.leaddetails,
        accDetails: status.syncdata.accdetails
      }
    ]
  }
  req.post(p, result, (err, resp) => {
    if(err) {
      log("err/sendnavsync", err)
      return cb(false)
    }
    return cb(true)
  })
}

function getTasks(log, store, cb) {
  log("trace/backend/gettasks")
  const ui = store.get("user.ui")
  const users = store.getUsers()
  const forUsers = users.map(ui => {
    return {
      id: ui.id, seed: ui.seed, authKey: ui.authKey
    }
  })

  const serverURL = store.get("settings.serverURL")
  const p = `${serverURL}/dapp/v2/tasks`
  req.post(p, {
    id: ui.id,
    seed: ui.seed,
    authKey: ui.authKey,
    forUsers,
  }, (err, resp) => {
    if(err) return cb(err)
    let tasks = resp.body || []
    log("trace/backend/gettasks", { num: tasks.length })
    cb(null, tasks)
  })
}

module.exports = {
  getUsers,
  sendStatuses,
  getTasks,
  sendNavSync
}
