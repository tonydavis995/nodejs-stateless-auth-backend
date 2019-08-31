var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
const dotenv = require('dotenv')
dotenv.config()
var db = require('../models')
var bcrypt = require('bcryptjs')
var TwitterStrategy = require('passport-twitter').Strategy
var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt



passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
},
    function (jwtPayload, done) {

        //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
        // return UserModel.findOneById(jwtPayload.id)
        //     .then(user => {
        //         return cb(null, user);
        //     })
        //     .catch(err => {
        //         return cb(err);
        //     })
    }
))

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWT_CON_KEY,
    consumerSecret: process.env.TWT_CON_SECRET,
    callbackURL: process.env.TWT_CALL_URL,
    includeEmail: true
},
    function (token, tokenSecret, profile, done) {
        process.nextTick(function () {
            return done(null, profile)
        })
    }

))

passport.use(new LocalStrategy(
    {
        usernameField: 'email'
    },
    (username, password, done) => {
        db.User.findOne({
            where: {
                email: username
            }
        }).then((dbUser) => {
            if (dbUser) {
                if (!bcrypt.compareSync(password, dbUser.password)) {
                    return done(null, false, {
                        message: 'Incorrect email or password'
                    })
                }
                else {
                    return done(null, dbUser)
                }
            }
            else {
                return done(null)
            }
        })
    }
))
passport.serializeUser((user, cb) => {
    cb(null, user)
})
//
passport.deserializeUser((obj, cb) => {
    cb(null, obj)
})
module.exports = passport