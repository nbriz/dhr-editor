const path = require('path')
const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')
const multer = require('multer')
const axios = require('axios').default
const showdown = require('showdown')
const converter = new showdown.Converter()

const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET

const mdFieldKeys = ['content']
const domain = 'theclass.website'
const routes = require('./routes.json')

// -----------------------------------------------------------------------------
// ------------------------------------  HANDLE GETTING && UPLOADING ASSETS
router.use('/uploads', express.static(path.join(__dirname, 'frontend', 'uploads')))

const imgDestPath = path.join(__dirname, 'frontend', 'uploads')
const uploadImgStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, imgDestPath) },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})
const uploadImg = multer({ storage: uploadImgStorage }).single('image')

router.post('/api/upload-image', async (req, res) => {
  uploadImg(req, res, function (err) {
    if (err) res.json({ error: err })
    else res.json({ message: 'image uploaded', name: req.file.filename })
  })
})

// ~ - . - ~ * ~ - . - ~ * ~ - . - ~ * ~ - . - ~ * ~ - . - ~ * ~ - . - ~ * ~ - .
const routesObj = (p, s) => s && isNaN(Number(s)) ? routes[p].subpage : routes[p]

// used to query the STRAPI API
async function queryData (table, pop, pagi, filt, slug) {
  let params = ''
  const addParam = p => params.includes('?') ? `&${p}` : `?${p}`

  if (pop) params += addParam(pop)
  if (filt && slug) params += addParam(`filters[${filt}][$eq]=${slug}`)
  else if (filt) params += addParam(filt)
  if (pagi) params += addParam(pagi)
  else params += '&pagination[limit]=Infinity'

  const q = `http://localhost:1337/api/${table}${params}`
  try {
    return await axios.get(q)
  } catch (err) {
    return { error: 'there was an error quering the database' }
  }
}

// used to clean up && transform the data returned by STRAPI API
function parseData (db) {
  const html = (o, i) => {
    if (mdFieldKeys.includes(i)) o[i] = converter.makeHtml(o[i])
    else o[i] = cleanData(o[i])
    return o
  }

  const cleanData = (o) => {
    if (o instanceof Array) {
      o = o.map(obj => cleanData(obj))
    } else if (o && typeof o.data !== 'undefined') {
      o = o.data
      return cleanData(o)
    } else if (o && typeof o.attributes !== 'undefined') {
      const id = o.id
      o = o.attributes
      for (const i in o) { o = html(o, i) }
      o.id = id
    } else if (o && typeof o === 'object') {
      for (const i in o) { o = html(o, i) }
    }
    return o
  }

  db.data = cleanData(db.data)
  return db.data
}

// -----------------------------------------------------------------------------
// ------------------------------------  QUERY FOR DATA
async function getData (path, page) { // https:// [domain] / [path] / [page]
  const o = routesObj(path, page)

  // loop through all the API requires defined for this route in routes.json
  // execute each query && store the data in the db variable
  const queries = o.queries
    .map(q => queryData(q.table, q.pop, q.filt, q.pagi, page).then(db => { return db }))
  const db = await Promise.all(queries)

  // when db is ready, loop through each result && parse the data,
  // this cleans up strapi's nested mess && converts any markdown into HTML
  const data = {}
  db.forEach((item, i) => {
    const table = o.queries[i].table
    data[table] = parseData(item.data)
    if (item.data.meta && item.data.meta.pagination) {
      data[`${table}-pagination`] = item.data.meta.pagination
    }
  })

  return data
}

// ---------------------------------------------------------- ROUTES -----------
// -----------------------------------------------------------------------------
router.use(express.json())
router.use(cookieParser())

// .............
// LOGIN ..............................
async function getUserInfo (token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const url = `http://localhost:1337/api/users/${decoded.id}`
    const Authorization = `Bearer ${token}`
    const response = await axios.get(url, { headers: { Authorization } })
    return response
  } catch (error) {
    return { error }
  }
}

