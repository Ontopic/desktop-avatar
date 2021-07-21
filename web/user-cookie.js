'use strict'

import "./user-cookie.scss"

/*    understand/
 * main entry point into our program
 */
function main() {
  const btn = document.getElementById('btn')
  btn.onclick = () => saveCookieFile()
}

function saveCookieFile() {
  const username = document.getElementById('username').value;
  const userid = document.getElementById('userid').value;
  const value = document.getElementById('liatvalue').value;
  const err = check(username, userid, value)
  if(err)document.getElementById('errmsg').innerHTML=err;
  else{
    const info = {
      username,
      userid,
      cookie: {
        name: "li_at",
        domain: "www.linkedin.com",
        value,
      }
    }
    
    window.save.usercookie(info)
    .then(() => {document.getElementById('errmsg').innerHTML="Cookie Saved"
        document.getElementById('errmsg').style.color='Black'
        document.getElementById('username').value="";
        document.getElementById('userid').value="";
        document.getElementById('liatvalue').value="";
    })
    .catch(err => {
      document.getElementById('errmsg').innerHTML="Failed to save Cookie"
      console.error(err)
    })
  }
  }
  

function check(username, userid, value) {
  if(!username) return "Username is empty"
  else if(!userid || isNaN(userid)) return "UserId is not valid"
  else if(!value || value.length <= 100) return "Cookie is not valid"
  else return null
}

main()
