'use strict'

/*    understand/
 * because the avatar engine is used both in the browser and in the
 * server version, we need to provide a wrapper for global browser 
 * 'window' calls. These calls are usually hooks for IPC communication
 * with electron so we override them in the server version by
 * overwriting this file.
 */
module.exports = window
