'use strict'
const { h } = require('@tpp/htm-x')

const dh = require('../display-helpers.js')
const data = require('./engine/data.js')
const schedule = require('./engine/schedule.js')

import "./home.scss"

/*    understand/
 * we cache the tasknames here because (a) they shouldn't change
 * and (b) we often need them
 */
let TASKNAMES = {}
function getTaskname(action) {
  if(!TASKNAMES[action]) {
    TASKNAMES[action] = new Promise((resolve, reject) => {
      window.get.taskname(action)
      .then(n => resolve(n))
      .catch(e => resolve(action))
    })
  }
  return TASKNAMES[action]
}

/*    understand/
 * the home page shows a user pane on the left, a report
 * pane on the right and the middle contains a view of
 * the avatar that is doing work chatting with you
 */
function e(ui, log, store) {
  if(document.getElementById("loader"))document.getElementById("loader").remove()
  document.getElementsByClassName('toolbar')[0].remove()
  let page = h('.page')
  let header = h('.header')
  let reports = h(".reports")
  let worktable = h(".worktable")
  let filterBox = h('.filter')
  let appliedDateFilter =[];
  let workreports = h(".workreports").c(
    h(".title", [
      "Work Report Details",
      h(".close", {
        onclick: () => workreports.classList.remove("visible"),
      }, "X")
    ]),
    filterBox,
    worktable
  )
  let reportpane = h('.reportpane').c(
    reports
  )

  page.c(
    header.c(
      h("img", { src: "./salesboxai-logo.png" }),
      h(".navbar",
        [h('#menu',[
          h("a.active #a1",{ onclick:()=>setActiveLink("a1")},"Home"),
          h("a#a2", {
            onclick:()=>setActiveLink("a2")},"Work Reports"),
          h("a#a3", {
            onclick:()=>{
              setActiveLink("a3")
            } },"Settings"),
          h("a#a4", {
            onclick: () =>  setActiveLink("a4")},"Developer Tools"),
        ]),
        h('.dropdown',[
        h('button.dropbtn',{
          onclick: () => showDropDowns()    
        },[dh.userName(ui),
        h("i.fa fa-caret-down"),
        h('span.avatarimg',[
          h("img.usr-avatar-img",{
            src: "./default-user-image.png" 
          }
          )
        ])
      ]
      ),
      h('.dropdown-content #myDropdown',[
        h("a", {
          onclick: () => {
            window.show.linkedin()
          },style:
          {"color":"black","position":"relative","width":"100%","text-align":"left"}
          },"Linkedin Credentials"),
        h("a", {
          onclick: () => {
            window.show.cookie()
          },
          style:
             {"color":"black","position":"relative","width":"100%","text-align":"left"}
            },"User Cookies"),
        h("a", {
          onclick: () => {
            page.classList.add("bye")
            window.logout.removeInfo()
            setTimeout(() => window.x.it(), 350)
          },
          style:
          {"color":"black","position":"relative","width":"100%","text-align":"left"}
        },"Logout and Exit")]),
          h("img", { 
              src: "./grid.svg",
              style:{
                "padding":"7px",
                "cursor":"pointer" 
              },onclick:() =>{
                store.event("logview/show")
          }})
          ])
        ]),
    
    ),
    avatar_pane_1(),
    reportpane,
    workreports,
  )

  function showDropDowns(){
    document.getElementById("myDropdown").classList.toggle("show")
    window.onclick = function(e) {
      if (!e.target.matches('.dropbtn')) {
      var myDropdown = document.getElementById("myDropdown")
        if (myDropdown.classList.contains('show')) {
          myDropdown.classList.remove('show')
        }
      }
    }
  }

  function setActiveLink(setActive){
    if("a1"==setActive) e.className = "active"
    if("a2"==setActive) workreports.classList.add("visible")
    if("a3"==setActive) window.show.settings()
    if("a4"==setActive) window.show.devTools()
    var links = document.querySelectorAll("#menu a");
    Array.prototype.map.call(links, function(e) {        
        e.className = "";
        if (e.id == setActive)  e.className = "active";
    })
}

  let ustore
  store.react("user.ui", show_users_1)
  store.react("user.users", show_users_1)
  let wstore
  store.react("user.tasks", load_work_table_1)
  store.react("user.status", load_work_table_1)

  return page

  function getReportArr(userid){
    let db = data.get();
      var tasks = [];
      for (const task in db[userid]) {
        db[userid][task].taskid = parseInt(task);
        db[userid][task].userid=userid
        tasks.push(db[userid][task]);
      }
    return tasks
  }

  function load_work_table_1() {
    if(wstore) wstore.destroy()
    wstore = store.ffork()
    let workreportArrSource= []
    const users = store.getUsers() 
    users.map(user=>{
      let tasks=getReportArr(user.id)
      tasks.map(task=>{
        workreportArrSource.push(task)
      }) 
    })
    let workreportArr =[];
    let removed=false
    filterBox.c(h(".container",[
      " From:",
      h('input',{
        id:"fromDate",
        type: "date",
        name: "",
        min:""
        }),
        " To:",
      h('input',{
        id:"toDate",
        type: "date",
        name: "",
        max:""
        }),
        h("span",[
          h('input.btn.btn-info"',{
            type:"submit",
            value:"apply",
            id:"submitBtn",
            onclick: () => dateFilterData()
          }), 
          h("button#rmbtn", {
            onclick: () => removeFilter(),
          },"X")
        ])
    ]))
    let tbl = h("table")
    workreportArrSource.map(x=>{
      let status = store.getTaskStatus(x.taskid, 202)
      if(!status) status = {
        t: (new Date()).toISOString(),
        msg: "task/new",
      }
      let statusmsg = status.err ? "task/FAILED" : status.msg
      if(!statusmsg) statusmsg = ""
      else statusmsg = statusmsg.replace("/dummy", "")
       const details = JSON.stringify(x.steps[0].data, (k, v) => {
        const ignore = [ "id", "userId", "action" ]
        if(ignore.indexOf(k) !== -1) return undefined
        if(!v) return undefined
        if(k === "linkedInURL") {
          v = v.split('/')
          v = v[v.length-1] || v[v.length-2] || v
        }
        return v
      }, 2)

      let action = h("td.action", "")
      if(status.code > 299) {
        action = h("td.action", {
          onclick: () => {
            window.x.cute2(x.steps[0].data)
              .then(() => 1)
              .catch(err => console.error(err))
            store.event("status/add", {
              t: (new Date()).toISOString(),
              id: x.taskid,
              msg: "task/retry/dummy",
              code: 0,
            })
          },
        }, "retry")
      }

      let task_rw={
        date:  x.steps[0].t,
        id:x.taskid,
        userid:x.userid,
        taction:x.steps[0].data.action,
        details:details,
        statmsg:statusmsg,
        action:action
      }
      workreportArr.push(task_rw)
    })

    if(workreportArr.length>0){
      writeTable(workreportArr,tbl,appliedDateFilter)
    }

    function dateFilterData(){
      removed=false
      document.getElementById('rmbtn').style.visibility='visible'
      let startDate=new Date(document.getElementById('fromDate').value).toISOString();
      let endDate=new Date(document.getElementById('toDate').value).toISOString();
      appliedDateFilter[0]=startDate     
      if(startDate==endDate){
        endDate = adjustTime(endDate)
      } 
      appliedDateFilter[1]=endDate   
      writeTable(workreportArr,tbl,appliedDateFilter) 
    }

    function adjustTime(endDate){
      var date= new Date(endDate)
      date.setHours(date.getHours() + 23)
      date.setMinutes(date.getMinutes()+59)
      date.setSeconds(date.getSeconds()+59)
      endDate = date.toISOString()
      return endDate
    }
    function writeTable(inpArr,tbl,appliedDateFilter){
      if(!removed){
        if(appliedDateFilter.length>0){
          if(appliedDateFilter[0] !='' && appliedDateFilter[1] !=''){
            // endDate = adjustTime(endDate)
            if(inpArr.length>0){
              inpArr =[... inpArr.filter((obj)=>{
                return obj.date >= appliedDateFilter[0] && obj.date <= appliedDateFilter[1]
              })]
            }
            document.getElementById('fromDate').value=isotoDate(appliedDateFilter[0])
            document.getElementById('toDate').value=isotoDate(appliedDateFilter[1])
          }
        }
      }
      if(tbl){
        tbl.remove();
        tbl = h("table")
        const hdr = h("tr", [
          h("th", "On"),
          h("th", "Id"),
          h("th", "User Id"),
          h("th", "Action"),
          h("th", "Details"),
          h("th", "Status"),
          h("th.action", "Action")
        ])
        worktable.c(
          tbl.c(hdr)
        )
        inpArr.forEach(el => {
          tbl.add(h("tr", [
            h("td.on", el.date.replace("T", "<br/>")),
            h("td", el.id),
            h("td", el.userid),
            h("td", el.taction),
            h("td.details", el.details),
            h("td", el.statmsg),
            el.action
          ]))
        })
      }
    }

    function isotoDate(dt){
      date = new Date(dt);
      year = date.getFullYear();
      month = date.getMonth()+1;
      dt = date.getDate();
      if (dt < 10)  dt = '0' + dt;
      if (month < 10)  month = '0' + month;
      return year+'-' + month + '-'+dt
    }

    function removeFilter(){
      removed=true
      writeTable(workreportArr,tbl,appliedDateFilter) 
      document.getElementById('fromDate').value=''
      document.getElementById('toDate').value=''
      document.getElementById('rmbtn').style.visibility='hidden'
    }
  }
 
  function show_users_1() {
    if(ustore) ustore.destroy()
    ustore = store.ffork()
    const users = store.getUsers()
    reports.c()
    reports.add(users.map(ui => user_table_1(ui, ustore)))
  }

  function user_table_1(ui, store) {
    let cont = h(".userreport")

    let name = h(".name", dh.userName(ui))
    let id = h(".id", ui.id)
    let tbl = h("table")
    let hdr = h("tr", [
      h("th", "Task"),
      h("th", "Assigned"),
      h("th", "In Progress"),
      h("th", "Success"),
      h("th", "Failure"),
      h("th","Limit"),
      h("th","Left")
    ])

    cont.c(
      name,
      tbl.c(hdr),
      id
    )

    store.react("user.status", show_status_1)
    store.react("user.tasks", show_status_1)

    return cont

    function show_status_1() {
      let userReport = getReportArr(ui.id)
       tbl.c(hdr);
      let summary = {};
      let userTasksPerDay = data.getTasksPerDay(ui.id)
      if(userTasksPerDay){
        for (let i = 0; i < userReport.length; i++) {
          let curr = userReport[i].steps[0].data.action;
          if (!summary[curr]) {
            summary[curr] = {
              assigned: 1,
              inprogress: 0,
              success: 0,
              failure: 0,
            };
          } else summary[curr].assigned++;
          let status = status_1(userReport[i].taskid);
          if (status) summary[curr][status]++;
        }
      }
      
     if(summary){
      for (const property in summary) {
        summary[property].attempt = userTasksPerDay[property]
      }
      for (let action in summary) {
        let name = h("td", action);
        let left = schedule.dailyLimitHit(action)-summary[action].attempt
        if(left<=0) left = 0;
        getTaskname(action)
          .then((n) => (name.innerText = n))
          .catch((e) => console.error(e));
        tbl.add(
          h("tr", [
            name,
            h("td", summary[action].assigned),
            h("td", summary[action].inprogress),
            h("td", summary[action].success),
            h("td", summary[action].failure),
            h("td", schedule.dailyLimitHit(action)),
            h("td", left),
          ])
        );
      }
     }
    }
  }

  function status_1(taskid) {
    const status = store.getTaskStatus(taskid, 202)
    if(!status) return
    if(status.code == 102) return "inprogress"
    if(status.code == 200) return "success"
    if(status.err) return "failure"
  }


  /*    way/
   * show the avatar pane and react to new messages. If we
   * find that messages have reduced/cleared, restart from
   * scratch as that's our expected case (logged out and
   * re-logged in).
   *
   *    problem/
   * we need to scroll to show the latest message to the
   * user. However, the user may have himself scrolled up
   * to look at earlier messages and we don't want to rudely
   * drag him down again.
   *
   *    way/
   * keep track of the last time the user scrolled manually
   * and don't do anything for at least 15 seconds after
   * that. Otherwise scroll down for each new message.
   */
  function avatar_pane_1() {
    let cont = h('.msgpane')
    let msgblock = h('.msgblock')

    cont.c(
      h('.title', dh.greeting(ui)),
      h('.subtitle', "Let's get started!"),
      msgblock
    )

    let scrolledon = 0
    let autoscroll = false
    msgblock.attr({
      onscroll: () => autoscroll||(scrolledon = Date.now())
    })

    let shown = 0
    store.react('user.msgs', msgs => {
      if(!msgs) return
      if(shown > msgs.length) {
        msgblock.c()
        shown = 0
      }
      let scroll = false
      for(let i = shown;i < msgs.length;i++) {
        let msg = msg_1(msgs[i])
        if(msg) {
          msgblock.add(msg)
          scroll = true
        }
      }
      shown = msgs.length
      if(!scroll) return
      let now = Date.now()
      if(now - scrolledon > 15 * 1000) {
        autoscroll = true
        msgblock.scrollTop = msgblock.scrollHeight
        setTimeout(() => autoscroll = false, 200)
      }
    })
    return cont
  }

  function msg_1(msg) {
    let r = h(".msg")
    let name = h(".name", dh.userName(msg.from))
    let txt = txt_1(msg)
    let src = msg.from.logo || "./default-user-image.png"
    let icon = h("img.boticon", { src })
    let tm = h(".tm")
    r.c(icon, name, tm, txt, h(".clearfix"))

    store.react("time.now", n => {
      let tm_ = get_tm_1(msg.t, n)
      if(tm) tm.c(tm_)
    })

    return r
  }

  function txt_1(msg) {
    let txt = dh.md(dh.emojify(msg.chat))
    let cls = ".txt"
    if(dh.isJustEmojis(msg.chat)) cls += ".just-emojis"
    return h(cls, txt)
  }

  function get_tm_1(t, n) {
    if(!n) return ""

    let r_1 = (d, v) => {
      d = Math.floor(d)
      if(d != 1) v += "s"
      return `${d} ${v} ago`
    }

    t = new Date(t).getTime()
    let secs = Math.floor((n.getTime() - t)/1000)

    if(secs < 1) return r_1(1, "second")

    let diff = secs / 31536000;
    if(diff > 1) return r_1(diff, "year")

    diff = secs / 2592000;
    if(diff > 1) return r_1(diff, "month")

    diff = secs / 86400;
    if(diff > 1) return r_1(diff, "day")

    diff = secs / 3600;
    if(diff > 1) return r_1(diff, "hour")

    diff = secs / 60;
    if(diff > 1) return r_1(diff, "minute")

    return r_1(secs, "second")
  }

}

module.exports = {
  e
}
