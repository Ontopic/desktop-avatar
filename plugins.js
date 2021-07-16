'use strict'
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const notifier = require('node-notifier');
const { clone, pull } = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const ss = require('string-similarity')
const loc = require('./loc.js')
const dh = require('./display-helpers.js')
const users = require('./users.js')
const lg = require('./logger.js')

/*    understand/
 * we hold information about the plugins here so they
 * can be accessed by the various functions
 */
let state = {
  dir: null,
  plugins: {},
}

/*    way/
 * download the latest plugin
 */
function getPluginRepo(url, cb) {
  state = { dir: null, plugins: {} }
  getLatest(url, loc.plugin(), (err, dir) => {
    if(err) cb(err)
    else {
      state.dir = dir
      cb()
    }
  })
}
/*    understand/
 * Promisi-fied version of `getPluginRepo`
 */
function get(url) {
  return new Promise((resolve, reject) => {
    getPluginRepo(url, err => {
      if(err) reject(err)
      else resolve()
    })
  })
}

/*    way/
 * if the repo is downloaded update it otherwise clone
 * the repo
 */
function getLatest(from, to, cb) {
  let url
  try {
    url = new URL(from)
  } catch(e) {
    return cb(e)
  }
  let name = path.basename(url.pathname, ".git")
  to = path.join(to, name)
  fs.lstat(to, (err, stats) => {
    if(err && err.code === "ENOENT") cloneRepo(from, to, cb)
    else if(err) cb(err)
    else updateRepo(from, to, cb)
  })
}

function cloneRepo(from, to, cb) {
  clone({
    fs,
    http,
    dir: to,
    url: from,
  }).then(() => cb(null, to))
  .catch(cb)
}

function updateRepo(from, to, cb) {
  pull({
    fs,
    http,
    dir: to,
    fastForwardOnly: true,
    author: { name: "invalid", email: "in@valid.com" },
  }).then(() => cb(null, to))
  .catch(cb)
}

/*    way/
 * run the plugin and return the info
 */
function getInfo(name, cb) {
  getPlugin(name, (err, plugin) => {
    if(err) return cb(err)
    let context = {
      console,
      plugin: {name, info:{}},
    }
    try {
      vm.createContext(context)
      plugin.code.runInContext(context)
      return cb(null, context.plugin.info.name)
    } catch(e) {
      cb(e)
    }
  })
}
/*    way/
 * Promisi-fied version of `getInfo`
 */
function info(name) {
  return new Promise((resolve, reject) => {
    getInfo(name, (err, name) => {
      if(err) reject(err)
      else resolve(name)
    })
  })
}

/*    way/
 * ask the plugin for a chat message corresponding to
 * what the plugin is doing
 */
function getChat(task, status, cb) {
  if(!task.action) return cb_("Task missing 'action' key")
  getPlugin(task.action, (err, plugin) => {
    if(err) return cb(err)
    let context = {
      console,
      plugin: {name: task.action, info:{}},
    }
    try {
      vm.createContext(context)
      plugin.code.runInContext(context)
      let chat = context.plugin.info.chat
      if(!chat || typeof chat !== "function") {
        chat = default_chat_1
      }
      const chatmsg = chat(task, status, context.plugin.name)
      if(!chatmsg) cb(`Error getting chat for status: ${JSON.stringify(status)}`)
      else cb(null, chatmsg)
    } catch(e) {
      cb(e)
    }
  })

  function chatname_1(status) {
    if(status == 102) return "sayOnStart"
    if(status == 200) return "sayOnEnd"
  }

  function default_chat_1(task, status, name) {
    if(!name) name = task.action
    const msgs = {
      102: [
        `Ok trying ${name}...`,
        `Doing ${name}...`,
        `I'm going to do ${name} now...`,
      ],
      200: [
        `${name} completed!`,
        `Done with ${name}...`,
      ],
      202: [
        `${name} sent to server!`,
        `Completed ${name}...`,
      ],
      400: [
        `Error in task data for "${name}" (id: ${task.id})`,
        `Cannot perform task (id: ${task.id})`,
      ],
      504: [
        `Timeout trying ${name}!`,
        `Task ${name} took too long...timing out...`,
      ],
      500: [
        `Hit an unexpected error when trying to do "${name}"`,
        `Unexpected error caused ${name} task ${task.id} to fail...`,
      ],
      501: [
        `No plugin found to perform ${name}`,
      ],
      401: [
        `User intervention required! The site needs you to prove that you are a human (and I'm not!) ` + dh.anEmoji("face"),
      ],
      403: [
        `The site has refused to accept this user! Please see how you can get back on...`
      ],
      424: [
        `The linkedin page has been updated. Please contact the developer.`
      ],
    }
    return dh.oneOf(msgs[status.code])
  }

}
/*    way/
 * Promisi-fied version of `getChat`
 */
function chat(task, status) {
  return new Promise((resolve, reject) => {
    getChat(task, status, (err, chat) => {
      if(err) reject(err)
      else resolve(chat)
    })
  })
}

/*    understand/
 * return the user's log
 */
