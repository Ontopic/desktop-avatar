'use strict'
const { app, dialog, Menu, ipcMain } = require('electron')

const db = require('./db.js')
const lg = require('./logger.js')
const wins = require('./wins.js')
const plugins = require('./plugins.js')
const users = require('./users.js')
const loc = require('./loc.js')
const util = require('./util.js')
const dbg = require('./dbg.js')
const fs = require('fs')
const login =require('./login')
var CryptoJS = require("crypto-js");

/*    understand/
 * main entry point into our program - called
 * when electron is ready
 */
function onReady() {
  const log = lg(generateName(), process.env.DEBUG)

  setupFolders(err => {
    if(err) {
      dialog.showErrorBox("DB", err.toString())
      app.quit()
      return
    }
    db.start(log, err => {
      if(err) {
        dialog.showErrorBox("DB", err.toString())
        app.quit()
      } else {
        log("app/info", `Logging to ${log.getName()}`)

        setupIPC(log)
        setupUI()
      }
    })
  })

}

function setupFolders(cb) {
  util.ensureExists(loc.cookies(), err => {
    if(err) cb(err)
    else util.ensureExists(loc.savedCookies(), cb)
  })
}

app.whenReady().then(onReady)
app.on('window-all-closed', () => app.quit())


/*    understand/
 * We need a logfile to hold the messages of our current
 * run without interfering with other concurrent runs
 */
function generateName() {
  let n = `log-${(new Date()).toISOString()}-${process.pid}`
  return n.replace(/[/:\\*&^%$#@!()]/g, "_")
}

function setupIPC(log) {
  ipcMain.handle("show-settings", () => {
    wins.Settings()
  })

  ipcMain.handle("trouble", () => {
    dbg.xport(log)
  })

  ipcMain.handle("close-settings", () => {
    wins.closeSettings()
  })

  ipcMain.handle("get-logname", async () => {
    return { name: log.getName(), DEBUG: process.env.DEBUG }
  })

  ipcMain.handle("get-plugins", async (e, url) => {
    return plugins.get(url)
  })

  ipcMain.handle("get-taskname", async (e, action) => {
    return plugins.info(action)
  })

  ipcMain.handle("get-taskchat", async (e,task,status) => {
    return plugins.chat(task, status)
  })

  ipcMain.handle("add-tasks", async (e, tasks) => {
    return plugins.add(tasks)
  })

  ipcMain.handle("add-sent", async (e, tasks) => {
    return plugins.sent(tasks)
  })

  ipcMain.handle("set-users", async (e, uis) => {
    return users.set(uis)
  })

  ipcMain.handle("set-userips", async (e, uips) => {
    return users.setips(uips)
  })

  ipcMain.handle("set-puppetShow", async (e, show) => {
    return users.setPuppetShow(show)
  })

  ipcMain.handle("set-timeout", async (e, t) => {
    return users.setTimeout(t)
  })

  ipcMain.handle("x-cute", async (e, { a, t }) => {
    return plugins.perform(a, t)
  })

  ipcMain.handle("x-cute-again", async (e, task) => {
    return plugins.retry(task)
  })

  ipcMain.handle("x-it", async (e, task) => {
    plugins.quit()
  })

  ipcMain.handle("clear-browsers", async () => {
    users.closeBrowsers()
  })

  ipcMain.handle("save-usercookie", async (e, info) => {
    users.saveCookieFile(info)
  })

  ipcMain.handle("save-logininfo", async (e,{u,p}) => {
    login.saveLoginInfo(u,p)
  })

  ipcMain.handle("get-logininfo", async () => {
    return await new Promise((resolve, reject) => {
      login.getUserLoginInfo((data) => {
        resolve(data);
      });
    }).then((result) => {
      return result;
    });
  })

  ipcMain.handle("remove-logininfo", async () => {
    login.removeLoginInfo()
  })
}

/*    way/
 * Set up the main menu, load the main window when user clicks the app
 * and start by showing the main window
 */
function setupUI() {
  setupMenu()

  app.on("activate", () => {
    if(wins.None()) wins.Main()
  })

  wins.Main()
}

/*    way/
 * create a template containing most of the default menu items along
 * with our items then set it as our application menu
 */
function setupMenu() {
  let template = [
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Settings',
          click: () => wins.Settings()
        },
        {
          label: "User Cookies",
          click: () => wins.UserCookie()
        }
      ]
    },
    { role: 'windowMenu' },
  ]
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
/**
+ *  understand/
+ * To prevent multiple time application open
+ */
const gotTheLock = app.requestSingleInstanceLock()
if(!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if(wins.Main()) {
      if(wins.Main().isMinimized()) wins.Main().restore()
      wins.Main().focus()
    }
  })
}
