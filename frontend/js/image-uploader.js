window.imageUploader = (ele, opts, func) => {
  const types = opts.types || ['image/jpeg', 'image/png', 'image/gif']
  const maxSize = opts.maxSize || 1000

  function isAllowed (type) {
    if (types) {
      return types.indexOf(type) > -1
    } else return true
  }

  function nameCheck (name) {
    if (name.includes(' ')) return false
    else if (name !== name.toLowerCase()) return false
    else return true
  }

  async function handleFile (file, name) {
    const formData = new window.FormData()
    formData.append('image', file, name)
    const data = { method: 'POST', body: formData }
    const req = await window.fetch('api/upload-image', data)
    const json = await req.json()
    func(json)
  }

  function readFiles (file) {
    const maxBytes = (maxSize) ? maxSize * 1000 : Infinity
    if (typeof FileReader !== 'undefined' &&
      isAllowed(file.type) &&
      nameCheck(file.name) &&
      file.size <= maxBytes) {
      const reader = new window.FileReader()
      reader.onload = (e) => handleFile(file, file.name, file.type)
      reader.readAsDataURL(file)
    } else {
      if (!isAllowed(file.type)) {
        func({ error: `attempted to upload restricted file type ${file.type}` })
      } else if (file.size > maxBytes) {
        func({ error: `file larger than max size of ${maxBytes}` })
      } else if (!nameCheck(file.name)) {
        func({ error: 'the filename must be all lower-case and can not include spaces' })
      }
    }
  }

  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('hidden', true)
  document.body.appendChild(input)
  input.addEventListener('change', () => readFiles(input.files[0]))
  document.querySelector(ele).addEventListener('click', () => input.click())
}
