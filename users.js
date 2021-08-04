'use strict'
const fs = require('fs').promises
const puppeteer = require('puppeteer')
const loc = require('./loc.js')
var CryptoJS = require("crypto-js");
const path = require('path')

/*    understand/
 * keep track of the users and their browsers
 */
let USERS = {}
let PUPPET_SHOW = false
const DEFAULT_TIMEOUT = 30 * 1000
let TIMEOUT = DEFAULT_TIMEOUT

/*    understand/
 * keep unique objects to track errors
 */
const NEEDS_CAPTCHA = { err: 1 }
const LOGIN_ERR = { err: 2 }
const PREMIUM_ERR = { err :3 }
const COOKIE_EXP = { err: 4 }
const VC_ERR = { err: 5 }

function setPuppetShow(show) { PUPPET_SHOW = show }
function setTimeout(tm) {
  tm = parseInt(tm)
  if(isNaN(tm)) TIMEOUT = DEFAULT_TIMEOUT
  else TIMEOUT = tm
}

/*    way/
 * Close any existing browsers and link up the ui's (user
 * info's) with the associated users - keeping any
 * additional information we may have cached
 */
function set(uis) {
  closeBrowsers()

  let users = USERS
  USERS = {}
  if(uis) {
    uis.forEach(ui => {
      USERS[ui.id] = Object.assign({ ui }, users[ui.id])
      delete users[ui.id]
    })
  }
}

function closeBrowsers() {
  for(let k in USERS) {
    if(USERS[k].browserCache) {
      USERS[k].browserCache.browser.close()
      delete USERS[k].browserCache
    }
  }
}

/*    way/
 * If there is a valid cached browser return that - other
 * wise launch a new browser with the (proxy and show) settings
 * and return that - adding it to the cache for next time.
 */
function browser(user) {
  if(user.browserCache) {
    if(user.browserCache.proxy == user.proxy &&
      user.browserCache.puppetShow == PUPPET_SHOW) {
      return Promise.resolve(user.browserCache.browser)
    }
    user.browserCache.browser.close()
    delete user.browserCache
  }
  let args = []
  if(user.proxy) {
    args.push(`--proxy-server=socks5://localhost:${uctx.proxy}`)
  }
  return new Promise((resolve, reject) => {
    let puppetShow = PUPPET_SHOW

    let pexe = puppeteer.executablePath()
    let rx_isasar1 = /\\app.asar\\/
    if(pexe.match(rx_isasar1)) {
      pexe = pexe.replace(rx_isasar1, "\\app.asar.unpacked\\")
    }
    let rx_isasar2 = /\/app.asar\//
    if(pexe.match(rx_isasar2)) {
      pexe = pexe.replace(rx_isasar2, "/app.asar.unpacked/")
    }

    let lopts = {
      headless:!puppetShow,
      executablePath: pexe,
      args
    }
    if(process.env.INDOCKER) {
      lopts = {
        headless: true,
        args: [
          // Required for Docker version of Puppeteer
          '--no-sandbox',
          '--disable-setuid-sandbox',
          // This will write shared memory files into /tmp instead of /dev/shm,
          // because Docker’s default for /dev/shm is 64MB
          '--disable-dev-shm-usage',
        ]
      }
    }

    puppeteer.launch(lopts)
    .then(browser => {
      user.browserCache = {
        proxy: user.proxy,
        puppetShow,
        browser,
      }
      browser.on("disconnect", () => {
        if(user.browserCache) {
          user.browserCache = null
          delete user.browserCache
        }
      })
      resolve(browser)
    })
      .catch(reject)
  })
}

/*    way/
 * launch a browser with the current configuration, login to
 * linkedin, check navigator and cache the result with it's
 * configuration
 * TODO: should this be configurable? - Facebook browser? Reddit browser? Twitter browser? ...
 */
