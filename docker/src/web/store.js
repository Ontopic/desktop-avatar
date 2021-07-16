'use strict'
const dux = require('@tpp/dux')

const store = enrich(dux.createStore(reducer, {
  logs: [],
  time: {
    now: 0,
    lastUserStatus: 0,
    lastServerTasks: 0,
    lastLazy: 0,
  },
  user: {
    ui: null,
    users: [],
    msgs: [],
    from: {},
    tasks: [],
    status: [],
    assigned: {},
    dispatched: {},
    active: [],
  },
  hist: {
    task: 0,
    status: 0,
  },
  view: {
    logviewOpen: false,
  },
  settings: {},
  expectlogs: false,
}))

function reducer(state, type, payload) {
  let changes = 0
  state = {
    logs: r_1(logReducer, state.logs),
    time: r_1(timeReducer, state.time),
    user: r_1(userReducer, state.user),
    hist: r_1(histReducer, state.hist),
    view: r_1(viewReducer, state.view),
    settings: r_1(settingsReducer, state.settings),
    expectlogs: r_1(expectReducer, state.expectlogs),
  }
  if(!changes) {
    console.error("WARNING(store.js):UNHANDLED STATE", type)
  }
  if(changes > 1) {
    console.error("WARNING(store.js):MULTI-HANDLE STATE", type)
  }
  return state

  function r_1(fn, val) {
    const r = fn(val, type, payload)
    if(r !== val) changes++
    return r
  }
}

function logReducer(state, type, payload) {
  switch(type) {
    case "logs/set": return payload;
    default: return state
  }
}
function timeReducer(state, type, payload) {
  switch(type) {
    case "timer/tick":
      return { ...state, now: payload }
    case "lastUserStatus/set":
      return { ...state, lastUserStatus: payload }
    case "lastServerTasks/set":
      return { ...state, lastServerTasks: payload }
    case "lastLazy/set":
      return { ...state, lastLazy: payload }
    default: return state
  }
}
function userReducer(state, type, payload) {
  switch(type) {
    case "ui/set":
      return { ...state, ui: payload }
    case "users/set":
      return { ...state, users: payload }
    case "msg/add":
      return { ...state, msgs: state.msgs.concat(payload) }
    case "msg/clear":
      return { ...state, msgs: [] }
    case "task/add":
      return { ...state, tasks: state.tasks.concat(payload) }
    case "from/set":
      {
        let from = Object.assign({}, state.from)
        from[payload.userId] = payload.from
        return { ...state, from }
      }
    case "status/add":
      return { ...state, status: state.status.concat(payload) }
    case "assigned/set":
      {
        let assigned = Object.assign({}, state.assigned)
        assigned[payload.userId] = payload.taskId
        return { ...state, assigned }
      }
    case "dispatched/set":
      {
        let dispatched = Object.assign({}, state.dispatched)
        dispatched[payload.userId] = payload.taskId
        return { ...state, dispatched }
      }
    case "activeusers/set":
      return { ...state, active: payload }
    default: return state
  }
}
function histReducer(state, type, payload) {
  switch(type) {
    case "hist/task":
      return { ...state, task: payload }
    case "hist/status":
      return { ...state, status: payload }
    default: return state
  }
}
function viewReducer(state, type, payload) {
  switch(type) {
    case "logview/show":
      return { ...state, logviewOpen: true }
    case "logview/hide":
      return { ...state, logviewOpen: false }
    default: return state
  }
}
function settingsReducer(state, type, payload) {
  switch(type) {
    case "settings/set": return payload
    case "serverURL/set":
      return { ...state, serverURL: payload }
    default: return state
  }
}
function expectReducer(state, type, payload) {
  switch(type) {
    case "expect/logs": return payload
    default: return state
  }
}

function userDuplicateRemoval(userList, ui){
  let uniqueUserList = [ui]
  let idList = [ui.id]
  for(let i = 0;i<userList.length;i++){
    if(!idList.includes(userList[i].id)){
      idList.push(userList[i].id)
      uniqueUserList.push(userList[i])
    }
  }
  return uniqueUserList
}

/*    understand/
 * it is useful to have some utility methods on the store
 * to get values that are combinations. That way it
 * becomes easier to handle.
 */
function enrich(store) {
  store.ffork = () => enrich(store.fork())
  store.getUsers = () => {
    const ui = store.get("user.ui")
    let users = store.get("user.users")
    return userDuplicateRemoval(users, ui)
  }

  store.getActiveUsers = () => {
    const active = store.get("user.active")
    if(active && active.length) return active
    else return store.getUsers()
  }

  store.getTasks = userId => {
    const tasks = store.get("user.tasks")
    return tasks.filter(t => t.userId == userId)
  }

  store.getTaskStatus = (taskId,ignore) => {
    const status = store.get("user.status")
    for(let i = status.length-1;i >= 0;i--) {
      if(status[i].id == taskId
        && status[i].code !== ignore) return status[i]
    }
  }

  store.getTaskUser = task => {
    const users = store.getUsers()
    for(let i = 0;i < users.length;i++) {
      if(task.userId == users[i].id) return users[i]
    }
  }

  store.getTask = taskId => {
    const tasks = store.get("user.tasks")
    for(let i = 0;i < tasks.length;i++) {
      if(tasks[i].id == taskId) return tasks[i]
    }
  }

  store.getMsgFrom = userId => {
    const from = store.get("user.from")[userId]
    return from || 1
  }

  return store
}

module.exports = store
