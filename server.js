require('dotenv').config()

const port = Number(process.env.PORT) || 3000
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const SocketsServer = require('socket.io')
const SOCKETS = require('./sockets.js')
const ROUTES = require('./routes.js')

// server side rendering of front-end templates
app.use(express.static(path.join(__dirname, './frontend')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './frontend/views'))

// routing && custom REST API endpoints
app.use(ROUTES)

// socket endpoints
const io = new SocketsServer.Server()
io.on('connection', (socket) => SOCKETS(socket, io))

const httpServer = http.createServer(app)
httpServer.listen(port, () => console.log(`listening on: ${port}`))
io.attach(httpServer)
