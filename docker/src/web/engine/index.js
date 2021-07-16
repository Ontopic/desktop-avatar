'use strict'
const chat = require('./chat.js')

/*    understand/
 * the default entry point - starts the engine!
 */
function start(log, store) {
    chat.greeting(store)
  /*
    chat.letsGetStarted,
    { call: "setup" },
    setup.getPlugins,
    chat.looksGood,
    chat.gettingUsers,
    users.get,
    chat.noticeReport,
    { call: "sethistory" },
    { call: "dothework" },*/
}

module.exports = {
  start,
}

