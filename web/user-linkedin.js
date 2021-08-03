
'use strict'

import { userName } from "../display-helpers";
import "./user-linkedin.scss"

/*    understand/
 * main entry point into our program
 */
function main() {
  const btn = document.getElementById('btn')
  btn.onclick = () => saveLinkedInCredentials()
}

function saveLinkedInCredentials() {
  var username = document.getElementById('username');
  var usr= username.value
  var password = document.getElementById('pwd');
  var pwd= password.value
  var userid = document.getElementById('uid');
  var uid= userid.value
  const no_err = check(usr,pwd,uid,username,password,userid)
  if(no_err) {
    const creds = {
        username : usr,
        userid: uid,
        password: pwd
        }
    
    window.save.userlinkedin(creds)
    
    .then(() =>  {document.getElementById('errmsg').innerHTML="Saved LinkedIn Credentials";
        document.getElementById('errmsg').style.color='Black'
        document.getElementById('username').value="";
        document.getElementById('pwd').value="";
        document.getElementById('uid').value =""
    })
    .catch(err => {
        document.getElementById('errmsg').innerHTML="Failed to save LinkedIn Credentials";
        console.error(err)
    })
    
    }
    
}

function check(usr,pwd,uid,username,password,userid) {
    if(!usr && !pwd){
       document.getElementById('errmsg').innerHTML="Username and Pssword is empty"       
        return false
    }
    else if(!usr ) {
        document.getElementById('errmsg').innerHTML="Username is empty"   
        username.focus() ;
        return false
    }
    else if(!pwd){
        document.getElementById('errmsg').innerHTML="Password is empty"      
        password.focus() ;
        return false
    } 
    else if(!uid){  
        document.getElementById('errmsg').innerHTML="UserId is not valid"      
        userid.focus() ;
        return false
    }
    else return true

}

main()
