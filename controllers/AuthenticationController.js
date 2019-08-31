const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const oauth = require('oauth')
const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))

const { User, Provider } = require('../models')

dotenv.config()

function jwtToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: '3d'
  })
}
function jwtRefreshToken(user) {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d'
  })
}
function hashPassword (password, options) {
  const SALT_FACTOR = 8

  return bcrypt
    .genSaltAsync(SALT_FACTOR)
    .then(salt => bcrypt.hashAsync(password, salt, null))
    .then(hash => {
      return hash
    })
}

var Github = new oauth.OAuth2(process.env.GIT_CLIENT_ID, process.env.GIT_CLIENT_SECRET, "https://github.com/", "login/oauth/authorize", "login/oauth/access_token")
var Facebook = new oauth.OAuth2(process.env.FB_CLIENT_ID, process.env.FB_CLIENT_SECRET, "https://graph.facebook.com/", "v4.0/oauth/access_token", "v4.0/oauth/access_token")
var Google = new oauth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "https://www.googleapis.com/", "oauth2/v4/token", "oauth2/v4/token")


var git_params = {
  client_id: process.env.GIT_CLIENT_ID,
  client_secret: process.env.GIT_CLIENT_SECRET,
  redirect_uri: process.env.GIT_CALL_URL
}
var fb_params = {
  client_id: process.env.FB_CLIENT_ID,
  client_secret: process.env.FB_CLIENT_SECRET,
  redirect_uri: process.env.FB_CALL_URL
}
var google_params = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: process.env.GOOGLE_CALL_URL,
  grant_type:'authorization_code'
}