async function linkedInPage(cfg, auth, browser) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  page.setCacheEnabled(false)
  if(cfg.timeout) await page.setDefaultTimeout(cfg.timeout)
  else await page.setDefaultTimeout(TIMEOUT)
  if(process.env.DEBUG) {
    page.on("console", msg => console.log(msg.text()))
  }
  const cookie_f1 = loc.savedCookieFile(auth.id)
  const cookie_f2 = loc.cookieFile(auth.id)
  const loggedin = await cookie_login_1(cookie_f1, page)
                    || await cookie_login_1(cookie_f2, page)
  if(!loggedin) {
    await auth_login_1(auth, page)
    await save_login_cookie_1(page, auth)
  }
  //TODO: re-enable this check after QA cycle
  // if(!process.env.DEBUG) await check_premium_enabled_1(page)
  await randomly_scroll_sometimes_1()
  await check_capcha_1()

  return page

  async function randomly_scroll_sometimes_1() {
    const call = Math.floor(Math.random() * 16)
    if(call == 8) await autoScroll(page)
  }

  // Captcha Check
  async function check_capcha_1() {
    try {
      await page.waitForSelector('#rc-anchor-container')
      throw NEEDS_CAPTCHA
    } catch(e) {}
  }

 
  /*    outcome/
   * We check if we have an element (li-icon) with type
   * "premium-wordmark" which would indicate that we have premium
   * enabled. Otherwise we check if we have a li-icon with type
   * "sales-navigator-app-icon" which would indicate we have a Sales
   * Navigator subscription.
   */
  async function check_premium_enabled_1(page) {
    let enabled = await page.evaluate(async () => {
      let elems = document.getElementsByTagName('li-icon')
      for(let i = 0;i < elems.length;i++) {
        let t = elems[i].getAttribute('type')
        if(t == 'premium-wordmark' ||
            t == 'sales-navigator-app-icon') return true
      }
    })
    if(!enabled) throw PREMIUM_ERR
  }

  async function cookie_login_1(cookie_f, page) {
    try {
      let cookie_s = await fs.readFile(cookie_f)
      let cookies = JSON.parse(cookie_s)
      await page.setCookie(...cookies)

      await page.goto('https://www.linkedin.com/')
      await page.waitFor('input[role=combobox]')

      return true

    } catch(e) {
      let cookie_expired = await cookie_exp_check()
      if(cookie_expired) throw COOKIE_EXP
    }

    try {
      await page.waitFor('[data-resource="feed/badge"]')

      return true
    } catch (e) {}

    return false
  }

  async function cookie_exp_check(){
    try{
      await page.waitForSelector('.error-code')
      let text = await page.evaluate(()=>{
        const e = document.querySelector('.error-code')
        return e ? e.innerText : null
      })

      if(text.includes('ERR_TOO_MANY_REDIRECTS') || text.includes('HTTP ERROR 429')){
        return true
      }
     }catch(e) {}
     return false      
  }

  async function save_login_cookie_1(page, auth) {
    try {
      let cookie_f = loc.cookieFile(auth.id)
      let cookies = await page.cookies()
      await fs.writeFile(cookie_f, JSON.stringify(cookies))
    } catch(e) {
      console.error(e)
    }
  }

  // Login from the saved linkedin creds
  async function creds_login(auth,page){
    const fs1 = require('fs')
    try{
      let creds_f = loc.linkedinCredsFile(auth.id)
      var cred_obj = JSON.parse(fs1.readFileSync(creds_f, 'utf8'));
      var username = cred_obj.username
      var enc_password = cred_obj.password
      var decrypted = CryptoJS.AES.decrypt(enc_password,'secret key 123')
      var password = decrypted.toString(CryptoJS.enc.Utf8)
      
      await page.goto('https://www.linkedin.com/uas/login')

      const user_name = "input#username"
      await page.waitForSelector(user_name)
      await page.type(user_name, username)
    
      const pass_word = "input#password"
      await page.waitForSelector(pass_word)
      await page.type(pass_word, password)
      
      const submitButton = "button.btn__primary--large"
      await page.waitForSelector(submitButton)
      await page.click(submitButton)

      await checkNotNow(page)
    
      return true
    }catch(e){
      if(e.code === 'ENOENT'){
        return false
      }
      else console.log(e)
    }
  }

  async function auth_login_1(auth, page) {
    let cred_loggedin = await creds_login(auth,page)

    if(!cred_loggedin){
      if(!auth.linkedinUsername || !auth.linkedinPassword) throw LOGIN_ERR

      try {
        await page.goto('https://www.linkedin.com/uas/login')

        const user_name = "input#username"
        await page.waitForSelector(user_name)
        await page.type(user_name, auth.linkedinUsername)

        const pass_word = "input#password"
        await page.waitForSelector(pass_word)
        await page.type(pass_word, auth.linkedinPassword)

        const submitButton = "button.btn__primary--large"
        await page.waitForSelector(submitButton)
        await page.click(submitButton)
        await checkNotNow(page)
        await page.waitFor('input[role=combobox]',{timeout:90000})

      }catch(e) {
        if(e.name == 'TimeoutError'){
          let ver_code = await check_email_vc_1(page)
          if(ver_code) throw VC_ERR
          let login_err = await invalid_cred_check(page)
          if(login_err) throw LOGIN_ERR
          if(!ver_code && !login_err) console.log(e)
        }else{
          console.log(e)
        }
      }
    }
  }
  
  //Handling linkedin remember now page
    async function checkNotNow(page){
      try{
        const notNowSelector = '[data-cie-control-urn="checkpoint_remember_me_save_info_no"]'
        await page.waitForSelector(notNowSelector)
        await page.click(notNowSelector)
      }catch(e) {}
    }

   // Email Verification Code Check
   async function check_email_vc_1() {
    try{
      await page.waitForSelector('.form__subtitle')
      let veri_text = await page.evaluate(async () => {
        const e = document.querySelector('.form__subtitle')
        return e ? e.innerText : null
      })
      if(veri_text.includes('suspicious')){
        return true
      }
    }catch(e) {}
    return false
  }



   // Check if login failed or not
   async function invalid_cred_check(page1){
    try{
      let login_err_ele = await ele_check(['#error-for-username','#error-for-password'],page1)
      if(login_err_ele) return true
    }catch(e) {}

    return false
  }
  
  //Checks if an element or list of elements is present in a page or not 
  async function ele_check(sel_list,activepage){
    
    const jsHandle = await activepage.waitForFunction((selectors) => {
        for (const selector of selectors) {
          if (document.querySelector(selector) !== null) {
            return selector;
          }
        }
        return false;
      }, {}, sel_list)
    const selector = await jsHandle.jsonValue()
    if(selector == sel_list[0] || selector == sel_list[1]) return true
    return false
  }

}