function getReqAuthHeaders (req) {
  const Authorization = `Bearer ${req.cookies.AccessToken}`
  const opts = { headers: { 'Content-Type': 'application/json', Authorization } }
  return opts
}

router.post('/api/login', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      error: 'email and password fields are required'
    })
  }

  const url = 'http://localhost:1337/api/auth/local'
  const data = {
    identifier: req.body.email,
    password: req.body.password
  }
  try {
    const response = await axios.post(url, data)
    const jwtToken = response.data.jwt
    const oneDay = 24 * 60 * 60 * 1000

    const user = await getUserInfo(jwtToken)
    res.cookie('AccessToken', jwtToken, {
      maxAge: oneDay,
      httpOnly: true
    }).json({ message: 'access granted', data: user.data })
  } catch (error) {
    res.json({ error: 'error logging in' })
  }
})

router.post('/api/logout', (req, res) => {
  res.cookie('AccessToken', '', { expires: new Date() }).json({
    message: 'logout successful'
  })
})

router.get('/api/user-info', async (req, res) => {
  const token = req.cookies.AccessToken
  if (!token) {
    return res.json({ auth: false, error: 'unauthorized: no token provided' })
  }
  const user = await getUserInfo(token)
  if (user.error) {
    res.json({ auth: true, error: 'authorized, but could not find user' })
  } else res.json({ auth: true, data: user.data })
})

// .............
// GETTING / POSTING UPDATES TO DATABASE ..............................
// https://docs.strapi.io/dev-docs/api/rest#update-an-entry

router.get('/api/latest-code/:file', async (req, res) => {
  let url = `http://localhost:1337/api/${req.params.file}`
  url += '?sort=createdAt:desc&pagination[limit]=1'
  const opts = getReqAuthHeaders(req)
  try {
    const response = await axios.get(url, opts)
    res.json({ data: response.data.data[0] })
  } catch (error) {
    // console.log(error)
    res.json({ error: error })
  }
})

router.post('/api/update-code/:file', async (req, res) => {
  const url = `http://localhost:1337/api/${req.params.file}`
  const data = { data: { code: req.body.code, username: req.body.username } }
  const opts = getReqAuthHeaders(req)
  try {
    const response = await axios.post(url, data, opts)
    res.json({ message: 'code update saved', data: response.data })
  } catch (err) {
    res.json({ error: 'error updating data' })
  }
})

// .............
// OTHER GET REQUESTS ...................................................
// ......................................................................
// ......................................................................
router.get('/api/:path', async (req, res) => {
  const path = req.params.path === 'home' ? '/' : req.params.path
  const data = await getData(path)
  res.json(data)
})

router.get('/api/:path/:slug', async (req, res) => {
  const path = req.params.path === 'home' ? '/' : req.params.path
  const slug = req.params.slug
  const data = await getData(path, slug)
  res.json(data)
})

router.get('*', async (req, res) => {
  /*
    https://[domain]/[path]/[page]

    path = /subpage (ex: /news, /about, etc)
    page = /page-slug (ex: /nick-briz, /245, etc)
  */
  const url = req.originalUrl.split('/').filter(s => s !== '')
  // NOTE: refer to ignite/CLATA for localization example where
  // url[0] is either /es or /en
  let path = url[0] || '/'
  const page = url[1]

  path = (path.includes('?')) ? path.split('?')[0] : path

  const imgRoot = req.hostname.includes('localhost')
    ? 'http://localhost:1337' : `https://edit.${domain}`
  const urlRoot = req.hostname.includes('localhost')
    ? 'http://localhost:3000' : `https://${domain}`

  if (!routes[path]) {
    const data = await getData('/')
    return res.render('404', { data, imgRoot, urlRoot })
  } else {
    const data = await getData(path, page)
    const obj = routesObj(path, page)
    return res.render(obj.template, { data, imgRoot, urlRoot, page })
  }
})

module.exports = router
