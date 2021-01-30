#感谢 Chipun 大佬
#圈x 添加编辑
[MITM]
wx.10086.cn

[rewrite_local]
# 中国移动10086 获取cookie
^http:\/\/wx.10086.cn\/website\/taskCenter\/index\? url script-request-header https://raw.githubusercontent.com/chavyleung/scripts/master/10086/10086.cookie.js
^http:\/\/wx.10086.cn\/website\/taskCenter\/sign\? url script-request-header https://raw.githubusercontent.com/chavyleung/scripts/master/10086/10086.cookie.js
^https:\/\/clientaccess.10086.cn\/biz-orange\/LN\/uamrandcodelogin\/autoLogin url script-request-body https://raw.githubusercontent.com/chavyleung/scripts/master/10086/10086.fee.cookie.js
^https:\/\/clientaccess.10086.cn\/biz-orange\/BN\/realFeeQuery\/getRealFee url script-request-body https://raw.githubusercontent.com/chavyleung/scripts/master/10086/10086.fee.cookie.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/Chibinl/JD-JX/main/10086.js

const cookieName = '中国移动'
const tokenurlKey = 'chavy_tokenurl_10086'
const tokenheaderKey = 'chavy_tokenheader_10086'
const signurlKey = 'chavy_signurl_10086'
const signheaderKey = 'chavy_signheader_10086'
const chavy = init()
const tokenurlVal = chavy.getdata(tokenurlKey)
const tokenheaderVal = chavy.getdata(tokenheaderKey)
const signurlVal = chavy.getdata(signurlKey)
let signheaderVal = chavy.getdata(signheaderKey)
const signinfo = {}

sign()

function loginapp(cb) {
  const url = { url: tokenurlVal, headers: JSON.parse(tokenheaderVal) }
  chavy.get(url, (error, response, data) => {
    const respcookie = response.headers['Set-Cookie']
    chavy.log(`${cookieName}, loginapp - respcookie: ${respcookie}`)
    if (respcookie && respcookie.indexOf('d.sid=') >= 0) {
      const signheaderObj = JSON.parse(signheaderVal)
      let signcookie = signheaderObj['Cookie']
      signcookie = signcookie.replace(/d\.sid=([^;]*)/, respcookie.match(/d\.sid=([^;]*)/)[0])
      signheaderObj['Cookie'] = signcookie
      signheaderVal = JSON.stringify(signheaderObj)
    }
    cb()
  })
}

function sign() {
  loginapp(() => {
    const url = { url: signurlVal, headers: JSON.parse(signheaderVal) }
    chavy.get(url, (error, response, data) => {
      chavy.log(`${cookieName}, data: ${data}`)
      const result = JSON.parse(data)
      let subTitle = ``
      let detail = ``
      if (result.rtnCode == '0') {
        subTitle = `签到结果: 成功`
        detail = `连签: ${result.object.signDays}天`
      } else if (result.rtnCode == '-9999' && result.object.status == '50001') {
        subTitle = `签到结果: 成功 (重复签到)`
        detail = `说明: ${result.object.message}`
      } else {
        subTitle = `签到结果: 失败`
        detail = `说明: 详见日志`
      }
      chavy.msg(cookieName, subTitle, detail)
      chavy.done()
    })
  })
}

function init() {
  isSurge = () => {
    return undefined === this.$httpClient ? false : true
  }
  isQuanX = () => {
    return undefined === this.$task ? false : true
  }
  getdata = (key) => {
    if (isSurge()) return $persistentStore.read(key)
    if (isQuanX()) return $prefs.valueForKey(key)
  }
  setdata = (key, val) => {
    if (isSurge()) return $persistentStore.write(key, val)
    if (isQuanX()) return $prefs.setValueForKey(key, val)
  }
  msg = (title, subtitle, body) => {
    if (isSurge()) $notification.post(title, subtitle, body)
    if (isQuanX()) $notify(title, subtitle, body)
  }
  log = (message) => console.log(message)
  get = (url, cb) => {
    if (isSurge()) {
      $httpClient.get(url, cb)
    }
    if (isQuanX()) {
      url.method = 'GET'
      $task.fetch(url).then((resp) => cb(null, resp, resp.body))
    }
  }
  post = (url, cb) => {
    if (isSurge()) {
      $httpClient.post(url, cb)
    }
    if (isQuanX()) {
      url.method = 'POST'
      $task.fetch(url).then((resp) => cb(null, resp, resp.body))
    }
  }
  done = (value = {}) => {
    $done(value)
  }
  return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
