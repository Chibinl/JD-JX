/*
超级直播间红包雨
每天20-23半点可领，每日上限未知
活动时间：活动时间未知
更新地址：https://raw.githubusercontent.com/shylocks/Loon/main/jd_live_redrain.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#超级直播间红包雨
30,31 20-23/1 15 1 * https://raw.githubusercontent.com/shylocks/Loon/main/jd_live_redrain.js, tag=超级直播间红包雨, img-url=https://raw.githubusercontent.com/yogayyy/Scripts/main/Icon/shylock/jd_live_redrain.png, enabled=true

================Loon==============
[Script]
cron &quot;30,31 20-23/1 15 1 *&quot; script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_live_redrain.js, tag=超级直播间红包雨

===============Surge=================
超级直播间红包雨 = type=cron,cronexp=&quot;30,31 20-23/1 15 1 *&quot;,wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_live_redrain.js

============小火箭=========
超级直播间红包雨 = type=cron,script-path=https://raw.githubusercontent.com/shylocks/Loon/main/jd_live_redrain.js, cronexpr=&quot;30,31 20-23/1 15 1 *&quot;, timeout=200, enable=true
 */
const $ = new Env(&apos;超级直播间红包雨&apos;);

const notify = $.isNode() ? require(&apos;./sendNotify&apos;) : &apos;&apos;;
/de.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require(&apos;./jdCookie.js&apos;) : &apos;&apos;;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = &apos;&apos;, message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === &apos;false&apos;) console.log = () => {
  };
  if(JSON.stringify(process.env).indexOf(&apos;GITHUB&apos;)>-1) process.exit(0)
}else {
  let cookiesData = $.getdata(&apos;CookiesJD&apos;) || &quot;[]&quot;;
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata(&apos;CookieJD2&apos;), $.getdata(&apos;CookieJD&apos;)]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== &quot;&quot; && item !== null && item !== undefined);
}
const JD_API_HOST = &apos;https://api.m.jd.com/api&apos;;
let ids = {
  &apos;21&apos;: &apos;RRA42SucXFqAPggaoYP4c3JYZLHGbkG&apos;,
  &apos;22&apos;: &apos;RRAPZRA9mVCzpjH38RUBPseJiZ6oj8&apos;,
  &apos;23&apos;: &apos;RRA4AmPxr1Qv1vTDpFgNS57rjn1mjGQ&apos;,
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, &apos;【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取&apos;, &apos;https://bean.m.jd.com/&apos;, {&quot;open-url&quot;: &quot;https://bean.m.jd.com/&quot;});
    return;
  }
  await getRedRain();

  if(!$.activityId) return
  let nowTs = new Date().getTime()
  if (!($.st <= nowTs && nowTs < $.ed)) {
    $.log(`远程红包雨配置获取错误，从本地读取配置`)
    $.log(`\n`)
    let hour = (new Date().getUTCHours() + 8) %24
    if (ids[hour]){
      $.activityId = ids[hour]
      $.log(`本地红包雨配置获取成功`)
    } else{
      $.log(`无法从本地读取配置，请检查运行时间`)
      return
    }
  } else{
    $.log(`远程红包雨配置获取成功`)
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = &apos;&apos;;
      message = &apos;&apos;;
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {&quot;open-url&quot;: &quot;https://bean.m.jd.com/&quot;});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata(&apos;&apos;, `CookieJD${i ? i + 1 : &quot;&quot;}`);//cookie失效，故清空cookie。$.setdata(&apos;&apos;, `CookieJD${i ? i + 1 : &quot;&quot; }`);//cookie失效，故清空cookie。
        }
        continue
      }
      let nowTs = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000
      // console.log(nowTs, $.startTime, $.endTime)
      await receiveRedRain();
      await showMsg();
    }
  }
})()
  .catch((e) => {
    $.log(&apos;&apos;, ` ${$.name}, 失败! 原因: ${e}!`, &apos;&apos;)
  })
  .finally(() => {
    $.done();
  })

