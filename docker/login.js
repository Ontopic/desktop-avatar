'use strict'
const req = require('@tpp/req')

const dh = require('./display-helpers.js')

module.exports = (log, store, cb) => {
  let serverURL = store.get("settings.serverURL")
  if(!serverURL || !serverURL.trim()) return cb(`Please set the 'serverURL' parameter in settings.json`)

  const usr = process.env.SALESBOX_USERNAME
  const pwd = process.env.SALESBOX_PASSWORD
  store.event("msg/add", `Logging in....${dh.anEmoji("password")}`)

  let u = dappURL(serverURL) + "/login"
  req.post(u, { usr, pwd }, (err, resp) => {
    if(err) return cb(err)
    let ui = resp.body
    if(invalid_1(ui)) return cb(`Invalid login: ${JSON.stringify(ui)}`)
    log("login/done", { id:ui.id, usr })
    log.trace("login/info", ui)
    store.event("ui/set", ui)
    cb()
  })

  function invalid_1(resp) {
    return !resp || !resp.authKey
  }
}


function dappURL(u) {
  u = u.trim()
  if(!u.startsWith("http")) {
    if(u[0] == "/") u = "http:/" + u
    else u = "http://" + u
  }
  if(!u.endsWith("/")) u += "/"
  return u + "dapp/v2"
}
