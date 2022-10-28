

const process = require('process')

const [bn, ...argv] = Array.from(process.argv.slice(1))
console.log(`
                 _                                               
|  _.  _ _|_   _|_ ._ _        ._   _  _ ._ _  |_  |_  |  _  ._ 
| (_| _>  |_    |  | | |   |_| | | _> (_ | (_) |_) |_) | (/_ |   by pgbito
                                               
`)
const usage=`
Usage: ${ require('path').basename(bn)} {login, unscrobble}`


switch (argv[0]) {
    case "login":
        try {
            require('./login').exec()
        } catch (error) {
            console.log(error)
        }
        break;
    case "unscrobble":
        try {
            require('./unscrobbler').exec()
        } catch (error) {
            console.log(error.message)
           
        }
        break;
    case undefined:
        console.log(usage)
        break;
    default:
        console.log(usage)
        break;
}
process.exit(0)
