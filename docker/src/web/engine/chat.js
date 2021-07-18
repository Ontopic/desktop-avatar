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

function checkingSetup(store, cb) {
  say(store, dh.oneOf(
    "I'm going to do a quick check of our setup...",
    "Doing a check of our setup...",
    "I'm going to start by checking our setup...",
  ) + dh.oneOf(":mag:", ":mag_right:"), cb)
}

function gettingPlugins(store, cb) {
  say(store, dh.oneOf(
    "Getting plugins...",
    "Hang on while I get the latest plugins...",
    "Looking for plugins to do the work...",
  ), cb)
}

function gotPlugins(store, cb) {
  say(store, dh.oneOf(
    `Downloaded latest plugins ${dh.anEmoji(`tools`)}`,
    `Got the latest plugins ${dh.anEmoji(`tools`)}`,
    `Fetched latest plugins ${dh.anEmoji(`tools`)}`
  ), cb)
}

function needServerURL(store, cb) {
  say(store, "I need the server URL to be set so I can connect to the server.\n\nI get all sorts of information from it. Please set the serverURL for me to proceed", cb)
}

function startingDB(store, cb) {
  say(store, dh.oneOf(
    "Starting database...",
    "Let me connect to the database...",
    "Initializing the database...",
  ), cb)
}

function dbStarted(store, cb) {
  say(store, dh.oneOf(
    `Database set up! ${dh.anEmoji(`awesome`)}`,
    `Database running! ${dh.anEmoji(`awesome`)}`,
    `Database initialized! ${dh.anEmoji(`awesome`)}`,
  ), cb)
}

function looksGood(store, cb) {
  say(store, dh.oneOf(
    "Everything looks good!",
    `Everything looks good! ${dh.anEmoji("good")}`,
    `It all looks good! ${dh.anEmoji("good")}`,
    `Everything Ok... ${dh.anEmoji("good")}`,
  ), cb)
}

function gettingUsers(store, cb) {
  say(store, dh.oneOf(
    "Let me check which users I am assigned to work for...",
    "Let's start by checking if there are any other users we should be working with...",
    "I am going to check with the server if there are any other users we need to work with..."
  ), cb)
}

function errGettingUsers(store, cb) {
  say(store, `**Error Getting Users**!

I will notify the developers of this issue. In the meantime you can check the message logs and see if that gives you any ideas.
`, cb)
}

function errSettingFroms(store, cb) {
  say(store, `**Error Setting up Users**!

I will notify the developers of this issue. In the meantime you can check the message logs and see if that gives you any ideas.
`, cb)
}

function errGettingTasks(store, cb) {
  say(store, `**Error Getting Tasks**!

Failed to get tasks from the server.
`, cb)
}

function errScheduleWork(err, store, cb) {
  say(store, `**Error Starting Task**!

I couldn't get the task working. Please see the log for more details...
`, cb)
}

function errSendingStatus(err, store, cb) {
  say(store, `**Error Sending Status**!

I couldn't send the tasks updates to the server. I'll try again soon. Please see the log for more details...
`, cb)
}


function manageUsers(store, cb) {
  const users = store.get("user.users")
  if(users.length == 0) {
    say(store, {from: -1, chat: dh.oneOf(
      "Currently you do not have any other users to manage",
      "You do not have any other users to manage",
      "You have no other users to manage",
      "I did not find any other users for you to manage"
    )}, cb)
  } else {
    say(store, {from: -1, chat: dh.oneOf(
    `You have ${users.length} users to manage`,
    `Found ${users.length} users for you to manage`,
    `You have ${users.length} users to work with`
    )}, cb)
  }
}

function noticeReport(store, cb) {
  say(store, dh.oneOf(
    "I'll show you a report of the work I'm doing on the report pane to the right",
    "You can see the work we're doing on the report pane to the right",
    "To help you see what's going on we'll update working reports on the right hand side pane"
  ), cb)
}

function gettingTasks(store, cb) {
  const opts = [
    "Checking with the server for any new tasks...",
    "I'll ask the server for any more tasks...",
    "Asking the server for new tasks...",
    "Asking the server for more tasks...",
    "I'm asking the server for new tasks...",
    "I'm asking the server for more tasks...",
  ]
  say(store, dh.oneOf(opts) + dh.anEmoji("computer"), cb)
}

function sentTasks(tasks, store, cb) {
  if(tasks.length == 0) {
    say(store, dh.oneOf(
      "I haven't got anything new for you right now.\n\nCheck back later!",
      "No new tasks ATM",
      "Ok - haven't found anything new for you to do right now",
      "After checking everywhere I couldn't find anything for you to do.\n\nCheck back later."
    ), cb)
  } else {
    say(store, dh.oneOf(
      `Giving you ${tasks.length} task(s) to do`,
      `Got ${tasks.length} task(s) for you to do`,
      `Found ${tasks.length} task(s) for you to do`,
      `Giving you ${tasks.length} task(s)`,
      `Here you go - ${tasks.length} task(s)`
    ), cb)
  }
}

function gotStatus(tasks, store, cb) {
  say(store, dh.oneOf(
    `Thanks for the update :+1:`,
    `Updated the backend for ${tasks.length} tasks`,
    `Thanks. Have recorded the status updates`,
    `Thanks. Have recorded the status updates for ${tasks.length} tasks`
  ), cb)
}

function nothingToDo(store, cb) {
  const opts = [
    "Nothing to do...",
    "Taking a break...",
    "Yawn...",
  ]
  say(store, dh.oneOf(opts) + dh.anEmoji("sleepy"), cb)
}

function performing(store, task, cb) {
  say(store, `Performing ${task.action}...`, cb)
}

function errPerforming(store, task, cb) {
  say(store, `Error: Performing ${task.action}...`, cb)
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
  gettingPlugins,
  gotPlugins,
  startingDB,
  dbStarted,
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
  nothingToDo,
  performing,
  errPerforming,

  say,
}
