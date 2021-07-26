'use strict'
const kaf = require('kafjs')
const kc = require('./kafclient.js')
const loc = require('./loc.js')
const util = require('./util.js')

/*    way/
 * ensure that the database directory exists then start the kaf db
 */
function start(log, cb) {
  util.ensureExists(loc.db(), err => {
    if(err) cb(err)
    else startKaf(log, cb)
  })
}

/*    problem/
 * We support multiple instances of the SalesBot. At the same
 * time, we don't want them stomping over each other's data.
 *
 *    way/
 * Each avatar attempts to start up a database (actually an event store)
 * on a standard port. If it succeeds, it serves the rest of the
 * instances (including itself). If it fails, it goes to sleep and tries
 * again after sometime - just in case the existing instance is shut
 * down.
 */
function startKaf(log, cb) {
  kaf.startServer(kc.PORT, loc.db(), err => {
    if(err) {
      if(err.code === "EADDRINUSE") {
        setTimeout(start, 5 * 1000)
        cb && cb()
      } else {
        if(cb) cb(err)
        else console.error(err)
      }
    } else {
      log("db/started")
      cb && cb()
    }
  })
}

module.exports = {
  start,
}
