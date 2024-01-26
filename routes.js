const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')
const axios = require('axios').default
const showdown = require('showdown')
const converter = new showdown.Converter()

const mdFieldKeys = ['content']
const domain = 'theclass.website'
const routes = require('./routes.json')

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
router.post('/api/login', async (req, res) => {
  console.log('received data:', req.body)

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
  console.log(data)
  try {
    const response = await axios.post(url, data)
    const jwtToken = response.data.jwt
    const oneDay = 24 * 60 * 60 * 1000
    res.cookie('AccessToken', jwtToken, {
      maxAge: oneDay,
      httpOnly: true
    }).json({ message: 'access granted' })
  } catch (error) {
    console.error('error logging in:', error)
    res.json({ error: 'error logging in' })
  }
})

router.post('/api/logout', (req, res) => {
  res.cookie('AccessToken', '', { expires: new Date() }).json({
    message: 'logout successful'
  })
})

// .............
// POSTING UPDATES TO HOMEPAGE ..............................
// https://docs.strapi.io/dev-docs/api/rest#update-an-entry
router.post('/api/update', async (req, res) => {
  const url = 'http://localhost:1337/api/homepage'
  const data = { data: { title: req.body.title } }
  const Authorization = `Bearer ${req.cookies.AccessToken}`
  const opts = { headers: { 'Content-Type': 'application/json', Authorization } }
  try {
    const response = await axios.put(url, data, opts)
    // console.log('data updated successfully', response.data)
    res.json({ message: 'data updated successfully', data: response.data })
  } catch (err) {
    // console.log('error putting data', err)
    res.json({ error: 'error updating data' })
  }
})

// .............
// GET REQUESTS ...................................................
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
  const path = url[0] || '/'
  const page = url[1]

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