function getLogger(task, cb) {
  let uctx = users.get(task.userId)
  if(!uctx) return cb("User for task not found")
  if(!uctx.logger) {
    let n = `User-${task.userId}`
    uctx.logger = lg(n, process.env.DEBUG)
  }
  cb(null, uctx.logger)
}

/*    way/
 * provide a valid browser logged in to linkedin page as context
 * to the task plugin and record the start and all other status
 * in the user log.
 */
function performTask(auth, task, cb) {
  getLogger(task, (err, log) => {
    if(err) return cb(err)
    users.browser(users.get(task.userId)).then(browser => {
      const cfg = {
        timeout: task.timeout || undefined
      }
      users.linkedInPage(cfg, auth, browser).then(page => {

        getPlugin(task.action, (err, plugin) => {
          if(err) {
            status_noplugin_1("err/task/noplugin")
            page.close().catch(e => console.error(e))
            return cb(err)
          }

          status_started_1(err => {
            if(err) {
              status_servererr_1(err)
              page.close().catch(e => console.error(e))
              return cb(err)
            }
            try {
              cb()
              let context = context_1(browser, cfg, page, task)
              vm.createContext(context)
              plugin.code.runInContext(context)
            } catch(e) {
              console.error(e)
              status_servererr_1(e)
            }
          })

        })

      })
      .catch(err => {
        if(err === users.NEEDS_CAPTCHA) {
          status_capcha_1("err/task/capcha")
          notifier.notify({
            title: 'CAPTCHA Error',
            message: 'Captcha needs to be resolved.',
            icon: path.join(__dirname, './build/icon.iconset/icon_16x16@2x.png'),
            sound: true,
            wait: true,
            appName: "SalesboxAI Desktop Avatar"
          })
          quit()
          return cb("Need CAPCHA")
        }
        if(err === users.LOGIN_ERR) {
          status_baduser_1("err/login/err")
          notifier.notify({
            title: 'Login Error',
            message: 'Invalid Linkedin credential',
            icon: path.join(__dirname, './build/icon.iconset/icon_16x16@2x.png'),
            sound: true,
            wait: true,
            appName: "Salesbox Desktop Avatar"
          })
          quit()
          return cb(`Invalid Linkedin credential`)
        }
        if(err === users.PREMIUM_ERR) {
          status_baduser_1("err/need/salesnavigator")
          notifier.notify({
            title: 'Premium Error',
            message: 'You need a Sales Navigator or Premium account',
            icon: path.join(__dirname, './build/icon.iconset/icon_16x16@2x.png'),
            sound: true,
            wait: true,
            appName: "Salesbox Desktop Avatar"
          })
          quit()
          return cb("You need a Sales Navigator or Premium account")
        }
        if(err === users.COOKIE_EXP) {
          status_baduser_1("err/cookie/expired")
          notifier.notify({
            title: 'Cookie Error',
            message: `Cookie for user ${task.userId} expired. Please add a new cookie string`,
            icon: path.join(__dirname, './build/icon.iconset/icon_16x16@2x.png'),
            sound: true,
            wait: true,
            appName: "Salesbox Desktop Avatar"
          })
          quit()
          return cb(`Cookie expired for User ${task.userId}. Please add new cookie string.`)
        }
        if(err === users.VC_ERR) {
          status_baduser_1("err/task/verification_code")
          notifier.notify({
            title: 'Verifcation Code',
            message: `Linkedin detected suspicious activity for User ${task.userId}. Check your mail and enter verification code`,
            icon: path.join(__dirname, './build/icon.iconset/icon_16x16@2x.png'),
            sound: true,
            wait: true,
            appName: "Salesbox Desktop Avatar"
          })
          quit()
          return cb(`Linkedin detected suspicious activity for User ${task.userId}. Check respective mail and enter verification code`)
        }
        return cb(err.stack? err.stack : err)
      })
    })
    .catch(err => {
      status_servererr_1(err)
      cb(err)
    })

    /*    way/
     * create a context to provide the plugin access to
     *  (a) the status logging functions,
     *  (b) the browser, page, console, and so on and
     *  (c) parameters: the time outs etc
     */
    function context_1(browser, cfg, page, task) {
      return {
        log: {
          trace: m => {
            log(`trace/${task.action}/${task.id}`, m)
          },
          err: m => {
            log(`err/${task.action}/${task.id}`, m)
          }
        },
        cfg,
        status: {
          done: m => status_done_1(page, m),
          notify: (m,d) => status_done_1(page, null, m, d),
          usererr: m => status_usererr_1(page, m),
          timeout: m => status_timeout_1(page, m),
          servererr: m => status_servererr_1(page, m),
          errcapcha: m => status_capcha_1(page, m),
          baduser: m => status_baduser_1(page, m),
          pageerr: m => status_pageerr_1(page, m)
        },
        browser,
        page,
        console,
        autoScroll: users.autoScroll,
        util: {
          compareTwoStrings: ss.compareTwoStrings,
        },
        plugin: {name: task.action, info:{}, task},
      }
    }

    /*    way/
     * log task as started in the user log so we can keep
     * track of it going forward
     */
    function status_started_1(cb) {
      log("task/status", {
        id: task.id,
        msg: "task/started",
        code: 102
      }, cb)
    }

    let status_set = false

    function status_done_1(page, msg, notify, notifydata) {
      if(status_set) return
      status_set = true
      if(!msg) msg = "task/done"
      let s = { id: task.id, msg, code: 200 }
      if(notify) s.notify = notify
      if(notifydata) s.notifydata = notifydata
      log("task/status", s)
      page.close().catch(e => console.error(e))
    }
    function status_usererr_1(page, err) {
      status_with_1(page, 400, err)
    }
    function status_timeout_1(page, err) {
      status_with_1(page, 504, err)
    }
    function status_servererr_1(page, err) {
      status_with_1(page, 500, err)
    }
    function status_noplugin_1(page, err) {
      status_with_1(page, 501, err)
    }
    function status_capcha_1(page, err) {
      status_with_1(page, 401, err)
    }
    function status_baduser_1(page, err) {
      status_with_1(page, 403, err)
    }
    function status_pageerr_1(page, err){
      status_with_1(page, 424, err)
    }

    function status_with_1(page, code, err) {
      if(status_set) return
      status_set = true
      if(!err) err = "err/task"
      else if(err.stack) err = err.stack
      log("task/status", { id: task.id, err, code })
      page && page.close && page.close()
    }


  })
}
function perform(auth, task) {
  return new Promise((resolve, reject) => {
    performTask(auth, task, (err, resp) => {
      if(err) reject(err)
      else resolve(resp)
    })
  })
}

