'use strict'

/*    way/
 * if we are performing a task, report on that, otherwise check if we
 * have performed some task recently and report on that. If there is
 * a task that has hit it's daily limit, check if we have gone past
 * a day. If there is a task that is new or needs to be retried, check
 * if we are hitting the daily limit on that or return it.
 */
function get(tasks, user) {
  let lastDone = 0
  let pick
  for(let tid in tasks) {
    const task = tasks[tid]
    if(task.last === "started") return { type: "performing" }
    if(lastDone < task.fin) lastDone = task.fin
    if(pick) continue
    if(task.last === "new" || task.last === "retry") {
      if(dailyLimitHit(task)) return { type: "daily-limit-reached", task }
      else pick = pickStep(task)
    }
    if(task.last === "failed/daily-limit") {
      const now = Date.now()
      if(now - task.fin > 24 * 60 * 60 * 1000) pick = pickStep(task)
    }
  }
  if(pick) {
    const now = Date.now()
    if(now - lastDone < 500 + (4 * 60 * 1000) * Math.random()) return { type: "too-soon" }
    else return { type: "task", task: pick }
  }
  return { type: "nothing-to-do" }
}

function pickStep(task) {
  let pick
  for(let i = 0;i < task.steps.length;i++) {
    const t = task.steps[i]
    if(t.e === "task/new" || t.e === "task/retry") pick = t
  }
  return pick
}

function dailyLimitHit(task_name) {
    if(task_name=="LINKEDIN_CONNECT") return 40
    if(task_name=="LINKEDIN_CHECK_CONNECT")  return 40 
    if (task_name=="LINKEDIN_VIEW") return 40
    if (task_name=="LINKEDIN_DISCONNECT") return 10
    if (task_name=="LINKEDIN_MSG") return 25
    if (task_name=="LINKEDIN_CHECK_MSG") return 25
  
}

module.exports = {
  get,
  dailyLimitHit
}
