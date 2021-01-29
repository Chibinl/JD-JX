/*
 *  
    [mitm]
    hostname = veishop.iboxpay.com

    quanx
    [rewrite local]
    https:\/\/veishop\.iboxpay\.com\/nf_gateway\/nf_customer_activity\/day_cash\/v1\/give_gold_coin_by_video\.json url script-request-body xiaopu.js
    https:\/\/veishop.iboxpay.com\/nf_gateway\/nf-user-auth-web\/ignore_tk\/veishop\/v1\/login_by_wx.json url script-response-body xiaopu.js
 */

const $ = new Env('笑谱');
const notify = $.isNode() ? require('./sendNotify') : '';
$.isRequest = typeof $request != "undefined";
$.isResponse = typeof $response != "undefined";
$.idx = 1; // 账号扩展字符
const logs = 0;//设置0关闭日志,1开启日志
let dd = ""
let score = 0;
const liveid = '1348602411185672599'
const iboxpayheaderArr = [];
const iboxpaybodyArr = [];
const iboxpaygoldbodyArr = [];
const refreshbodyArr = []
const headerkey = `iboxpayheader${$.idx}`
const bodykey = `iboxpaybody${$.idx}`
const goldbodykey = `iboxpaygoldbody${$.idx}`
const refreshtokenkey = `iboxrefreshtoken${$.idx}`

iboxpayheaderArr.push($.getdata(headerkey));
iboxpaybodyArr.push($.getdata(bodykey));
iboxpaygoldbodyArr.push($.getdata(goldbodykey));
refreshbodyArr.push($.getdata(refreshtokenkey));

