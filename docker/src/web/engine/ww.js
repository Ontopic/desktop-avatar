'use strict'

const plugins = require('../../plugins.js')
const users = require('../../users.js')



/*    understand/
 * because the avatar engine is used both in the browser and in the
 * server version, this is a wrapper that hooks into what would have
 * been global 'window' calls in the browser version. These calls are
 * for IPC communication with electron so we just do what they need
 * directly in this server version
 */
module.exports = {
  x: {
    cute: (auth, task) => plugins.perform(auth, task),
  },
  get: {
    taskchat: (task, status) => plugins.chat(task, status),
    plugins: url => plugins.get(url),
  },
  clear: {
    browsers: () => users.closeBrowsers(),
  },
  show: {
    settings: () => `settings file: ./desktop-avatar-docker-db/settings.json`,
  },
  add: {
    tasks: tasks => plugins.add(tasks),
    sent: tasks => plugins.sent(tasks),
  }
}
