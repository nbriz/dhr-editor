/* global ne, nn, saveCode, imageUploader */
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•* some example helper functions

window.reset = () => {
  // const netnetFace = '<div class="face"><a href="https://netnet.studio"><div></div></a></div class="face">'
  document.querySelector('.title').innerHTML = ''
  document.querySelector('.content').innerHTML = ''
  document.querySelector('.content').classList.remove('error')
  document.querySelector('.content').classList.remove('edu')
  ne.spotlight('clear')
  window.resizeNFO(100)
}

window.resizeNFO = (h) => {
  nn.get('main').css({ transition: 'all 0.5s' })
  setTimeout(() => {
    const b = 100 / (nn.height / h)
    const t = 100 - b
    nn.get('main').css({ gridTemplateRows: `${t}% ${b}%` })
    setTimeout(() => {
      nn.get('main').css({ transition: 'none' })
    }, 610)
  }, 100)
}

window.showJSNFO = (eve) => {
  const status = (eve.nfo.status && eve.nfo.status !== 'standard')
    ? `. (<b>NOTE</b>: this CSS feature is ${eve.nfo.status}). ` : ''

  document.querySelector('.content').classList.add('edu')
  document.querySelector('.content').innerHTML = `
    <h1>${eve.nfo.keyword.html}</h1>
    <p>${eve.nfo.description.html} ${status}</p>
  `

  const h = nn.get('.content').offsetHeight + 120
  window.resizeNFO(h < 244 ? h : 244)
}

window.showHTMLNFO = (eve) => {
  const type = (typeof eve.nfo.singleton === 'boolean')
    ? 'element' : 'attribute'
  const note = eve.nfo.note
    ? eve.nfo.note.html
    : (eve.nfo.status && eve.nfo.status !== 'standard')
      ? `This ${type} is ${eve.nfo.status}. ` : ''

  document.querySelector('.content').classList.add('edu')
  document.querySelector('.content').innerHTML = `
    <h1>${eve.nfo.keyword.html}</h1>
    <p>${eve.nfo.description.html} ${note}</p>
  `

  const h = nn.get('.content').offsetHeight + 120
  window.resizeNFO(h < 244 ? h : 244)
}

window.showCSSNFO = (eve) => {
  const status = (eve.nfo.status && eve.nfo.status !== 'standard')
    ? `. (<b>NOTE</b>: this CSS feature is ${eve.nfo.status}). ` : ''

  let links = '' // css properties have multiple reference URLs
  if (eve.nfo.urls) {
    links = Object.keys(eve.nfo.urls)
      .map(k => `<a href="${eve.nfo.urls[k]}" target="_blank">${k}</a>`)
    if (links.length > 0) {
      links = `To learn more visit ${links.join(', ').slice(0, -2)}.`
    }

    const h = nn.get('.content').offsetHeight + 120
    window.resizeNFO(h < 244 ? h : 244)
  }

  document.querySelector('.content').classList.add('edu')
  document.querySelector('.content').innerHTML = `
    <h1>${eve.nfo.keyword.html}</h1>
    <p>${eve.nfo.description.html} ${status} ${links}</p>
  `
}

window.markErrors = (eve) => {
  const explainError = (err) => {
    ne.spotlight(err.line)
    document.querySelector('.content').classList.add('error')
    document.querySelector('.content').innerHTML = err.friendly
      ? `<p>${err.friendly}</p>` : `<p>${err.message}</p>`
    const h = nn.get('.content').offsetHeight + 120
    window.resizeNFO(h < 244 ? h : 244)
  }

  ne.marker(null)
  const lines = []
  if (eve.length === 0) window.reset()
  eve.forEach(e => {
    if (lines.includes(e.line)) return
    lines.push(e.line)
    const clk = () => explainError(e)
    if (e.type === 'warning') ne.marker(e.line, 'yellow', clk)
    else ne.marker(e.line, 'red', clk)
  })
}

