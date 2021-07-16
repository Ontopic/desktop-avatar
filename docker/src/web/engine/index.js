'use strict'
const req = require('@tpp/req')
const chat = require('./chat.js')
const setup = require('./setup.js')

/*    understand/
 * the default entry point - starts the engine!
 */
function start(log, store) {
  welcome_1(() => setup_1(() => users_1(() => work_1())))


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
      getUsers(log, store, () => chat.manageUsers(store, cb))
    })
  }

  function work_1(cb) {
    chat.looksGood(store, cb)
  }

  /*
    { call: "setup" },
    setup.getPlugins,
    chat.looksGood,
    chat.gettingUsers,
    users.get,
    chat.noticeReport,
    { call: "sethistory" },
    { call: "dothework" },*/
}

/*    understand/
 * get a list of users information for whom this app
 * is going to do work for
 */
function getUsers(log, store, cb) {
  log("avatar/gettingusers")
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
      log("err/avatar/gettingusers", err)
      cb({
        chat: chat.errGettingUsers(),
        call: "exit"
      })
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
      log("avatar/gotusers", { num: t.length })
      log.trace("avatar/gotusers", t)
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

module.exports = {
  start,
}

