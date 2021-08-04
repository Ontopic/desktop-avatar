'use strict'

const db = require('./db.js')
const kc = require('./kafclient.js')
const lg = require('./logger.js')
const plugins = require('./plugins.js')
const users = require('./users.js')
const loc = require('./loc.js')
const util = require('./util.js')
const dh = require('./display-helpers.js')

const store = require('./web/store.js')

const chat = require('./chat.js')
const settings = require('./settings.js')
const login = require('./login.js')

const engine = require('./web/engine/')

/*    understand/
 * main entry point into our program
 */
function main() {
  const log = lg(generateName(), process.env.DEBUG)
  chat.init(store)

  setupFolders(store, err => {
    if(err) return chat.say.foldersFailed(err)

    db.start(log, err => {
      if(err) return chat.say.dbFailed(err)

      log("app/info", `Logging to ${log.getName()}`)

      settings.load(store, err => {
        if(err) {
          chat.say.settingsFailed(err, () => process.exit(1))
        } else {
          login(log, store, err => {
            if(err) chat.say.loginFailed(err, () => process.exit(1))
            else engine.start(log, store)
          })
        }

      })

    })

  })

}

/*    understand/
 * We need a logfile to hold the messages of our current
 * run without interfering with other concurrent runs
 */
function generateName() {
  let n = `log-${(new Date()).toISOString()}-${process.pid}`
  return n.replace(/[/:\\*&^%$#@!()]/g, "_")
}

function setupFolders(store, cb) {
  store.event("msg/add", "setting up folders...")
  util.ensureExists(loc.cookies(), err => {
    if(err) cb(err)
    else {
      util.ensureExists(loc.savedCookies(), e =>{
        if(e) cb(e)
        else util.ensureExists(loc.linkedinCreds(),cb)
      })
    }
  })
}

main()
