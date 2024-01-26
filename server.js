require('dotenv').config()

const express = require('express')
const app = express()
const port = Number(process.env.PORT) || 3000
const path = require('path')

// server side rendering of front-end templates
const ROUTES = require('./routes.js')
app.use(express.static(path.join(__dirname, './frontend')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './frontend/views'))
app.use(ROUTES)

app.listen(port, () => console.log(`listening on: ${port}`))