!(async () => {
    await getSessionId();
    if (!iboxpayheaderArr[0]) {
        $.msg($.name, '请先去获取cookie');
        return;
    }
    $.log(`\n============ 脚本执行时间(TM)：${new Date(new Date().getTime() + 0 * 60 * 60 * 1000).toLocaleString('zh', { hour12: false })}  =============\n`)
    for (let i = 0; i < iboxpayheaderArr.length; i++) {
        if (iboxpayheaderArr[i]) {
            iboxpayheader = iboxpayheaderArr[i];
            iboxpaybody = iboxpaybodyArr[i];
            refreshbody = refreshbodyArr[i];
            goldbody = iboxpaygoldbodyArr[i];
            $.index = i + 1;
            $.log(`\n开始【${$.name}${$.index}】\n`)
        }
        const result = await iboxpay();
        if (result) return;
        await getAct();
        await coin();
        await watch_livevideo();
        await profit();
        await Msg();
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())

function getSessionId() {
    return new Promise((resolve) => {
        if ($.isRequest) {
            if ($request.url.indexOf("give_gold_coin_by_video") !== -1 && $request.body.indexOf("isFinishWatch") !== -1 && $request.body.indexOf('"type":1') >= 0) {
                const iboxpayheader = JSON.stringify($request.headers);
                if (iboxpayheader) {
                    $.setdata(iboxpayheader, headerkey);
                    $.log(`${$.name} 视频header: ${goldbody}`)
                    $.msg($.name + $.idx, "", "[获取header]✅成功");
                }
                const iboxpaybody = $request.body;
                if (iboxpaybody) {
                    $.setdata(iboxpaybody, bodykey);
                    $.log(`${$.name} 获取视频body请求: 成功, 视频body: ${goldbody}`)
                    $.msg($.name + $.idx, "", "[获取视频body]✅成功");
                }
            }
            if ($request.url.indexOf("give_gold_coin_by_video") !== -1 && $request.body.indexOf('isFinishWatch') !== -1 && $request.body.indexOf('"type":2') >= 0) {
                const goldbody = $request.body
                if (goldbody) $.setdata(goldbody, goldbodykey)
                $.log(`${$.name} 获取金蛋视频: ${goldbody}`)
                $.msg($.name + $.idx, "", "[获取金蛋视频body]✅成功");
            }
            if ($.isResponse && $request.url.indexOf("login_by_wx") > 0) {
                const body = $response.body;
                if (body) {
                    let result = JSON.parse(body)
                    if (result.resultCode === 1) {
                        $.log(`${$.name} 获取refreshtoken: ${result.data.refreshToken}`)
                        $.setdata(result.data.refreshToken, refreshtokenkey);
                        $.msg($.name + $.idx, "", "[获取refresh token]✅成功");
                    }
                }
            }
            $.done();
        } else {
            resolve();
        }
    });
}

function iboxpay() {
    return new Promise((resolve) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let Url = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_user_center_web/shopkeeper/v1/get_context_info.json`,
            headers,
        }
        $.get(Url, async (err, resp, data) => {
            try {
                if (logs == 1) $.log(data)
                data = JSON.parse(data);
                $.iboxpay = data;
                if ($.iboxpay.resultCode == 1) {
                    $.log("...开始执行【" + $.iboxpay.data.customerInfo.nickname + "】账号任务...\n")
                } else {
                    $.log(`获取账号信息失败...\n${JSON.stringify(data)}`)
                }
                if (resp.statusCode === 401) {
                    $.log('token 失效，重新获取token')
                    const result = await GetToken()
                    resolve(result);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

function GetToken() {
    return new Promise((resolve) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `30000000000000000000${Date.now()}2bfa26fc2a7f`
        let Url = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_user_auth_web/uc/ignore_tk/v1/refresh_access_token_to_c.json`,
            headers,
            body: `{"refreshToken": "${refreshbody}", "source": "VEISHOP_APP_IOS"}`
        }
        $.post(Url, async (err, resp, data) => {
            try {
                if (logs == 1) $.log(data)
                data = JSON.parse(data);
                if (data.resultCode == 1) {
                    let _headers = JSON.parse(iboxpayheader)
                    _headers.token = data.data.accessToken;
                    iboxpayheader = JSON.stringify(_headers);
                    $.log(`获取新token成功,  ${data.data.accessToken}`)
                    $.setdata(iboxpayheader, headerkey);
                } else {
                    $.log('获取刷新token失败')
                    notify.sendNotify($.name, 'refresh token 失效');
                    resolve(true);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

function getAct() {
    return new Promise((resolve) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let Url = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/day_cash/ignore_tk/v1/query_act_list.json?source=WX_APP_KA_HTZP`,
            headers,
        }
        $.get(Url, async (err, resp, data) => {
            try {
                if (logs == 1) console.log(data)
                data = JSON.parse(data);
                if (data.resultCode == 1 && data.data.everyDayActivityList && data.data.everyDayActivityList.length > 0) {
                    const acts = data.data.everyDayActivityList;
                    const videoAct = acts.find(x => x.actName.indexOf('视频') !== -1);
                    const liveAct = acts.find(x => x.actName.indexOf('直播') !== -1);
                    $.videoAct = videoAct;
                    $.liveAct = liveAct;
                } else {
                    $.log(`获取新actId失败`)
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

async function coin() {
    let result;
    for (let i = 0; i < 5; i++) {
        result = await watch(i);
        if (!result) {
            break;
        }
        await $.wait(20000);
    }
    if (result) {
        await $.wait(10000);
        await gold();
    }
    dd = `\n【本次】${score}金币\n`
}

function watch(i) {
    return new Promise((resolve) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let body = JSON.parse(iboxpaybody);
        body.actId = $.videoAct.actId;
        let Url = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/day_cash/v1/give_gold_coin_by_video.json`,
            headers,
            body: JSON.stringify(body),
        }
        $.post(Url, async (err, resp, data) => {
            try {
                if (logs == 1) $.log(data)
                data = JSON.parse(data);
                $.complete = data;
                if ($.complete.resultCode == 1) {
                    $.log('第' + (i + 1) + '次阅读视频+' + $.complete.data.goldCoinNumber + "金币,请等待20s\n")
                    score += $.complete.data.goldCoinNumber;
                } else {
                    $.log('第' + (i + 1) + '次阅读视频' + JSON.stringify(data));
                    if ($.complete.errorDesc.indexOf('活动已结束') !== -1) {
                        await getAct();
                    }
                }
                resolve(data.resultCode == 1)
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

function gold() {
    return new Promise((resolve) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let body = JSON.parse(goldbody);
        body.actId = $.videoAct.actId;
        let Url = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/day_cash/v1/give_gold_coin_by_video.json`,
            headers,
            body: JSON.stringify(body),
        }
        $.post(Url, async (err, resp, data) => {
            try {
                if (logs == 1) console.log(data)
                data = JSON.parse(data);
                $.complete = data;
                if ($.complete.resultCode == 1) {
                    $.log('看视频金蛋+' + $.complete.data.goldCoinNumber + "金币\n")
                    dd = `\n【金蛋】${$.complete.data.goldCoinNumber}金币\n`
                } else {
                    $.log('看视频金蛋' + JSON.stringify(data));
                    if ($.complete.errorDesc.indexOf('活动已结束') !== -1) {
                        await getAct();
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

function watch_livevideo() {
    let liveids = liveid.replace(/\d{3}$/, Math.floor(Math.random() * 1000));
    return new Promise((resolve) => {
        const hour = new Date().getHours();
        if (hour <= 10 || hour >= 15) {
            resolve();
            return;
        }
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let watch_livevideourl = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/day_cash/v1/give_redbag_by_live.json`,
            headers,
            body: `{"actId":"${$.liveAct.actId}","liveId":"${liveids}"}`
        }
        $.post(watch_livevideourl, (error, resp, data) => {
            try {
                if (logs == 1) $.log(data)
                const result = JSON.parse(data);
                if (result.resultCode == 1) {
                    dd += '【直播】' + result.data.goldCoinAmt + '金币\n'
                    $.log('看直播视频+' + result.data.goldCoinAmt + "金币\n")
                } else {
                    $.log('看直播视频' + JSON.stringify(data));
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

function profit(timeout = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let headers = JSON.parse(iboxpayheader)
            headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
            let Url = {
                url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/day_cash/v1/withdraw_detail.json?source=WX_APP_KA_HTZP`,
                headers,
            }
            $.get(Url, async (err, resp, data) => {
                try {
                    if (logs == 1) $.log(data)
                    data = JSON.parse(data);
                    $.profit = data;
                    if ($.profit.resultCode == 1) {
                        dd += `【账户】${$.profit.data.wechatNickname}\n`;
                        dd += `【今日】${(Number($.profit.data.tomorrowAmt) / 100).toFixed(2)}\n`;
                        dd += `【剩余】${(Number($.profit.data.balance) / 100).toFixed(2)}\n`;
                    }
                    const amount = Number($.profit.data.balance) / 100;
                    const hour = new Date().getHours();
                    const minutes = new Date().getMinutes();
                    if (hour === 8 && minutes <= 5) {
                        if (amount > 15) {
                            await withdraw(1500)
                        } else if (amount < 10) {
                            await withdraw(100)
                        }
                    }

                } catch (e) {
                    $.logErr(e, resp);
                } finally {
                    resolve()
                }
            })
        }, timeout)
    })
}

function withdraw(amount) {
    return new Promise((resolve, reject) => {
        let headers = JSON.parse(iboxpayheader)
        headers.traceid = `31349173177199681536${Date.now()}a4b82bfa26fc`
        let withdrawurl = {
            url: `https://veishop.iboxpay.com/nf_gateway/nf_customer_activity/activity/v1/withdraw.json`,
            headers,
            body: `{"source":"WX_APP_KA_HTZP","bizType":2,"amount":${amount}}`
        }
        $.post(withdrawurl, (error, resp, data) => {
            try {
                if (logs == 1) $.log(data)
                const result = JSON.parse(data);
                if (result.resultCode == 1 && result.data.withdrawRes === 1) {
                    dd += '【提现】' + result.data.remark + '\n'
                    $.log('提现+' + result.data.remark + "\n")
                    notify.sendNotify($.name, `${$.profit.data.wechatNickname} 提现 ${amount / 100} 成功`);
                } else {
                    $.log('提现' + JSON.stringify(data));
                    //notify.sendNotify($.name, `${$.profit.data.wechatNickname} 提现 ${amount/100} 失败\n${JSON.stringify(data)}`);
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
            resolve()
        })
    })
}

async function Msg() {
    $.log($.name, dd);
    const hour = new Date().getHours();
    const minutes = new Date().getMinutes();
    if ($.isNode() && hour === 15 && minutes > 30 && minutes < 32) {
        notify.sendNotify($.name, dd);
    }
}

// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
