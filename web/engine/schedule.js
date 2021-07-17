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
  tasks.map(t => {
    if(t.fin > lastDone) lastDone = t.fin
  })
  for(let i = 0;i < tasks.length;i++) {
    const task = tasks[i]
    if(task.last === "new") 
  }
  return { type: "nothing-to-do" }
}
