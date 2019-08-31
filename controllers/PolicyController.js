const Joi = require('joi')

module.exports = {
  async signup (req, res, next) {
    const schema = {
      email: Joi.string().email(),
      name: Joi.string(),
      password: Joi.string().regex(
        new RegExp('^[a-zA-Z0-9!@#$%^&]{8,32}$')
      )
    }

    const { error } = Joi.validate(req.body, schema)
    console.log(error)
    if (error) {
      switch (error.details[0].context.key) {
        case 'email':
          res.status(207).send({
            errorinfo: 'You must provide a valid email address'
          })
          break
        case 'name':
          res.status(207).send({
            errorinfo: 'You must provide Name'
          })
          break
        case 'password':
          res.status(207).send({
            errorinfo: 'Password must be minimum 8 characters'
            
          })
          break
        default:
          res.status(207).send({
            errorinfo: 'Invalid registration information'
          })
      }
    } else {
      next()
    }
  },
  async login (req, res, next) {
    const schema = {
      email: Joi.string().email(),
      password: Joi.string().regex(
        new RegExp('^[a-zA-Z0-9!@#$%^&]{8,32}$')
      )
    }

    const { error } = Joi.validate(req.body, schema)
    if (error) {
      switch (error.details[0].context.key) {
        case 'email':
          res.status(207).send({
            errorinfo: 'You must provide a valid email address'
          })
          break
        case 'password':
          res.status(207).send({
            errorinfo: 'Password must be minimum 8 characters'
            
          })
          break
        default:
          res.status(207).send({
            errorinfo: 'Invalid login information'
          })
      }
    } else {
      next()
    }
  }
}