module.exports = {
  async twitter(req, res) {
    try {
      Provider.findOrCreate(
        {
          where: {
            providerId: req.user.id,
            provider: req.user.provider,
            providerAvatar: req.user.photos[0].value
          }
        }).spread(function (provider, created) {
          if (created) {
            res.redirect(`http://localhost:8080/signup?p=${provider.providerId}&n=${req.user.displayName}`)
          }
          else {
            provider.getUser().then((user) => {
              const userJSON = user.toJSON()
              delete userJSON.password
              var code = jwtToken(userJSON)
              res.redirect(`http://localhost:8080/signup?code=${code}&p=${'twitter'}`)
            })
          }
        })
    } catch (error) {
      res.status(400).send({
        error: 'User Login Failed'
      })
    }
  },
  async twitteruser(req, res) {
    try {
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
      })
      Provider.findOne({
        where: {
          providerId: req.body.providerId,
          provider: 'twitter'
        }
      }
      ).then(provider => {
        provider.setUser(user.id)
        user.addProvider(provider.id)
      }).then(() => {
        const userJSON = user.toJSON()
        delete userJSON.password
        res.send({
          user: userJSON,
          token: jwtToken(userJSON)
        })
      })
    } catch (error) {
      console.log(error)
      res.status(400).send({
        error: 'User Creation Failed'
      })
    }
  },
  async checkcode(req, res) {
    switch (req.body.provider) {
      case 'twitter': {
        //For code verification and issuing access_refresh_token
        try {
          const user = await jwt.verify(req.body.code, process.env.JWT_SECRET)
          if (user) {
            delete user.exp
            const refreshtoken = jwtRefreshToken(user)
            res.status(200).send({
              access_token: req.body.code,
              refresh_token: refreshtoken,
              user: user
            })
          } else {
            res.status(401).send({
              error: 'Unauthorized'
            })
          }
        } catch (error) {
          res.status(401).send({
            error: 'Unauthorized'
          })
        }
      }
        break
      case 'github': {
        Github.getOAuthAccessToken(req.body.code, { params: git_params }, function (err, access_token, refresh_token) {
          if (err) {
            res.status(401).send({
              error: 'Unauthorized' + err
            })
          }
          // authenticate github API
          try {
            Github.get('https://api.github.com/user', access_token, function (err, data) {
              if (err) {
                res.status(401).send({
                  error: 'Unauthorized' + err
                })
              }
              Github.get('https://api.github.com/user/emails', access_token, function (err, emails) {
                if (err) {
                  res.status(401).send({
                    error: 'Unauthorized' + err
                  })
                }
                const email_array = JSON.parse("[" + emails + "]")
                const email = email_array[0].filter(email => {
                  return email.primary === true
                })
                const data_json = JSON.parse(data)

                User.findOrCreate({
                  where: {
                    name: data_json.name,
                    email: email[0].email
                  }
                }).spread(async (user, created) => {
                  if (created) {
                    const provider = await Provider.create({
                      provider: 'github',
                      providerId: data_json.id,
                      providerAvatar: data_json.avatar_url
                    })
                      user.addProvider(provider.dataValues.id)
                      const userJSON = user.toJSON()
                      delete userJSON.password
                      res.status(200).send({
                        user: userJSON,
                        provider: provider.dataValues.provider,
                        avatar_provider: provider.dataValues.providerAvatar,
                        access_token: jwtToken(userJSON),
                        refresh_token: jwtRefreshToken(userJSON)
                    })
                  } else {
                    const provider = await user.getProviders({
                      where: {
                        provider: 'github'
                      },
                      raw: true
                    })
                    if (provider[0]) {
                      if (provider[0].providerId == data_json.id) {
                        const userJSON = user.toJSON()
                        delete userJSON.password
                        res.status(200).send({
                          user: userJSON,
                          provider: provider[0].provider,
                          avatar_provider: provider[0].providerAvatar,
                          access_token: jwtToken(userJSON),
                          refresh_token: jwtRefreshToken(userJSON)
                        })
                      }
                    } else {
                      const provider = await Provider.create({
                        provider: 'github',
                        providerId: data_json.id,
                        providerAvatar: data_json.avatar_url
                      })
                        user.addProvider(provider.dataValues.id)
                        const userJSON = user.toJSON()
                        delete userJSON.password
                        res.status(200).send({
                          user: userJSON,
                          provider: provider.dataValues.provider,
                          avatar_provider: provider.dataValues.providerAvatar,
                          access_token: jwtToken(userJSON),
                          refresh_token: jwtRefreshToken(userJSON)
                        })
                    }
                  }
                })
              })
            })
          } catch (error) {
            res.status(400).send({
              err: 'authenticaton failed'
            })
          }
        })
      }
        break
      case 'facebook': {
        Facebook.getOAuthAccessToken(req.body.code, fb_params, function (err, access_token, refresh_token) {
          Facebook.get('https://graph.facebook.com/me?locale=en_US&fields=name,email,picture', access_token, function (err, data_string) {

            try {
              const data = JSON.parse(data_string)
              User.findOrCreate({
                where: {
                  name: data.name,
                  email: data.email
                }
              }).spread(async (user, created) => {
                if (created) {
                  const provider = await Provider.create({
                    provider: 'facebook',
                    providerId: data.id,
                    providerAvatar: data.picture.data.url
                  })
                    user.addProvider(provider.dataValues.id)
                    const userJSON = user.toJSON()
                    delete userJSON.password
                    res.status(200).send({
                      user: userJSON,
                      provider: provider.dataValues.provider,
                      avatar_provider: provider.dataValues.providerAvatar,
                      access_token: jwtToken(userJSON),
                      refresh_token: jwtRefreshToken(userJSON)
                  })
                } else {
                  const provider = await user.getProviders({
                    where: {
                      provider: 'facebook'
                    },
                    raw: true
                  })
                  if (provider[0]) {
                    if (provider[0].providerId == data.id) {
                      const userJSON = user.toJSON()
                      delete userJSON.password
                      res.status(200).send({
                        user: userJSON,
                        provider: provider[0].provider,
                        avatar_provider: provider[0].providerAvatar,
                        access_token: jwtToken(userJSON),
                        refresh_token: jwtRefreshToken(userJSON)
                      })
                    }
                  } else {
                    const provider = await Provider.create({
                      provider: 'facebook',
                      providerId: data.id,
                      providerAvatar: data.picture.data.url
                    })
                      user.addProvider(provider.dataValues.id)
                      const userJSON = user.toJSON()
                      delete userJSON.password
                      res.status(200).send({
                        user: userJSON,
                        provider: provider.dataValues.provider,
                        avatar_provider: provider.dataValues.providerAvatar,
                        access_token: jwtToken(userJSON),
                        refresh_token: jwtRefreshToken(userJSON)
                      })
                  }
                }
              })
            } catch (error) {
              res.status(400).send({
                err: 'authenticaton failed'
              })
            }
          }
          )
        })
      }
        break
      case 'google' : {
        Google.getOAuthAccessToken(req.body.code, google_params, function (err, access_token, refresh_token) {
          Google.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', access_token, function (err, data_string) {
            try {
              console.log(data_string, err)
              const data = JSON.parse(data_string)
              console.log(data)
              User.findOrCreate({
                where: {
                  name: data.name,
                  email: data.email
                }
              }).spread(async (user, created) => {
                if (created) {
                  const provider = await Provider.create({
                    provider: 'google',
                    providerId: data.id,
                    providerAvatar: data.picture
                  })
                    
                    user.addProvider(provider.dataValues.id)
                    const userJSON = user.toJSON()
                    delete userJSON.password
                    
                    res.status(200).send({
                      user: userJSON,
                      provider: provider.dataValues.provider,
                      avatar_provider: provider.dataValues.providerAvatar,
                      access_token: jwtToken(userJSON),
                      refresh_token: jwtRefreshToken(userJSON)
                  })
                } else {
                  const provider = await user.getProviders({
                    where: {
                      provider: 'google'
                    },
                    raw: true
                  })
                  if (provider[0]) {
                    if (provider[0].providerId == data.id) {
                      const userJSON = user.toJSON()
                      delete userJSON.password
                      res.status(200).send({
                        user: userJSON,
                        provider: provider[0].provider,
                        avatar_provider: provider[0].providerAvatar,
                        access_token: jwtToken(userJSON),
                        refresh_token: jwtRefreshToken(userJSON)
                      })
                    }
                  } else {
                    const provider = await Provider.create({
                      provider: 'google',
                      providerId: data.id,
                      providerAvatar: data.picture
                    })
                      user.addProvider(provider.dataValues.id)
                      const userJSON = user.toJSON()
                      delete userJSON.password
                      res.status(200).send({
                        user: userJSON,
                        provider: provider.dataValues.provider,
                        avatar_provider: provider.dataValues.providerAvatar,
                        access_token: jwtToken(userJSON),
                        refresh_token: jwtRefreshToken(userJSON)
                    })
                  }
                }
              })
            } catch (error) {
              console.log(error)
              res.status(400).send({
                err: 'authenticaton failed'
              })
            }
          }
          )
        })
      }
       
      break
      default:
          res.status(400).send({
            err: 'authenticaton failed'
          })
        break
    }
  },
  async signup (req, res) {
      User.findOne({
        where: {
          email: req.body.email
        }
      }).then(user => {
        if (user) {
          res.status(200).send({
            message: 'It seems you already have an account please sign in'
          })
        } else {
          User.create({
            email: req.body.email,
            name: req.body.name
          }).then(async user => {
            const password = await hashPassword(req.body.password)
            user.update({
              password: password
            })
            const userJson = user.toJSON()
            delete userJson.password
            res.status(200).send({
               user: userJson,
               access_token: jwtToken(userJson),
               refresh_token: jwtRefreshToken(userJson)
            })
          }).catch(err => { res.status(401).json(err) })
        }
      })
    },
    async login (req, res) {
      try {
        const userJson = req.user.toJSON()
        delete userJson.password
        res.status(200).send({
            acess_token: jwtToken(userJson),
            refresh_token: jwtRefreshToken(userJson),
            user: userJson
        })
      } catch (error) {
        res.status(400).send({
          error: 'Error Logging In'
        })
      }
    }
}
