'use strict'
const { h } = require('@tpp/htm-x')
const req = require('@tpp/req')
import "./login.scss"

/*    understand/
 * show the login form and allow the user to navigate
 * by pressing enter and spacebar etc
 */
function e(log, store) {
  if(document.getElementById("loader"))document.getElementById("loader").remove()

  let row = h(".row")
  let img = h(".side_image",[
    h("img", { src: "./avatar.svg"}),
  ])
    
  let column_left = h(".column left",[
    h("img", { src: "./sbox_img.png" ,style:{
      width:"200px",
      "margin-top":"10px"
    }}),
    h("br"),
    h("h4", "Welcome to Desktop Avatar"),
    img
  ])
  
  let section = h("section.Form mx-4 my-5")
  let container = h(".form_container")
  let login_row = h(".row")
  let h1 = h("h1","Login")
  let login_col = h(".col-lg px-5 pt-5")
  let br1 = h("br")
  let column_right = h(".column right")
  let name = h("input.form-control my-3 p-4", {
    autofocus: true,
    placeholder: "Email or Username",
    onkeydown: e => {
      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        pw.focus()
      }
    },
  })
  let pw = h("input.form-control my-3 p-4", {
    type: "password",
    placeholder: "Password",
    onkeydown: e => {
      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        submit_1()
      }
    },
  })
  let login_err = h("span#errmsg")
  let submit = h(".submit", {
    tabindex: 0,
    onclick: submit_1,
    onkeydown: e => {

      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        submit_1()
      }
      if(e.keyCode == 32
        || e.key == "Space"
        || e.code == "Space") {
        e.preventDefault()
        submit_1()
      }

    },
  },h("span.lgn", {
  },"Login"))

  let formContainer = h(".form-row",[
    h(".col-lg", [
      h("label", "Username"),
      name,
      h("label", "Password"),
      pw,
      login_err,
      h('br'),
      submit
    ])  
  ])

  return row.c(
    column_left,
    column_right.c(
       section.c(
         container.c(
           login_row.c(
             login_col.c(h1,br1,
              formContainer)))))
  )

  function submit_1() {
    let serverURL = store.get("settings.serverURL")
    if(!serverURL || !serverURL.trim()) {
      log.trace("err/login/emptyServerURL")
      alert("Please set the server URL in settings")
      window.show.settings()
      return
    }
    let usr = name.value
    let pwd = pw.value
    if(!usr) {
      log.trace("err/login/emptyName")
      document.getElementById('errmsg').innerHTML="Username is empty"
      row.classList.add('err')
      name.focus()
      setTimeout(() => row.classList.remove('err'), 1000)
      return
    }
    if(!pwd) {
      log.trace("err/login/emptyPassword")
      document.getElementById('errmsg').innerHTML="Password is empty"
      row.classList.add('err')
      pw.focus()
      setTimeout(() => row.classList.remove('err'), 1000)
      return
    }
    let u = dappURL(serverURL) + "/login"
    log.trace("login/request", { usr })
    req.post(u, { usr, pwd }, (err, resp) => {
      if(err) {
        log("err/login", err)
        document.getElementById('errmsg').innerHTML="Login failed.Invalid Username or Password"
        name.focus()
        return
      }
      let ui = resp.body
      if(invalid_1(ui)) {
        log("err/login/resp/invalid", resp)
        name.focus()
        document.getElementById('errmsg').innerHTML="Login failed.Invalid Username or Password"
        return
      }
      log("login/done", { id:ui.id, usr })
      log.trace("login/info", ui)
      store.event("ui/set", ui)
      window.login.saveInfo(usr,pwd)
    })
    
  } 
}

function dappURL(u) {
  u = u.trim()
  if(!u.startsWith("http")) {
    if(u[0] == "/") u = "http:/" + u
    else u = "http://" + u
  }
  if(!u.endsWith("/")) u += "/"
  return u + "dapp/v2"
}

 function auto(log,store,usr,pwd,cb){
    setTimeout(function(){
      let serverURL = store.get("settings.serverURL")
      let u = dappURL(serverURL) + "/login" 
      req.post(u, {usr,pwd}, (err, resp) => {
      if(err) {
        log("err/login", err)
         cb()
      }
      let ui = resp.body
      if(invalid_1(ui)) {
        log("err/login/resp/invalid", resp)
        cb()      
      }
      log("login/done", { id:ui.id, usr })
      log.trace("login/info", ui)
      store.event("ui/set", ui)
      
    }) 
  },3*1000)

}

function invalid_1(resp) {
  return !resp || !resp.authKey
}

module.exports = {
  e,
  auto
}
