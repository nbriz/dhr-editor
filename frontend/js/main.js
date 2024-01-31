/* global nn, Netitor, resize, socket */

const ne = new Netitor({
  ele: '#editor',
  render: '#output',
  renderWithErrors: true,
  theme: window.localStorage.getItem('theme') || 'dark',
  wrap: true,
  language: 'html',
  code: 'loading...'
})

nn.on('load', window.reset)
ne.addCustomRoot(`${window.location.protocol}//${window.location.host}/uploads/`)

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•* handling Netitor's events

ne.on('lint-error', (eve) => {
  // console.log('lint-error', eve)
  window.markErrors(eve)
})

ne.on('edu-info', (eve) => {
  // console.log('edu-info', eve)
  if (eve.nfo) {
    ne.spotlight(eve.line)
    document.querySelector('#nfo').className = ''
    if (eve.language === 'html') window.showHTMLNFO(eve)
    else if (eve.language === 'css') window.showCSSNFO(eve)
    else if (eve.language === 'javascript') window.showJSNFO(eve)
  }
})

ne.on('cursor-activity', (eve) => {
  window.reset()
})

ne.on('code-update', () => {
  socket.emit('new-action', {
    action: 'user-coding',
    payload: { username: window.username, id: window.userid }
  })
})

ne.cm.on('keydown', (cm, e) => {
  if (!ne.autoUpdate && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
  }
  window.numChange(e)
})

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•* server communications

const postObj = {
  method: 'post',
  headers: {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  }
}

function pluralize (word) {
  const lastChar = word.charAt(word.length - 1)
  const secondLastChar = word.charAt(word.length - 2)
  if (lastChar === 'y' && !'aeiou'.includes(secondLastChar.toLowerCase())) {
    return word.substring(0, word.length - 1) + 'ies'
  } else if (lastChar === 's') {
    return word + 'es'
  } else {
    return word + 's'
  }
}

async function saveCode () {
  const urlParams = new URLSearchParams(window.location.search)
  const file = urlParams.get('file')
  const m = 'Could not save file because there is no filename in the URL'
  if (!file) return window.alert(m)
  const data = JSON.parse(JSON.stringify(postObj))
  const bodyObj = { file, code: ne.code, username: window.username }
  data.body = JSON.stringify(bodyObj)
  const req = await window.fetch(`api/update-code/${pluralize(file)}`, data)
  const json = await req.json()
  console.log('POST update-code', json)
  if (json.error) {
    window.alert('oh no, something went wrong saving your changes, go talk to Nick!')
  } else {
    window.alert(`updates to "${file}" have been saved`)
    socket.emit('new-action', { action: 'code-update', payload: { file } })
  }
}

async function getLatestCode () {
  const urlParams = new URLSearchParams(window.location.search)
  const file = urlParams.get('file')
  if (!file) {
    ne.code = '⚠️ THERE IS NO FILE ID PRESENT IN THIS URL ⚠️'
    return
  }
  const req = await window.fetch(`api/latest-code/${pluralize(file)}`)
  const json = await req.json()
  if (json.error) {
    const e = 'Couldn\'t find that file, are you sure you typed the correct URL?'
    ne.code = e
    console.log('GET latest-code', json)
    return window.alert(e)
  } else {
    console.log('GET latest-code', json)
    return json.data.attributes
  }
}

function updateUserData (json) {
  window.username = json.data.username
  window.userid = json.data.id
  const urlParams = new URLSearchParams(window.location.search)
  const file = urlParams.get('file')
  nn.get('.username').content(window.username)
  socket.emit('new-action', {
    action: 'user-logged-in',
    payload: { username: window.username, id: window.userid, file }
  })
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

nn.on('load', async () => {
  // confirm user
  const req = await window.fetch('api/user-info')
  const json = await req.json()
  if (json.auth) {
    if (!json.data) {
      return window.alert('oh snap, something\'s wrong user account, reach out to Nick and let him know!')
    }
    console.log('GET user-info', json)
    updateUserData(json)
    // get latest version of doc
    const data = await getLatestCode()
    ne.code = data.code
  } else {
    nn.get('#auth-screen').css({ display: 'flex' })
  }
})

nn.get('#login').on('click', async () => {
  const email = nn.get('#email').value
  const password = nn.get('#password').value
  const data = JSON.parse(JSON.stringify(postObj))
  data.body = JSON.stringify({ email, password })
  const req = await window.fetch('api/login', data)
  const json = await req.json()
  if (json.error) {
    window.alert(json.error)
  } else {
    console.log('GET user-login', json)
    updateUserData(json)
    nn.get('#auth-screen').css({ display: 'none' })
    // get latest version of doc
    const data = await getLatestCode()
    ne.code = data.code
  }
})

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

nn.on('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveCode()
  }
})

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•* handling window events

nn.on('keydown', (e) => {
  if (!ne.autoUpdate && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    ne.update()
  }
})

nn.on('mouseup', e => resize.release())
nn.on('mousemove', e => resize.move(e))

nn.get('#nfo').on('mouseup', e => resize.release())
nn.get('#nfo').on('mousedown', e => resize.pressNfo())

nn.get('#editor').on('mouseup', e => resize.release())
nn.get('#editor').on('mousedown', e => resize.pressEdt())

nn.get('#settings').on('click', window.showSettings)
nn.get('#tools').on('click', window.showTools)
nn.get('#kit').on('click', window.showKit)