/*    outcome/
 * Scroll down the page a bit
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0
      let distance = 100
      let maxdistance = 5000 + Math.floor(Math.random() * 10000)
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if(totalHeight >= scrollHeight ||
          totalHeight > maxdistance){
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}




/*    way/
 * return user information (including associated proxy
 * port)
 */
function get(id) {
  let r = USERS[id]
  if(r) r.proxy = UIPS[id]
  return r
}

/*    way/
 * return relevant user information about all users
 */
function info() {
  const r = []
  for(let k in USERS) {
    const curr = USERS[k].ui
    r.push({
      id: curr.id,
      tenant: curr.tenant,
      userName: curr.userName,
      firstName: curr.firstName,
      lastName: curr.lastName,
      title: curr.title,
      email: curr.email,
      phone: curr.phone,
      twitter: curr.twitter,
      linkedin: curr.linkedin,
      facebook: curr.facebook,
      linkedinUsername: curr.linkedinUsername,
      timeZone: curr.timeZone,
      pic: curr.pic,
      bots: curr.bots,
    })
  }
  return r
}

/*    understand/
 * holds user to proxy ip mapping
 */
let UIPS = {}
function setips(uips) {
  UIPS = {}
  if(uips) {
    uips.forEach(m => UIPS[m[0]] = m[1])
  }
}

/*    understand/
 * save the cookie provided to use manually by the user
 */
function saveCookieFile(info) {
  const cookie_f = loc.savedCookieFile(info.userid)
  let data = []
  data.push(info.cookie)
  fs.writeFile(cookie_f, JSON.stringify(data), err => {
    if(err) {
      console.error("Error while writing cookie file")
      console.error(err)
      throw err
    } else {
      users.closeBrowsers()
    }
  })
}

/*save linkedin credentials*/

function saveLinkedInCredentials(creds) {
  const f = path.join(loc.linkedinCreds(), `User-${creds.userid}.json`)
  var ciphertext = CryptoJS.AES.encrypt(creds.password, 'secret key 123').toString(); 
  creds.password = ciphertext
  fs.writeFile(f, JSON.stringify(creds), 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  })
}
module.exports = {
  set,
  get,
  setips,
  browser,
  setPuppetShow,
  setTimeout,
  linkedInPage,
  autoScroll,
  closeBrowsers,
  info,
  saveCookieFile,
  saveLinkedInCredentials,
  NEEDS_CAPTCHA,
  LOGIN_ERR,
  PREMIUM_ERR,
  COOKIE_EXP,
  VC_ERR
}
