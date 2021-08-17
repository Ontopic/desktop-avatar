'use strict'
const path = require('path')
const util = require('./util.js')

/*    outcome/
 * Return the base location of our application - where we can store
 * configuration files, data etc
 */
function home() {
  if(process.env.SALESBOT_HOME) return process.env.SALESBOT_HOME

  let root = process.env.APPDATA
  if(root) {
    root = path.join(root, "Local")
  } else {
    root = process.env.HOME
  }
  return path.join(root, "SalesBot")
}

/*    outcome/
 * Return the location of the database directory
 */
function db() {
  return path.join(home(), 'db')
}

/*    outcome/
 * Return the location of the plugin directory
 */
function plugin() {
  return path.join(home(), 'plugins')
}

/*    outcome/
 * Return the location of the cookies directory
 */
function cookies() {
  return path.join(home(), 'cookies')
}

/*    outcome/
 * return the location of a user's cookie file
 */
function cookieFile(userid) {
  return path.join(cookies(), `${userid}`)
}

/*    outcome/
 * Return the location of the user-saved cookies directory
 */
function savedCookies() {
  return path.join(home(), 'saved-cookies')
}

/*    outcome/
 * return the location of a saved user cookie file
 */
function savedCookieFile(userid) {
  return path.join(savedCookies(), `${userid}`)
}

/*    outcome/
 * Return the location of the users linkedin creds directory
 */

function linkedinCreds(){
  return path.join(home(),`linkedin-creds`)
}

/*    outcome/
 * Return the location of the users linkedin creds file
 */

function linkedinCredsFile(userid){
  return path.join(linkedinCreds(),`User-${userid}.json` )
}


/*    outcome/
 * Return the location of a dumpfile for errors.
 */
function dmp() {
  let t = (new Date()).toISOString().replace(/[\/\\:]/g, "_")
  return path.join(home(), `dmp-${t}.html`)
}

module.exports = {
  home,
  db,
  plugin,
  cookies,
  cookieFile,
  savedCookies,
  savedCookieFile,
  linkedinCreds,
  linkedinCredsFile,
  dmp,
}
