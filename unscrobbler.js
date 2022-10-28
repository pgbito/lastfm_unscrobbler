const yaml = require('js-yaml');
const fs = require('fs')
const req = require('request')
const config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
const inquirer = require('inquirer');
function encode_query(q = String()) {
    if (q.trim() == String()) {
        throw Error("please provide a valid query.")
    }
    var fq = q.trim()
    if (fq.includes(" ")) {
     do {
        fq = fq.replace(" ", "+")
     } while (fq.includes(" "));

    }
    return fq
}
function headers_cst_ref(referer) {
    if (referer == false || referer.trim() == String()) {
        throw Error("Referer can't be null")
    }

    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0",
        "Accept": "*/*",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        "X-NewRelic-ID": "UwYPV15QGwYFXFlXDgU=",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache", "Referer": referer
    }
}
const cookieUrl = 'https://www.last.fm'
let session
try {
    session = yaml.safeLoad(fs.readFileSync('session.yml', 'utf8'));
} catch (error) {
    console.error("Please execute .\\run.js login first.")
}
const exp = new Date(session.expiration_date)
if (exp < (Date.now())) {
    console.log("Cookie expired, please run login.js again")
}
var jar = req.jar();
async function delete_scrobbles_of_artist(artist, dummy) {
    
    artist = encode_query(artist)
    req.post(`https://www.last.fm/user/${config.username}/library/music/${artist}/+delete?is_modal=1`, {

        "headers": headers_cst_ref(`https://www.last.fm/user/${config.username}/library/music/${artist}`),
        jar: jar,
        gzip: true,
        form: {
            'csrfmiddlewaretoken': session.csrftoken,
            "confirm": "on",
            'ajax': 1
        }
    }, function (error, response, body) {
        if (error) {
            throw Error(error)

        }
        if (
            !String(body).includes("Feel free to close this message, we'll finish deleting your scrobbles in the background.")) {
            throw Error(body)
        }
        console.log(`Successfully deleting ${artist} scrobbles.`)
    })

}

async function delete_scrobbles_of_album(artist, album) {
   
    
    url = `https://www.last.fm/user/${config.username}/library/music/${encode_query(artist)}/${encode_query(album)}/+delete?is_modal=1`

    req.post(url, {
        "credentials": "include",
        headers: headers_cst_ref(`https://www.last.fm/user/${config.username}/library/music/${encode_query(artist)}/${encode_query(album)}/`),
        jar: jar,
        gzip: true,
        form: {
            'csrfmiddlewaretoken': session.csrftoken,
            "confirm": "on",
            'ajax': 1
        }
    }, function (error, response, body) {
        if (error) {
            throw Error(error)

        }
        if (
            !String(body).includes("Feel free to close this message, we'll finish deleting your scrobbles in the background.")) {
            throw Error(body)
        }
        console.log(`Successfully deleting ${artist} - ${album} scrobbles.`)
    });
}
async function delete_scrobbles_of_track(artist, track) {
 
    var url
    try {
        url = `https://www.last.fm/user/${config.username}/library/music/${encode_query(artist)}/_/${encode_query(track)}/+delete?is_modal=1`
    } catch (error) {
        throw Error(error)
    }
    req.post(url, {
        "credentials": "include",
        "headers": headers_cst_ref(
            `https://www.last.fm/user/${config.username}/library/music/${encode_query(artist)}/_/${encode_query(album)}/`),


        jar: jar,
        gzip: true,
        form: {
            'csrfmiddlewaretoken': session.csrftoken,
            "confirm": "on",
            'ajax': 1
        }
    }, function (error, response, body) {
        if (error) throw Error(error)


        if (
            !String(body).includes("Feel free to close this message, we'll finish deleting your scrobbles in the background.")) {
            throw Error(body)
        }
        console.log(`Successfully deleting ${artist} - ${track} scrobbles.`)
    });
}

module.exports = { "delete_scrobbles_of_album": delete_scrobbles_of_album, "delete_scrobbles_of_track": delete_scrobbles_of_track, "delete_scrobbles_of_artist": delete_scrobbles_of_artist }
module.exports.exec = function () {

    
    const questions = [

        {
            type: 'list',
            name: 'opt',
            message: 'Please choose an option to unscrobble',
            choices: Object.keys(module.exports).filter(x => x != "exec"),
            filter(val) {
                return val.toLowerCase();
            },
        },


        {
            type: 'input',
            name: 'artist',
            message: 'Please enter the artist name. ',



        },
        {
            type: "input", name: "album", message: "Please enter the album name", when(answers) {
                return (answers.opt == "delete_scrobbles_of_album");

            }
        },
        {
            type: "input", name: "track", message: "Please enter the album track", when(answers) {
                return (answers.opt == "delete_scrobbles_of_track");

            }
        }

    ];

    inquirer.prompt(questions).then((answers) => {
        jar.setCookie(req.cookie(' sessionid=' + session.sessionid), cookieUrl)
        jar.setCookie(req.cookie(' csrftoken=' + session.csrftoken), cookieUrl)
        switch (answers.opt.replace("delete_scrobbles_of_", "")) {
            case "album":
                delete_scrobbles_of_album(answers.artist, answers.album)
                break;
            case "artist":
                delete_scrobbles_of_artist(answers.artist)
                break;
            case "track":
                delete_scrobbles_of_track(answers.artist, answers.track)
                break;
            default:
                console.log("Invalid option.")
                process.exit(-1)
                break;
        }
    });
}
