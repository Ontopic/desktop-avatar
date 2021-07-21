'use strict'
const { ipcRenderer, contextBridge } = require('electron')

/*    understand/
 * Bridge between the renderer and the main process
 */

contextBridge.exposeInMainWorld("show", {
  settings: () => ipcRenderer.invoke("show-settings"),
  trouble: () => ipcRenderer.invoke("trouble"),
  cookie:()=>ipcRenderer.invoke('show-cookie'),
  linkedin:()=>ipcRenderer.invoke('show-linkedin'),
  devTools : () => ipcRenderer.invoke("open-devtools")
})
contextBridge.exposeInMainWorld("get", {
  logname : () => ipcRenderer.invoke("get-logname"),
  taskname: act => ipcRenderer.invoke("get-taskname", act),
  taskchat: (t,s) => ipcRenderer.invoke("get-taskchat",t,s),
  plugins: url => ipcRenderer.invoke("get-plugins", url),
})
contextBridge.exposeInMainWorld("set", {
  users: uis => ipcRenderer.invoke("set-users", uis),
  userips: uips => ipcRenderer.invoke("set-userips", uips),
  puppetShow: show => ipcRenderer.invoke("set-puppetShow", show),
  pageTimeout: t => ipcRenderer.invoke("set-timeout", t),
})
contextBridge.exposeInMainWorld("clear", {
  browsers: () => ipcRenderer.invoke("clear-browsers"),
})
contextBridge.exposeInMainWorld("x", {
  cute: (a,t) => ipcRenderer.invoke("x-cute", { a, t }),
  it: () => ipcRenderer.invoke("x-it"),
  cute2: t => ipcRenderer.invoke("x-cute-again", t),
})
contextBridge.exposeInMainWorld("add", {
  tasks: t => ipcRenderer.invoke("add-tasks", t),
  sent: tasks => ipcRenderer.invoke("add-sent", tasks),
})
contextBridge.exposeInMainWorld("login", {
  saveInfo: (u,p) => ipcRenderer.invoke("save-logininfo",{u,p})
})
contextBridge.exposeInMainWorld("autologin", {
  getLoginInfo: () => ipcRenderer.invoke("get-logininfo")
})
contextBridge.exposeInMainWorld("logout", {
  removeInfo: () => ipcRenderer.invoke("remove-logininfo")
})
contextBridge.exposeInMainWorld("save", {
  userlinkedin: (u,p) => ipcRenderer.invoke('save-userlinkedin',{u,p})
})
