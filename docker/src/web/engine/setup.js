'use strict'
const chat = require('./chat.js')
const ww = require('./ww.js')
const process = require('process')

const DEFAULT_PLUGIN_URL="https://github.com/theproductiveprogrammer/desktop-avatar-plugins.git"

/*    way/
 * request the main process to download and setup the
 * plugins that perform our tasks for us
 */
function getPlugins(store, log, cb) {
  chat.say(store, "Getting plugins...", () => {
    let pluginURL = store.get("settings.pluginURL")
    if(!pluginURL) pluginURL = DEFAULT_PLUGIN_URL
    ww.get.plugins(pluginURL)
      .then(() => chat.say(store, "Downloaded latest plugins!", cb))
      .catch(err => {
        log("err/getPlugins", err)
        chat.say(store, "**Error downloading plugins**!\n\nI will notify the developers of this issue. In the meantime you can check the message logs and see if that gives you any ideas.", () => {
          setTimeout(() => process.exit(1), 1000)
        })
      })
  })
}

module.exports = {
  getPlugins,
}
