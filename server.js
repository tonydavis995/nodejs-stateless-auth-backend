const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const { sequelize } = require('./models')
const dotenv = require('dotenv')
dotenv.config()


const app = express()
app.use(morgan('combined'))
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  secure: false 
}))

app.use(bodyParser.json())
app.use(passport.initialize())
app.use(passport.session())
app.options('http://localhost:8080/', cors())
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
 };
 app.use(cors(corsOption))
require('./routes')(app)
sequelize.sync({ force: true })
  .then(() => {
    app.listen(process.env.PORT || 8081)
    console.log('Database Online')
  })