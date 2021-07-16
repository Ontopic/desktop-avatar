'use strict'
const dh = require('../../display-helpers.js')

function say(store, msg, cb) {
  let delay = Math.random() * 4000 + 1000
  newMsg(store, msg)
  if(msg.wait) delay = msg.wait
  setTimeout(() => cb && cb(), delay)
}

function greeting(store, cb) {
  say(store, dh.greeting(store.get("user.ui")), cb)
}

function letsGetStarted(store, cb) {
  const ops = [
    [ "Let's get to work today :fire:", dh.smiley() ],
    [ "Let's get started! :+1:", ":sunglasses:" ],
    [ "Let's see what we've got to do...", ":monocle:" ],
  ]

  const msgs = dh.oneOf(ops)
  say(store, { chat: msgs[0], wait: 900 }, () => say(store, msgs[1], cb))
}

function checkingSetup() {
  return dh.oneOf(
    "I'm going to do a quick check of our setup...",
    "Doing a check of our setup...",
    "I'm going to start by checking our setup...",
  ) + dh.oneOf(":mag:", ":mag_right:")
}

function needServerURL() {
  return "I need the server URL to be set so I can connect to the server.\n\nI get all sorts of information from it. Please set the serverURL for me to proceed"
}

function looksGood() {
  return dh.oneOf(
    "Everything looks good!",
    `Everything looks good! ${dh.anEmoji("good")}`,
    `It all looks good! ${dh.anEmoji("good")}`,
    `Everything Ok... ${dh.anEmoji("good")}`,
  )
}

function gettingUsers() {
  return dh.oneOf(
    "First let me check which users I am assigned to work for...",
    "Let's start by checking if there are any other users we should be working with...",
    "First, I am going to check with the server if there are any other users we need to work with..."
  )
}

function errGettingUsers() {
  return `**Error Getting Users**!

I will notify the developers of this issue. In the meantime you can check the message logs and see if that gives you any ideas.
`
}

function errSettingFroms() {
  return `**Error Setting up Users**!

I will notify the developers of this issue. In the meantime you can check the message logs and see if that gives you any ideas.
`
}

function errGettingTasks() {
  return `**Error Getting Tasks**!

Failed to get tasks from the server.
`
}

function errScheduleWork(err) {
  return `**Error Starting Task**!

I couldn't get the task working. Please see the log for more details...
`
}

function errSendingStatus(err) {
  return `**Error Sending Status**!

I couldn't send the tasks updates to the server. I'll try again soon. Please see the log for more details...
`
}


function manageUsers(users) {
  if(users.length == 0) {
    return dh.oneOf(
      "Currently you do not have any other users to manage",
      "You do not have any other users to manage",
      "You have no other users to manage",
      "I did not find any other users for you to manage"
    )
  }
  return dh.oneOf(
    `You have ${users.length} users to manage`,
    `Found ${users.length} users for you to manage`,
    `You have ${users.length} users to work with`
  )
}

function noticeReport() {
  return dh.oneOf(
    "I'll show you a report of the work I'm doing on the report pane to the right",
    "You can see the work we're doing on the report pane to the right",
    "To help you see what's going on we'll update working reports on the right hand side pane"
  )
}

function gettingTasks() {
  const opts = [
    "Checking with the server for any new tasks...",
    "I'll ask the server for any more tasks...",
    "Asking the server for new tasks...",
    "Asking the server for more tasks...",
    "I'm asking the server for new tasks...",
    "I'm asking the server for more tasks...",
  ]
  return dh.oneOf(opts) + dh.anEmoji("computer")
}

function sentTasks(tasks) {
  if(tasks.length == 0) {
    return dh.oneOf(
      "I haven't got anything new for you right now.\n\nCheck back later!",
      "No new tasks ATM",
      "Ok - haven't found anything new for you to do right now",
      "After checking everywhere I couldn't find anything for you to do.\n\nCheck back later."
    )
  }
  return dh.oneOf(
    `Giving you ${tasks.length} task(s) to do`,
    `Got ${tasks.length} task(s) for you to do`,
    `Found ${tasks.length} task(s) for you to do`,
    `Giving you ${tasks.length} task(s)`,
    `Here you go - ${tasks.length} task(s)`
  )
}

function gotStatus(tasks) {
  return dh.oneOf(
    `Thanks for the update :+1:`,
    `Updated the backend for ${tasks.length} tasks`,
    `Thanks. Have recorded the status updates`,
    `Thanks. Have recorded the status updates for ${tasks.length} tasks`
  )
}

/*    way/
 * create a new chat for the requested bot and add it to the store.
 */
function newMsg(store, msg) {
  if(!msg) return
  if(typeof msg === "string") msg = { chat: msg }
  if(!msg.chat) return
  if(typeof msg.chat !== "string") msg.chat = JSON.stringify(msg.chat)

  let from = find_bot_1(store, msg)

  store.event("msg/add", {
    t: (new Date()).toISOString(),
    from,
    chat: msg.chat
  })

  /*    way/
   * If the message contains a 'from' field we use that (special case -1
   * == from server) or we use the environment's current user.
   */
  function find_bot_1(store, msg) {
    if(msg.from === -1) return serverBot()
    let ui = store.get("user.ui")
    if(msg.from) ui = msg.from
    if(!ui) return emptyBot()
    if(!ui.bots || !ui.bots.length) return {
      id: ui.id,
      firstName: ui.firstName,
      lastName: ui.lastName,
      title: ui.title,
      userName: ui.userName,
      logo: ui.pic
    }
    let bot
    for(let i = 0;i < ui.bots.length;i++) {
      bot = ui.bots[i]
      if(bot.logo) break
    }
    return {
      id: bot.id,
      userName: bot.userName,
      firstName: bot.firstName,
      lastName: bot.lastName,
      title: bot.title,
      logo: bot.logo || ui.pic,
    }
  }

  function serverBot() {
    return {
      id: -1,
      userName: "salesbox.ai",
      firstName: "SalesBox (Server)",
      logo: "./bothead.png",
    }
  }
  function emptyBot() {
    return {
      id: 0,
      userName: "(null)",
      firstName: "(No Name)",
      logo: "./empty-bot.png",
    }
  }

}


module.exports = {
  greeting,
  letsGetStarted,
  checkingSetup,
  needServerURL,
  looksGood,
  gettingUsers,
  errGettingUsers,
  errSettingFroms,
  manageUsers,
  noticeReport,
  gettingTasks,
  sentTasks,
  gotStatus,
  errGettingTasks,
  errScheduleWork,
  errSendingStatus,

  say,
}
