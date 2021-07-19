'use strict'
const { h } = require('@tpp/htm-x')
const dux = require('@tpp/dux')

const store = require('./store.js')
const kc = require('../kafclient.js')
const lg = require('../logger.js')

const toolbar = require('./toolbar.js')
const logview = require('./logview.js')
const login = require('./login.js')
const home = require('./home.js')
const engine = require('./engine/')

import "./main.scss"

/*    understand/
 * main entry point - it all starts here
 *
 *    way/
 * we set up the store to be globally available (for
 * debugging) then get the setting we need from the
 * main process (basically logname and debug/release
 * mode) then set up the log, ui, polling, IPC handlers
 * and finally start up the engine.
 */
function main() {
  window.STORE = store

  window.get.logname().then(({name,DEBUG}) => {
    let log = lg(name, DEBUG)
    showUI(log, store)
    setupPolling(log, store)
    setupTimer(log, store)
    setupIPC(log, store)
    engine.start(log, store)
  })
}

/*    way/
 * shows the toolbar, logview, and footer surrounding the
 * main content which can either be the 'login' page or
 * the 'home' page depending on if we have a user logged
 * in (and hence user info) or not
 */
function showUI(log, store) {
  let cont = h("#cont")
  document.body.appendChild(cont)
  let main = h('.main')
  let footer = h('.footer',
    h('span', [
      "POWERED BY ",
      h("a", {
        href: "https://salesboxai.com/?src=desktop-avatar",
      }, "https://salesboxai.com")
    ])
  )

  cont.c(
    toolbar.e(log, store),
    logview.e(log, store),
    main,
    footer,
  )

  let curr = {}
  store.react('user.ui', ui => {
    if(curr.store) store.destroy(curr.store)

    curr.store = store.ffork()
    if(!ui) {
      window.autologin.getLoginInfo()
      .then((result)=>{
        if(result == null){
         curr.page =  login.e(log, curr.store)
         main.c(curr.page)
         if(document.getElementById("loader"))document.getElementById("loader").remove();
         }else{
          login.auto(log,curr.store,result.username,result.password,()=>{
            curr.page =  login.e(log, curr.store)
            main.c(curr.page)
           })
       } 
      })
     }else{
       curr.page = home.e(ui, log, curr.store)
       main.c(curr.page)
     }
  })

}

/*    way/
 * poll for settings and log updates
 */
function setupPolling(log, store) {
  fetchSettings(log, store)
  fetchLogs(log, store)
}

/*    understand/
 * As part of the interface we show timestamps of messages
 * in the form "3 minutes ago", "1 hour ago" etc. For this
 * to reactivly update we setup a timer that at a
 * reasonable frequency updates the current time
 */
function setupTimer(log, store) {
  store.event("timer/tick", new Date())
  setInterval(() => {
    store.event("timer/tick", new Date())
  }, 4000)
}

/*    understand/
 * here we react to various settings and reflect them back
 * in the main process so it can keep things up to date
 * there as well
 */
function setupIPC(log, store) {
  store.react('user.ui', send_users_1)
  store.react("user.users", send_users_1)

  store.react("settings.userips", uips => {
    window.set.userips(uips)
  })

  store.react("settings.puppetShow", show => {
    window.set.puppetShow(show)
  })

  store.react("settings.timeout", timeout => {
    window.set.pageTimeout(timeout)
  })

  function send_users_1() {
    let ui = store.get('user.ui')
    if(!ui) window.set.users(null)
    else {
      let users = store.getUsers()
      window.set.users(users)
    }
  }
}

/*    way/
 * poll for latest settings
 */
function fetchSettings(log, store) {
  kc.get("settings", latest => {
    store.event("settings/set", latest[latest.length-1])
  }, (err, end) => {
    if(err) console.error(err)
    if(end) return 5 * 1000
    return 500
  })
}

/*    way/
 * poll for any updates to the logs
 */
function fetchLogs(log, store) {
  let logs = []
  kc.get(log.getName(), latest => {
    logs = logs.concat(latest)
    store.event("logs/set", logs)
  }, (err, end) => {
    if(err) console.error(err)
    if(end) return 5 * 1000
    return 200
  })
}

main()
