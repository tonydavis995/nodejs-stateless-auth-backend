const Authentication = require('./controllers/AuthenticationController')
const Policy = require('./controllers/PolicyController')

const passport = require('./config/passport')

//For express routes for authentication and token verification
module.exports = app => {
  //For passport based twitter login
    app.get('/auth/twitter', passport.authenticate('twitter'))
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', { failureRedirect: 'http://localhost:8080/signup' }),
      function(req, res) {
       Authentication.twitter(req, res)
      })
  //For twitter email and user register
    app.post('/auth/twitter/email', Authentication.twitteruser)
  
  //For authentication code verification
    app.post('/auth/code', Authentication.checkcode)
  //For local signup
  app.post('/auth/signup', Policy.signup, Authentication.signup)
  //For local login
  app.post('/auth/login', Policy.login, passport.authenticate('local'), function(req, res) {
    console.log('dsajhgdjasgdjsadgs')
    Authentication.login(req, res)
   })
  //check bcakend status
  app.get('/test/backend', function(req, res) {
    res.send('Its up')
  })
}