window.numChange = (e) => {
  const keys = [38, 40]
  const str = ne.cm.getSelection()
  const val = parseInt(str)
  if (keys.includes(e.keyCode) && !isNaN(val)) {
    e.preventDefault()
    const unt = str.replace(val, '')
    const inc = e.shiftKey ? 10 : 1
    const num = e.keyCode === 38 ? val + inc : val - inc
    const from = ne.cm.getCursor('from')
    const to = ne.cm.getCursor('to')
    const newStr = num + unt
    ne.cm.replaceSelection(newStr)
    const t = { line: to.line, ch: from.ch + newStr.length }
    ne.cm.setSelection(from, t)
    ne.spotlight(from.line + 1)
  } else if (e.keyCode === 13 && !isNaN(val)) {
    if (nn.get('.content').innerHTML !== '') window.reset()
    e.preventDefault()
    const from = ne.cm.getCursor('from')
    ne.cm.setSelection(from, from)
    ne.spotlight(null)
  }
}

window.showSettings = () => {
  window.reset()
  const hk = nn.platformInfo().platform.includes('Mac') ? 'CMD' : 'CTRL'
  const msg = `when review is set to "manual", you'll need to press ${hk} + Enter to run update the preview`

  const checkResize = () => {
    setTimeout(() => {
      const h = nn.get('#nfo .content').offsetHeight + 120
      window.resizeNFO(h)
    }, 100)
  }

  nn.get('.title').innerHTML = '<h1>settings</h1>'
  nn.get('.content').innerHTML = `
    <div class="settings">
      <span>
        <select class="display-socket-info">
          <option value="true" selected>show-users</option>
          <option value="false">hide-users</option>
        </select>
      </span>
      <span>
        <select class="auto-update">
          <option value="true" ${ne.autoUpdate === true ? 'selected' : ''}>auto-preview</option>
          <option value="false" ${ne.autoUpdate === false ? 'selected' : ''}>manual-preview</option>
        </select>
      </span>
      <span>
        <select class="word-wrap">
          <option value="true" ${ne.wrap === true ? 'selected' : ''}>word-wrap</option>
          <option value="false" ${ne.wrap === false ? 'selected' : ''}>no word-wrap</option>
        </select>
      </span>
      <span>
        <select class="theme-select"></select>
      </span>
    </div>
    <div class="disclaimer">
      ${ne.autoUpdate === false ? msg : ''}
    </div>
  `

  Object.keys(ne.themes).forEach(theme => {
    const s = nn.create('option').set({ value: theme }).content(theme + ' theme')
    if (theme === ne.theme) s.set({ selected: true })
    s.addTo('.settings .theme-select')
  })

  const h = nn.get('#nfo .settings').offsetHeight + 120
  window.resizeNFO(h)

  nn.get('.settings .display-socket-info').on('change', (e) => {
    if (e.target.value === 'true') {
      nn.get('#socket-info').css({ display: 'block' })
    } else {
      nn.get('#socket-info').css({ display: 'none' })
    }
  })

  nn.get('.settings .theme-select').on('change', (e) => {
    ne.theme = e.target.value
    window.localStorage.setItem('theme', ne.theme)
  })

  nn.get('.settings .auto-update').on('change', (e) => {
    if (e.target.value === 'false') {
      ne.autoUpdate = false
      nn.get('.disclaimer').innerHTML = `<i>${msg}</i>`
      checkResize()
    } else {
      ne.autoUpdate = true
      nn.get('.disclaimer').innerHTML = ''
      checkResize()
    }
  })

  nn.get('.settings .word-wrap').on('change', (e) => {
    ne.wrap = e.target.value === 'true'
  })
}

