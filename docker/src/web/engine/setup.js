'use strict'
const ww = require('./ww.js')
const chat = require('./chat.js')

function setupServerURL(store, cb) {
  let serverURL = store.get("settings.serverURL")
  if(!serverURL) serverURL = "https://app3.salesbox.ai"
  if(serverURL.endsWith("/")) serverURL = serverURL.substring(0, serverURL.length - 1)
  store.event("serverURL/set", serverURL)
  cb && cb()
}

const DEFAULT_PLUGIN_URL="https://github.com/theproductiveprogrammer/desktop-avatar-plugins.git"

/*    way/
 * request the main process to download and setup the
 * plugins that perform our tasks for us
 */
function getPlugins(store, log, cb) {
  let pluginURL = store.get("settings.pluginURL")
  if(!pluginURL) pluginURL = DEFAULT_PLUGIN_URL
  ww.get.plugins(pluginURL)
    .then(cb)
    .catch(err => {
      log("err/getPlugins", err)
      chat.say(store, `**Error downloading plugins**!
I will notify the developers of this issue.
More details should be available in the log file: ${log.getName()}
`, () => ww.x.it())
    })
}

module.exports = {
  setupServerURL,
  getPlugins,
}
