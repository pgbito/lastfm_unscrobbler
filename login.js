
const yaml = require('js-yaml');
const fs = require('fs')

const config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

const request = require("request")


const loginUrl = 'https://www.last.fm/login'

var j = request.jar();

var csrftoken

module.exports.exec = (function () {
    if (config.username == "xxx" && config.password == "xxx"){
        throw Error("You need to change the default password & username values in config.yml")
    }

    request.get({ url: loginUrl, jar: j }, function (error, response) {

        csrftoken = response.body.match(/<input[^>]+name='csrfmiddlewaretoken'[^>]+>/g)[0].match(/value='([^']+)'/)[1]

        request.post({
            url: loginUrl,
            jar: j,
            gzip: true,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": loginUrl, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0",
            },
            form: {
                username_or_email: config.username,
                password: config.password,
                csrfmiddlewaretoken: csrftoken,
                submit: ""
            }
        },
            (error, response, body) => {
                if (response.statusCode == 302) {
                    let cookies = j.getCookies(loginUrl)
                    let csrfCookie = cookies.filter(c => c.key == 'csrftoken')[0] || null
                    let sessionCookie = cookies.filter(c => c.key == 'sessionid')[0] || null
                    if (!csrfCookie) throw new Error('no csrf token found')
                    if (!sessionCookie) throw new Error('no session id token found')
                   
                    fs.writeFileSync('session.yml', yaml.dump({ csrftoken: csrfCookie.value, sessionid: sessionCookie.value, expiration_date: sessionCookie.expires }), 'utf-8')
                    console.clear()
                    console.log("Login successful, session saved to session.yml")

                } else {
                    console.log("Login Failed, check your config.yml and check your credentials.")
                    console.log('Response code: ' + response.statusCode)

                    if (parseInt(response.statusCode) != 403){
                        console.log(response.body.match(/<div[^>]+class=['"]alert[^>]+>([^<]+)<\/div>/g).map(html => 'Message: ' + html.match(/>[\\n\W]*([^\\<]+)[^<]*</)[1].trim()))
                    }
                }
            })
    })
})