window.showTools = () => {
  window.reset()

  nn.get('.title').innerHTML = '<h1>tools</h1>'
  nn.get('.content').innerHTML = `
    <div class="tools">
      <button class="tidy">tidy code</button>
      <button class="download">download code</button>
      <button class="save">save code</button>
      <button class="upload">upload file</button>
      <!-- <a href="https://imgur.com/upload" target="_blank">upload image</a> -->
      <a href="https://fffuel.co/cccolor/" target="_blank">color picker</a>
      <a href="https://fonts.google.com//" target="_blank">google fonts</a>
      <a href="https://css-generators.dotenv.dev/" target="_blank">CSS generators</a>
      <a href="https://chat.openai.com/share/2587808d-01da-4b6f-bd0f-51623e93c796" target="_blank">ChatGPT</a>
    </div>
  `
  const h = nn.get('#nfo .tools').offsetHeight + 120
  window.resizeNFO(h)

  nn.get('.tidy').on('click', () => ne.tidy())

  nn.get('.download').on('click', () => {
    const blob = new window.Blob([ne.code], { type: 'text/html' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = 'index.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  })

  nn.get('.save').on('click', () => saveCode())

  imageUploader('.upload', { maxSize: 3000 }, (obj) => {
    if (obj.error) window.alert(obj.error)
    else window.alert(`"${obj.name}" was uploaded!`)
    console.log('Image Uploader', obj)
  })
}

window.showKit = () => {
  window.reset()

  nn.get('.title').innerHTML = '<h1>code kit</h1>'
  nn.get('.content').innerHTML = `
    <div class="kit">
      <ul>
      <li><a href="https://netnet.studio/?ex=71" target="_blank">custom fonts</a></li>
      <li><a href="https://netnet.studio/?ex=70" target="_blank">full page background</a></li>
      <li>
        <a href="https://netnet.studio/#example/eJylWgtT20gS/is6b9URzgq2/HY2myobzMM8YoyBwLKVGktjabCkEZqRjdna/37dM3pBzO5Vrmo3BHs009P99ddft/JnJSQBrXwKE983K5LblU8yTij8lbii8un3P8yKTzY8kZVPFYfby48+XciKWVnSTeWT1a23rW7X6sEfTbNicwd2qvyCP2t0vLm5GTXOGi+DyxWtroLx0+H4fEWarFH3+pfP/cMh7zZXq1N5NrphXyeP+7OQ11dVWl9Ur3yXy6ODy+rxsj7vd/nm7npy35r4zak1OHmZDY/W9vPk9OY4vj7te6I/mVWb0abFOlfynITsfMRd2ViPvzXi6XF4cTP9+rQ+Or2ePq3vZs/u6VMzOlqN4+qZ99I7e345p/bV6fy8H/La7dP9YeO0elW147vHw7lzJ1v3t/Vmh58erELamz7th97MDZ4Htb69P/Ud62m4od7mSV6Popm8u5+4Gze5prPZ/glvufdn08vEP2hQWrMu+MGkdTKYtSx+cHfmrOejW/fqMDh8ct3WfjBoD54fu/etcb/njq+Oh6POwctxfN6b2F8P57Po4oie9cfTZDk+HR6OnsL98OrSkeT+ojfpLnj1KT5vntYevXF4PnLZpQyW3WNxOnKbN+5lrz44imbDW+fk6nDYqU/H1YvhoN3sjAfLeXTS8S7Iqve8jr5Wn/pz/zBa3vjf2ouRDPvBTERtuO5h89uS0EV/tnY7bYc+LR97V+ejcc87qzf9r535t5v9MQ/cwWK+79mMzQbBSpCouWYbESSXdJ9fnw16+3eN+8fjuy6Jqj0qA3rXtsfD/TY7rE3s+regTeCw+cC5OB+egnOvjg7X/K47uXEjGdWn3ej58KJ62w+v7xczMonn9+L8jIlqtL88nzy2n3zWJYf8+iDmwWWU3FrTaDQ5DG5XNPHrR71Bl95fu4e3t7XV6PTxYNN6PDj2b9rdF96se9PRyaIXHbTXm95pZH1lsvXcfZkTerHhwWYqFv0rO7yqJrE/HV7MN8Oqex7exQfDg+HlM2B+fHe6tpxHn6+iMevfrshY3PfrzRMq/UVXNNvf3Bqf9y4C8s2/9Ljst+Tx7Wk7mbxcXBw8tR6lO+9eWpG1ul4Bho9rJ31AmBVv6tO77n47GZ5MO5vn9tA5WyyT5NskWNCuYDPfqp8vWDW+uI8PzuhR3/M2fbs9pAfVs+l4wS9YZ+TGjSO5uB9PnNXL8XB8MhnURr3zoDpfWu7qfkwWnvv0zZHLO7k5W33tHInJ2Wgy2Bz3ThZ27fH+Zv3bb5DfLFxwSP8/K8ypfKoDHTDpY3KLJZW2Z/AVjVeMrmHlgtuJyAmEPiNTDIQR0dgYJw7dEcZnYngxXfz2UPGkjMSnWs1hwuaxs2fzoGZ7JAypL2qW1W92m42mZbUbTQBpv94pPmu06nWr3er0LPys3ep1gXNaDavX7/ZavYeKIUnsUglnfJ/7JFw+VL6IxHWpkIyHn2vki8FDQ3rUSI82DY/GaBwJDfpMgsinBl8YAezCQuLDxyGXBB8WxoLHhoiozRbMNlbcJvPEJ/HGWHsMXEGiiJJYwG80NNbUsH1mL/E0YgBJrvGalb9M7UircKQnA3+LG39vNMxG02y0zEbbbHTMRtds9MxG32zW/8jd+zWJjePZ+Zlhg3lMSIGmE+MzEu+Xf/vy14Cw8N+u/PVzTX1kUJ8GNJTGmknPkGteWuqw1ZaVwmCws6N8wqSpPLdgsZB4pITd4UgwAs9Rn8AjJvoDvIhLBYUPwcfqvMww2ydCZOfAvp/nX8DHFD6af4GVvm/MqZEI6hiSY5giKDxqt1Is9oyZx8A4dPcGLIMAzin4HauSQYNIbgwi1UMBx3vknm8UnreF2OZ4y2yYTbNlts2O2TV7Zt+06qZlmVbDtJqm1TKttml1TKtrWj3T6puNUkBOQuWO/asrA68HMNhZAdTogoV4HUA/NeLEp8IEYKhLAvCMh4rcRBSwK8DrtgSUwcU1jg0KBm7+h4h+AEdqHAL0eOhvDI/A0daujhmHP2IVcTgTDlQxKJ0oSkeScFMjEIWHSopbXMj0zaD0J+o8Ap6nsAh+4v4PFRVCtaONEcI0iJUDdDwhiDYLXbVJOY55YJpFYMr3NITcgL/KiVGOTuH6GVih3YSPZu7BSKDDC7gKwIP62KHghLiU2h5fq7v8s7OFxxPfwWv5hDlwJ7lnnMiMG1RMt3AdhNLnQId7AX8BlJM9Hrs1cKio3dJ5DUyqBeT545o50tvKY/m3SGOmMhnNTW9GYxXpUINK3eN/NIGGH6+v3hqC9PeOFfiVYlKADHEczF+rXo+eVf4CDEVEbEjWOeRWbQ7nrV+bWYYOPEoSyfWTOntrMXM9ifu8fuoDIJAuFoAuw4YY0BjRxGRG5xFx6W6BplaBpoeKGzMHkfkWSc23GLpV6SqoLOEgJaAMAlGM/gN6gcuD9dnm6gaYI7FD0/Rdgg+cFQH7XUWf4NftNfCfgnIGZSVUYYH/v2sVXjuCY8XWAKFBhl6loiQ2QtJgz7hFbyJsHQib4XMJ1IgZitSMzwAnzRNpZGkbpzSSiNTRAi7lAaliaYNiaceUSGo0YFM/CSCF9ML/A3RoxEcwFdwt6cd023ev+MNKnRUQPIl2lAsVfm18KD55r+jtYuAgqeWaIYChpDA3XdxYxBkCUsbTpS3bXa+yilUfNBmzNBXLJe7d43P0tgv0IjKzylomwVQaFNgdQEYBypBfy8+gBZrpoABhrFn4g29MIzc2K1XzjfHP/ippAzz2H3kTizb9oaxILOTKZLBR1Qk4P90ZbGCxwddhaXOgl22bgyQY/Cz6UEPVRnqfGu6/XUfCFyqjGBK8S4GVQCBGSRxxqKm5tNLpgWVWyRegrBg+Z5gsEaM2VSJN3TcNBwEsYawAc0DpEdQkNyaRl8qoJaWRBnTuJiU08bMHkOc+xOuhUjBfp8x8qafhOpl5BDGLxb8MptbrMprFxxBJHPMkdDQg3g8Bzgi03tASh0gZMyATuCuSqYYcBjKioboLcTUWNL6KJEmlISRJvkUGTlU1jGUI5USpPqIc4TOaCZDirnnRRx72aBEcYWo3CgbUsTGw43D182AcHD8n9tJVN0ZS4bGyBDZ5qEAIAALl0qU0J5qcxOLVSs6wOmG9SQkTzQM4xLBeLzZkEoeorLGAGukDBrO1agpBiKx0ecOfRfuQeSJVH1CJQOfi7gGenLcbTBZg6JbUbiIkDwyHSFKKz9+gIAvW34a90FWoLUENMNRTBMWjPhCdlp+mgg5JrhLoM26nsQhZ5msH81DdAz64PTk4Gs2uft/BBukjJDWmkU13/thDwz7s/vr+ApfP+Ied4tidXTDnCxAbk7q6Y5eUf/tZZfwXHSuomip9UdeAU1VzVYAH66OKEC5bQ2lXjteFcIMUiEyVbQFlFhAAeROBbew5raKq3P4/NHXk8znxvxf21zCkH/+zlbLUV8hZoE9TprUJ5MMJ6hxtuJP3ZWqxKgBMN8tpvQvfLMldna1AJUoJIDPrc1Vur4ifIAFAd6EIPU3FEje87fUiHiVY0d/vKJAsXbaCn+lRCCWFGFrqrnsF6sdkRa7smEGiZK3eXlkBNsviL6WwV22xUA9v7Yx56lGUnuXOmIn8Rp/ZF6AaHoMSY+BJo2SOz+YxDg9saLVUb7hNsLuAlmSuxiMhleyFhggL+Cv891FICA2JnY/pVr+88/lWZLyzVosodS0VHRbG3ElQDenuBjJb+ybM8cHnjyjK8+azXP2UmlDiwOcuszX6QYQL3R5DyqlRyVoRWkjBD6pRXTNBi3D2i3AiwWAeIWESQMWKyU05nC2z2TabHbPZNZs9s9k3W3WzZZmthtmCprFlttpmq2O2umarpPqHVK5xdlBSdSlJ/B0MVM3T7e06RmLBW5bii6t0Ivy05D/SWvY7BCmGRP2O3vsOVn5fAxkUR32fE8Fs8QugRAFza7zTL7MJGKoGo9mGWACQNRZ0bc0rVoZPPcJgwMsJ6gDV1mXYkDk4QrqGjHUVNyGNa0yk2Ib2aK4Ag/3SnjFMe0KSV/43bjNOwKVc0qzBfBVu/BBdnYkUE+8ApdXFagu12/WQZtX9gHvx595eafBWGmFqJ2XNQlmWliGlkNTqFnA5VEm+phrkeZ8YhnuwG6jwD7sZRAIqPa54ANIAXAc+w/VlAsGbIH9odyj+IUa64166j4myMB/ZmOnILLUWnZoOw9LjVGxiihoD+zwmdL17e7geAeKpauPX+asGCQy9rthYu1U3eMWN94D3R0D7by+sUZ/Ov7SgB5bXOYbxEEazp6pKq5sam4SoqAISQnRZgPMThQtQCtgS5HK01OqbuuDgal1VYRssDGCkQWwbGUam8iurFCtGdIqnPLYCDU3mfjGkS5skOPuhopVkCTelia2qm+gKcNRDBVI5lMrN2BC8xg7wT6cEnDdlUjFfKiKgKuI3RMUZyhkq9lcbQ3eDp/00lxQpVhsmzEcaBW7g9lLURqt3WUPZgJyBrZqenWHL4mrPQnXzsBnB3hvKm+5XlA4CgtKwhocguqgjFSqEjihfSCzltp69qb2IkshGoIY/ODyBvGbLdIqutHBYHL9nXBdYzKglYyyU5RqfPPwhF1N8a8bOalCKHzXuQCzCvVBrqEvliFkwwIaOyQdW1lJ5xHYNbqPAL6GmNG3WqESrc+mCr1YKtPxQqkrSpOjbS6iIjUUSptKofC014dTpp3P61eWUitKE9xppqfGvhWIJoknkkLTMbdFmmk1oOh9Td4sDNVzNB5XZvbXHIc0eExxBpOrNmFJbkxR8+ypNPKK7iyxxHypKhr7qLMzMBVnybxOgateCxcQGWpdnuAI4hGfU1LI0NTX2jON0EoYjQb0HQEjk+8KGpbqVsQlUUxLAUg1BdEM+EdJezfulwiM76dxFyW7V4+8qI/QeSeznmuO9HSDLMlGuzSthsDRYxydU5LK4lV97lN5qZC+bShppgyaSxC+PRrdMhHIcvGrmof4UkPmACHo1PdtVIQ558QZJNdfqNY4arDscTPb4Gl+G6CKpMC6kv1E8LAS3mepl8vOL85QZWe+ctfz6jdGbdl838D5SkBtT1M2q93EcbFfnTEvCn59vRlq9biXa9DvVqhWhK02xVfZlyFVXK1PHD4zxNZV4reZ7SmWbTFFvfwxMEL800FKOg1y2vXTWAtbrl0AReDbH+s6eMmunhHf65oUjygIlNsqA2E3fW5TtzDk9ZfIUGNtsTmkJH0tfheakXnAXpAuNpZ64aILJJpIqyU92gpQXioz+uVn97StlXptmWVmbpdPq776SVf72epvNtAHaOABSM+1s/uWDakaRV5o5pEyvB70ZzWYuL4huWyeOPtbsNNctPvyumAZ+zbksn73FtJhkAhFAyXfSmqwXlBTND924VZpm41tin6Nh7/yDgZN8gZleQN9RD6/KswOaz2lgBeKBqNGW5MUr+rJwzIS2kiFpvVJbv+09Shu/7jvy9x/pS7ZYlF7xg3J9M5eQyNRxTEXEtbNyE7N/KFCSs3vGOb4vEkmswkufAWKsSBzipy/DcNhemjoUOQv6GgWBAC2m5vH4LhN1MY+XQoUXVgZ4BJP5pOpflb/++Ou/ShYKLQ==" target="_blank">click to display</a>
      </li>
      <li>
        <a href="https://netnet.studio/?layout=dock-left#code/eJztVU1vEzEQvedXjIJQoEq9myIQpNuc4MaN8gMce7KZ4q/6Iw1C/e+MdzdVq6pcuCEulf12/ObNm+mkS/mnwc0MQKQgFUb4xWeAO9J5v4ZV2x7uLgdkj9Tv8wjtK3Q/4z8JVSbvpldWxp7cGlqQJfvLCTueT2wf2jYcx6ddMyWedRNF1dCFjRAiqeiNAe3vHN+6Jmxq+Clq1mk6gDIypav5qHm+6RoGH5EB6at5WM0H0v1qE2TMsOoaPo5pBmlffUQLFFKxnM34CIkySIt5Ccq7yoW5RJCaAiVS5HpAQ/w1oeYXgFSS9Roy2sCvySnSpIvLUDIYuWV+wDxyIzvROwnS0G2RAr5nQEeWycFSPRz4Ku0SbgslcD7lWDTgEaOiLIeiijHSKj8y1yAWVTMNlBQ4GFCycsua/FgBp8oCPldKbgkCxcJKxmLJQcQQcY9OY+TKGTh4UwKnQ5bDlQKmhKDImJNFXFCBXelJZnBVELC3fClRwJejwpCxVB/ZA6+URMVxqgTSMtcXXEWInjS66mJ1ipOqYoKsdYPf7dhmCRoTxvrV8iTUnlSDiO1Ik6/FitrIZ7PxpP8XT/t/8b///3z/X94Nf1obPDcqUsiQorqa73MOad00SrubJJTxRe+MjCjY2UbeyGNjaJuaPsnQvBOrC/F+OAtuo7hJlXVk2/w17bdhE15H6nuML/PXaW7OoDd+Kw1UAjhr6nYeZO2it9f+zeJVWC2W06I+rmFxzpu8XSyHe/S15wP4sdXYL+qSfhz8LHCIGjGUqSLcW5yQ9Fj3eqJhjU39hfiBMa2BpxuXE87hZfsUyqe3o+xTYOb/Y8ayD/Cpff2A8wAzuvXZW1A8WhgXw5f7Wsbb2YNhvwEMSEo1" target="_blank">scroll-trigger animation</a>
        </li>
        <li>
          <a href="https://netnet.studio/?gh=nbriz/csv-example/main" target="_blank">map internet data</a>
          </li>
      </ul>
    </div>
  `
  const h = nn.get('#nfo .kit').offsetHeight + 120
  window.resizeNFO(h)
}
