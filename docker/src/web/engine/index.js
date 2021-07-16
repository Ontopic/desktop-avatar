'use strict'
const chat = require('./chat.js')
const setup = require('./setup.js')
const backend = require('./backend.js')
const data = require('./data.js')

/*    understand/
 * the default entry point - starts the engine!
 */
function start(log, store) {
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
      backend.getUsers(log, store, () => chat.manageUsers(store, cb))
    })
  }

  function startdb_1(cb) {
    chat.startingDB(store, () => {
      data.start(log, store, () => chat.dbStarted(store, cb))
    })
  }

  function work_1(cb) {
    chat.looksGood(store, cb)
    console.log(store.getUsers())
  }
}

module.exports = {
  start,
}