function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, &apos;&apos;, `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve()
  })
}

function getRedRain() {
  let body = &apos;body=%7B%22liveId%22%3A%223316650%22%7D&build=167490&client=apple&clientVersion=9.3.2&openudid=53f4d9c70c1c81f1c8769d2fe2fef0190a3f60d2&sign=f9454cb822adec3cb255f3176eb4b736&st=1610712755247&sv=110&apos;
  return new Promise(resolve => {
    $.post(taskPostUrl(&apos;liveActivityV842&apos;, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data && data.data.iconArea) {
              let act = data.data.iconArea.filter(vo=>vo[&apos;type&apos;]===&quot;platform_red_packege_rain&quot;)[0]
              if (act) {
                let url = act.data.activityUrl
                $.activityId = url.substr(url.indexOf(&quot;id=&quot;) + 3)
                $.st = act.startTime
                $.ed = act.endTime
                console.log($.activityId)

                console.log(`下一场红包雨开始时间：${new Date($.st)}`)
                console.log(`下一场红包雨结束时间：${new Date($.ed)}`)
              } else {
                console.log(`暂无红包雨`)
              }
            } else {
              console.log(`暂无红包雨`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function receiveRedRain() {
  return new Promise(resolve => {
    const body = {&quot;actId&quot;: $.activityId};
    $.get(taskUrl(&apos;noahRedRainLottery&apos;, body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.subCode === &apos;0&apos;) {
              console.log(`领取成功，获得${JSON.stringify(data.lotteryResult)}`)
              // message+= `领取成功，获得${JSON.stringify(data.lotteryResult)}\n`
              message += `${data.lotteryResult.jPeasList[0].ext}:${(data.lotteryResult.jPeasList[0].quantity)}京豆\n`

            } else if (data.subCode === &apos;8&apos;) {
              console.log(`今日次数已满`)
              message += `领取失败，今日已签到\n`;
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskPostUrl(function_id, body = body) {
  return {
    url: `https://api.m.jd.com/client.action?functionId=${function_id}`,
    body: body,
    headers: {
      &apos;Host&apos;: &apos;api.m.jd.com&apos;,
      &apos;content-type&apos;: &apos;application/x-www-form-urlencoded&apos;,
      &apos;accept&apos;: &apos;*/*&apos;,
      &apos;user-agent&apos;: &apos;JD4iPhone/167408 (iPhone; iOS 14.2; Scale/3.00)&apos;,
      &apos;accept-language&apos;: &apos;zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6&apos;,
      //&quot;Cookie&quot;: cookie,
    }
  }
}

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&_=${new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000}`,
    headers: {
      &quot;Accept&quot;: &quot;*/*&quot;,
      &quot;Accept-Encoding&quot;: &quot;gzip, deflate, br&quot;,
      &quot;Accept-Language&quot;: &quot;zh-cn&quot;,
      &quot;Connection&quot;: &quot;keep-alive&quot;,
      &quot;Content-Type&quot;: &quot;application/x-www-form-urlencoded&quot;,
      &quot;Host&quot;: &quot;api.m.jd.com&quot;,
      &quot;Referer&quot;: &quot;https://h5.m.jd.com/active/redrain/index.html&quot;,
      &quot;Cookie&quot;: cookie,
      &quot;User-Agent&quot;: $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : &quot;jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0&quot;) : ($.getdata(&apos;JDUA&apos;) ? $.getdata(&apos;JDUA&apos;) : &quot;jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0&quot;),
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      &quot;url&quot;: `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      &quot;headers&quot;: {
        &quot;Accept&quot;: &quot;application/json,text/plain, */*&quot;,
        &quot;Content-Type&quot;: &quot;application/x-www-form-urlencoded&quot;,
        &quot;Accept-Encoding&quot;: &quot;gzip, deflate, br&quot;,
        &quot;Accept-Language&quot;: &quot;zh-cn&quot;,
        &quot;Connection&quot;: &quot;keep-alive&quot;,
        &quot;Cookie&quot;: cookie,
        &quot;Referer&quot;: &quot;https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2&quot;,
        &quot;User-Agent&quot;: $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : &quot;jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0&quot;) : ($.getdata(&apos;JDUA&apos;) ? $.getdata(&apos;JDUA&apos;) : &quot;jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0&quot;)
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data[&apos;retcode&apos;] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data[&apos;base&apos;].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == &quot;object&quot;) {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function jsonParse(str) {
  if (typeof str == &quot;string&quot;) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, &apos;&apos;, &apos;不要在BoxJS手动复制粘贴修改cookie&apos;)
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e=&quot;GET&quot;){t=&quot;string&quot;==typeof t?{url:t}:t;let s=this.get;return&quot;POST&quot;===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,&quot;POST&quot;)}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile=&quot;box.dat&quot;,this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator=&quot;\n&quot;,this.startTime=(new Date).getTime(),Object.assign(this,e),this.log(&quot;&quot;,`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return&quot;undefined&quot;!=typeof module&&!!module.exports}isQuanX(){return&quot;undefined&quot;!=typeof $task}isSurge(){return&quot;undefined&quot;!=typeof $httpClient&&&quot;undefined&quot;==typeof $loon}isLoon(){return&quot;undefined&quot;!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata(&quot;@chavy_boxjs_userCfgs.httpapi&quot;);i=i?i.replace(/\n/g,&quot;&quot;).trim():i;let r=this.getdata(&quot;@chavy_boxjs_userCfgs.httpapi_timeout&quot;);r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split(&quot;@&quot;),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:&quot;cron&quot;,timeout:r},headers:{&quot;X-Key&quot;:o,Accept:&quot;*/*&quot;}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require(&quot;fs&quot;),this.path=this.path?this.path:require(&quot;path&quot;);const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require(&quot;fs&quot;),this.path=this.path?this.path:require(&quot;path&quot;);const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,&quot;.$1&quot;).split(&quot;.&quot;);let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):&quot;&quot;;if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,&quot;&quot;):e}catch(t){e=&quot;&quot;}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?&quot;null&quot;===o?null:o||&quot;{}&quot;:&quot;{}&quot;;try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require(&quot;got&quot;),this.cktough=this.cktough?this.cktough:require(&quot;tough-cookie&quot;),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers[&quot;Content-Type&quot;],delete t.headers[&quot;Content-Length&quot;]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{&quot;X-Surge-Skip-Scripting&quot;:!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on(&quot;redirect&quot;,(t,e)=>{try{if(t.headers[&quot;set-cookie&quot;]){const s=t.headers[&quot;set-cookie&quot;].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers[&quot;Content-Type&quot;]&&(t.headers[&quot;Content-Type&quot;]=&quot;application/x-www-form-urlencoded&quot;),t.headers&&delete t.headers[&quot;Content-Length&quot;],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{&quot;X-Surge-Skip-Scripting&quot;:!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=&quot;POST&quot;,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={&quot;M+&quot;:(new Date).getMonth()+1,&quot;d+&quot;:(new Date).getDate(),&quot;H+&quot;:(new Date).getHours(),&quot;m+&quot;:(new Date).getMinutes(),&quot;s+&quot;:(new Date).getSeconds(),&quot;q+&quot;:Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+&quot;&quot;).substr(4-RegExp.$1.length)));for(let s in e)new RegExp(&quot;(&quot;+s+&quot;)&quot;).test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:(&quot;00&quot;+e[s]).substr((&quot;&quot;+e[s]).length)));return t}msg(e=t,s=&quot;&quot;,i=&quot;&quot;,r){const o=t=>{if(!t)return t;if(&quot;string&quot;==typeof t)return this.isLoon()?t:this.isQuanX()?{&quot;open-url&quot;:t}:this.isSurge()?{url:t}:void 0;if(&quot;object&quot;==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t[&quot;open-url&quot;],s=t.mediaUrl||t[&quot;media-url&quot;];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t[&quot;open-url&quot;]||t.url||t.openUrl,s=t[&quot;media-url&quot;]||t.mediaUrl;return{&quot;open-url&quot;:e,&quot;media-url&quot;:s}}if(this.isSurge()){let e=t.url||t.openUrl||t[&quot;open-url&quot;];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=[&quot;&quot;,&quot;==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3==============&quot;];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join(&quot;\n&quot;)),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log(&quot;&quot;,`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log(&quot;&quot;,`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log(&quot;&quot;,`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

