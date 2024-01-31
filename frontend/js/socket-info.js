/* global nn, ne, io, getLatestCode */
const socket = io()

function setupSocketInfo () {
  nn.get('#socket-info .logout').on('click', async (e) => {
    const req = await window.fetch('api/logout', { method: 'post' })
    const json = await req.json()
    if (!json.error) window.location.reload()
  })

  nn.get('#auto-display-updates').on('change', (e) => {
    if (e.target.checked) {
      nn.get('#socket-info .manual-updates').css({ display: 'none' })
    }
  })

  nn.get('#socket-info .download-updates').on('click', async (e) => {
    const data = await getLatestCode()
    ne.code = data.code
    nn.get('#socket-info .manual-updates').css({ display: 'none' })
  })

  socket.on('server-message', async (data) => {
    console.log('server-message', data)
    if (data.users) {
    // new users logged in or logged out
      const ele = nn.get('#socket-info .users')
      ele.innerHTML = ''
      const urlParams = new URLSearchParams(window.location.search)
      const file = urlParams.get('file')
      Object.values(data.users).forEach(u => {
        if (u.username !== window.username && u.file === file) {
          const span = nn.create('div')
          span.innerHTML = `<span class="status" id="user-${u.id}">○</span> ${u.username}`
          ele.appendChild(span)
        }
      })
    } else if (data.isCoding) {
    // someone is coding
      if (data.isCoding === window.userid) return
      const u = nn.get(`#user-${data.isCoding}`)
      if (u && u.dataset.animating !== 'true') {
        u.dataset.animating = 'true'
        setTimeout(() => { u.innerHTML = '⊙' }, 250)
        setTimeout(() => { u.innerHTML = '⊚' }, 500)
        setTimeout(() => { u.innerHTML = '○' }, 750)
        setTimeout(() => { u.dataset.animating = 'false' }, 800)
      }
    } else if (data.file) {
    // a file has been updated
      const urlParams = new URLSearchParams(window.location.search)
      const file = urlParams.get('file')
      const autoDisplay = nn.get('#auto-display-updates').checked
      if (autoDisplay && file === data.file) {
        const data = await getLatestCode()
        ne.code = data.code
      } else if (file === data.file) {
        nn.get('#socket-info .user-updates').content(data.user.username)
        nn.get('#socket-info .manual-updates').css({ display: 'block' })
      }
    }
  })
}

nn.on('load', setupSocketInfo)