/*    way/
 * load the plugin from disk or return it from cache
 */
function getPlugin(name, cb) {
  if(!state.dir) return cb("plugins.js: not initialized")
  let plugin = state.plugins[name]
  if(plugin && plugin.code) return cb(null, plugin)

  plugin = {
    p: path.join(state.dir, name + ".js")
  }

  fs.readFile(plugin.p, (err, code) => {
    if(err) cb(err)
    else {
      try {
        plugin.code = new vm.Script(wrap_1(code))
        state.plugins[name] = plugin
        cb(null, plugin)
      } catch(e) {
        cb(e)
      }
    }
  })

  /*    problem/
   * while plugin authors will do their best it is possible
   * they could throw some error/exception without meaning to
   * during the execution of the plugin. This error is hard
   * to find/see in the logs once the program is running.
   *    way/
   * wrap a call to a "standard" function we expect called
   * "performTask" in a try catch block and report it as the
   * correct error to the user
   */
  function wrap_1(code) {
    return `${code}

if(plugin.task) {
try {
  performTask(plugin.task)
    .then(() => {
      status.done()
    })
    .catch(err => {
      if(err.name == 'TimeoutError') status.timeout(err)
      else status.servererr(err)
    })
} catch(err) {
  if(err.name == 'TimeoutError') status.timeout(err)
  else status.servererr(err)
}
}

`
  }
}

/*    understand/
 * record the new tasks in the user logs
 */
function addTasks(tasks, cb) {
  add_ndx_1(0)

  function add_ndx_1(ndx) {
    if(ndx >= tasks.length) return cb()
    const task = tasks[ndx]
    getLogger(task, (err, log) => {
      if(err) return cb(err)
      log("task/new", task, err => {
        if(err) return cb(err)
        else add_ndx_1(ndx+1)
      })
    })
  }
}
/*    understand/
 * Promisi-fied version of `addTasks`
 */
function add(tasks) {
  return new Promise((resolve, reject) => {
    addTasks(tasks, (err, resp) => {
      if(err) reject(err)
      else resolve(resp)
    })
  })
}

/*    understand/
 * record an intent to retry this task in the user's log
 */
function retryTask(task, cb) {
  getLogger(task, (err, log) => {
    if(err) return cb(err)
    const msg = "task/retry"
    log("task/status", { id: task.id, msg, code: 0 }, cb)
  })
}
/*    understand/
 * Promisi-fied version of `retryTask`
 */
function retry(task) {
  return new Promise((resolve, reject) => {
    retryTask(task, err => {
      if(err) reject(err)
      else resolve()
    })
  })
}

/*    understand/
 * record task updates sent to server
 */
function sentTasks(tasks, cb) {
  record_ndx_1(0)

  function record_ndx_1(ndx) {
    if(ndx >= tasks.length) return cb()
    const task = tasks[ndx]
    getLogger(task, (err, log) => {
      if(err) return cb(err)
      const msg = "task/completed"
      log("task/status", { id:task.id, msg, code:202 }, err => {
        if(err) return cb(err)
        else record_ndx_1(ndx+1)
      })
    })
  }
}
/*    understand/
 * Promisi-fied version of `sentTasks`
 */
function sent(tasks) {
  return new Promise((resolve, reject) => {
    sentTasks(tasks, err => {
      if(err) reject(err)
      else resolve()
    })
  })
}

function quit() {
  const { app } = require('electron')
  setTimeout(() => app.quit(), 1000)
}

module.exports = {
  get,
  info,
  chat,
  perform,
  add,
  retry,
  sent,
  quit,
}
