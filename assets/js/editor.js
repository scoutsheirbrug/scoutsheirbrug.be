const TOKEN_KEY = 'scoutsheirbrug-token'
const EDITING_KEY = 'scoutsheirbrug-editing'
const REPO = 'scoutsheirbrug/scoutsheirbrug.be'
const REF = 'no-jekyll'

const editorButton = document.querySelector('footer .editor')
if (editorButton) {
  initialize()
}

function initialize() {
  if (localStorage.getItem(TOKEN_KEY)) {
    editorButton.textContent = '[Bewerken]'
  } else {
    sessionStorage.removeItem(EDITING_KEY)
  }
  if (sessionStorage.getItem(EDITING_KEY)) {
    enableEditor()
  }

  editorButton.addEventListener('click', () => {
    if (sessionStorage.getItem(EDITING_KEY)) {
      disableEditor()
      return
    } else if (localStorage.getItem(TOKEN_KEY)) {
      enableEditor()
    } else {
      openModal('Inloggen').then((token) => {
        if (!token) return
        if (token.startsWith('github_pat_')) {
          localStorage.setItem(TOKEN_KEY, token)
          enableEditor()
        } else {
          showToast('Ongeldige token!', true)
        }
      })
    }
  })
}

function enableEditor() {
  sessionStorage.setItem(EDITING_KEY, 'true')
  document.body.classList.add('editing')
  editorButton.textContent = '[Bewerken uitschakelen]'
  document.querySelectorAll('[data-edit]').forEach((e) => {
    e.addEventListener('click', (evt) => {
      if (!sessionStorage.getItem(EDITING_KEY)) {
        return
      }
      evt.preventDefault()
      makeEdit(e.getAttribute('data-edit'))
        .then((success) => {
          if (success) showToast('Succesvol bewerkt! Aanpassing is publiek binnen enkele seconden...')
        })
        .catch((e) => {
          console.error(e)
          showToast(e instanceof Error ? e.message : `${e}`, true)
        })
    })
  })
}

function disableEditor() {
  sessionStorage.removeItem(EDITING_KEY)
  document.body.classList.remove('editing')
  editorButton.textContent = '[Bewerken]'
}

/**
 * @param {string} key
 */
async function makeEdit(key) {
  // 1. Huidige broncode ophalen van GitHub
  const path = `${location.pathname.replace(/^\//, '')}index.html`
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${REF}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
    },
  })
  const getData = await getRes.json()
  if (!getRes.ok) {
    throw new Error(`Kan pagina niet bewerken: ${getRes.status} ${getData.message}`)
  }
  const text = decodeURIComponent(escape(atob(getData.content)))
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  const element = doc.querySelector(`[data-edit=${key}]`)

  let hasChanged = false
  let commitMessage = undefined

  // 2. Element aanpassen in de DOM
  if (element instanceof HTMLAnchorElement) {
    if (element.href.startsWith('https://')
      && !element.href.startsWith(`${location.protocol}//${location.hostname}`)
    ) {
      // Externe link
      const newLink = await openModal('Link aanpassen', { value: element.href })
      if (!newLink || element.href === newLink) {
        return false
      }
      if (!newLink.startsWith('https://')) {
        throw new Error('Link moet beginnen met https://')
      }
      element.href = newLink
      commitMessage = `🔗 Wijzig link ${key}`
    } else {
      // PDF document
      const newFiles = await openModal('Document aanpassen', {
        subtitle: `Huidig bestand: <a href="${element.href}" target="_blank">${decodeURIComponent(element.href.split('/').pop())}</a>`,
        type: 'file',
        accept: 'application/pdf',
      })
      if (!newFiles || newFiles.length === 0) {
        return false
      }
      const pdfFile = newFiles[0]
      if (pdfFile.size > 25 * 1024 * 1024) {
        throw new Error('Document is te groot (max 25MB)')
      }
      const pdfPath = `assets/pdf/${encodeURIComponent(pdfFile.name)}`
      await uploadFile(pdfPath, key, pdfFile)
      element.href = `/${pdfPath}`
      commitMessage = `📄 Wijzig document ${key}`
    }
  } else if (element instanceof HTMLPictureElement) {
    // Afbeelding
    const imgElement = element.querySelector('img')
    if (!imgElement) {
      throw new Error('Kan dit element niet bewerken')
    }
    const newFiles = await openModal('Afbeelding aanpassen', { type: 'file', accept: 'image/*', help: 'Tip: Je kan <a href="https://squoosh.app/" target="_blank">squoosh.app</a> gebruiken om een afbeelding kleiner te maken.' })
    if (!newFiles || newFiles.length === 0) {
      return false
    }
    const imageFile = newFiles[0]
    if (imageFile.size > 2 * 1024 * 1024) {
      throw new Error('Afbeelding is te groot (max 2MB)')
    }
    const imagePath = `assets/img/${encodeURIComponent(imageFile.name)}`
    await uploadFile(imagePath, key, imageFile)
    hasChanged = true
    imgElement.src = `/${imagePath}`
    commitMessage = `🖼️ Wijzig afbeelding ${key}`
  } else if (element instanceof HTMLDivElement) {
    // Tekst
    const markdown = htmlToMarkdown(element)
    const newMarkdown = await openModal('Tekst aanpassen', { value: markdown, multiline: true })
    if (!newMarkdown || markdown === newMarkdown) {
      return false
    }
    const indentLevel = getIndentLevel(element)
    element.innerHTML = markdownToHtml(newMarkdown, indentLevel)
  } else {
    throw new Error('Kan dit element niet bewerken')
  }

  // 3. Nieuwe broncode committen naar GitHub
  const documentText = doc.documentElement.outerHTML
    .replace('<html lang="nl"><head>', '<html lang="nl">\n<head>')
    .replace('</body></html>', '</body>\n</html>')
    .replace(/\n+<\/body>/, '\n</body>')
  const newText = `<!DOCTYPE html>\n${documentText}\n`
  if (text === newText) {
    return hasChanged
  }
  const newTextUtf8 = unescape(encodeURIComponent(newText))
  const putRes = await fetch (`https://api.github.com/repos/${REPO}/contents/${path}?ref=${REF}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage ?? `✏️ Bewerk ${key}`,
      content: btoa(newTextUtf8),
      sha: getData.sha,
    })
  })
  const putData = await putRes.json()
  if (!putRes.ok) {
    throw new Error(`Fout tijdens het aanpassen: ${putRes.status} ${putData.message}`)
  }
  return true
}

/**
 * @param {string} path
 * @param {string} key
 * @param {File} file
 */
async function uploadFile(path, key, file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const checkRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${REF}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
    },
  })
  const existingSha = checkRes.ok ? (await checkRes.json()).sha : undefined
  const uploadRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${REF}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `⬆️ Upload ${key}: ${decodeURIComponent(path)}`,
      content: base64,
      sha: existingSha,
    }),
  })
  if (!uploadRes.ok) {
    const uploadData = await uploadRes.json()
    throw new Error(`Fout tijdens uploaden: ${uploadRes.status} ${uploadData.message}`)
  }
}

/**
 * @param {string} title
 * @param {{
 *   subtitle?: string,
 *   type: string,
 *   value?: string,
 *   multiline?: boolean,
 *   accept?: string,
 *   help?: string,
 * }} options
 */
async function openModal(title, options = { type: 'text' }) {
  const container = document.createElement('div')
  container.classList.add('modal-container')
  document.body.append(container)
  const modal = document.createElement('div')
  modal.classList.add('modal')
  container.append(modal)

  const heading = document.createElement('h2')
  heading.textContent = title
  modal.append(heading)
  if (options.subtitle) {
    const subtitle = document.createElement('p')
    subtitle.innerHTML = options.subtitle
    modal.append(subtitle)
  }

  const input = document.createElement(options.multiline ? 'textarea' : 'input')
  if (options.multiline) {
    input.rows = 10
  } else {
    input.type = options.type
  }
  if (options.type === 'file') {
    input.accept = options.accept
  } else {
    if (options.value) {
      input.value = options.value
    }
    input.selectionStart = 0
    input.selectionEnd = 0
  }
  modal.append(input)
  if (options.help) {
    const help = document.createElement('p')
    help.innerHTML = options.help
    modal.append(help)
  }
  const button = document.createElement('button')
  button.classList.add('btn')
  button.textContent = 'Opslaan'
  modal.append(button)
  input.focus()

  const result = await new Promise((res) => {
    container.addEventListener('click', (e) => e.target === container ? res(null) : null)
    container.addEventListener('keydown', (e) => e.key === 'Escape' ? res(null) : null)
    button.addEventListener('click', () => res(options.type === 'file' ? input.files : input.value))
  })

  document.querySelectorAll('.modal-container').forEach((e) => e.remove())
  return result
}

/**
 * @param {string} title
 * @param {boolean} error
 */
function showToast(title, error = false) {
  document.querySelectorAll('.toast').forEach((e) => e.remove())
  const toast = document.createElement('toast')
  toast.textContent = title
  toast.classList.add('toast')
  if (error) {
    toast.classList.add('toast-error')
  }
  document.body.append(toast)
  setTimeout(() => toast.remove(), 8000)
}

/**
 * @param {HTMLDivElement} element
 */
function htmlToMarkdown(element) {
  let md = ''
  for (const child of element.children) {
    if (child instanceof HTMLHeadingElement) {
      const prefix = {H1: '#', H2: '##', H3: '###'}[child.tagName] ?? '####'
      md += `${prefix} ${child.textContent.replace(/\s+/g, ' ').trim()}\n\n`
    } else if (child instanceof HTMLParagraphElement) {
      md += `${inlineHtmlToMarkdown(child)}\n\n`
    } else if (child instanceof HTMLUListElement) {
      for (const item of child.children) {
        md += `- ${inlineHtmlToMarkdown(item)}\n`
      }
      md += '\n'
    } else {
      throw new Error('Deze tekst is te complex om te bewerken.')
    }
  }
  return md.trimEnd() + '\n'
}

/**
 * @param {HTMLElement} element 
 */
function inlineHtmlToMarkdown(element) {
  let md = ''
  for (const child of element.childNodes) {
    if (child instanceof Text) {
      md += child.textContent.replace(/\s+/g, ' ')
    } else if (child instanceof HTMLAnchorElement) {
      md += `[${child.textContent.replace(/\s+/g, ' ').trim()}](${child.href})`
    }
  }
  return md.trim()
}

/**
 * @param {HTMLDivElement} div
 */
function getIndentLevel(div) {
  if (!div.parentElement) return 0
  const parentHtml = div.parentElement.innerHTML
  const divIndex = parentHtml.indexOf(div.outerHTML)
  if (divIndex === -1) return 0
  const precedingText = parentHtml.substring(
    parentHtml.lastIndexOf('>', divIndex - 1) + 1,
    divIndex
  )
  const lastNewline = precedingText.lastIndexOf('\n')
  const indentationText = lastNewline === -1 
    ? precedingText 
    : precedingText.substring(lastNewline + 1)
  return (indentationText.match(/ /g) || []).length
}

/**
 * @param {string} md
 * @param {number} indentLevel
 */
function markdownToHtml(md, indentLevel) {
  const i0 = ' '.repeat(indentLevel)
  const i1 = i0 + '  '
  const i2 = i1 + '  '
  const lines = md.split('\n')
  let html = `\n`
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s(.*)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      html += `${i1}<h${level}>\n${i2}${escapeHtml(text)}\n${i1}</h${level}>\n`
      i++
      continue
    }

    // Unordered lists
    if (line.startsWith('- ')) {
      html += `${i1}<ul>\n`
      while (i < lines.length && lines[i].startsWith('- ')) {
        const text = lines[i].substring(2).trim()
        html += `${i2}<li>${inlineMarkdownToHtml(text)}</li>\n`
        i++
      }
      html += `${i1}</ul>\n`
      continue
    }

    // Paragraphs
    html += `${i1}<p>\n`
    while (i < lines.length) {
      const line = lines[i].trim()
      if (!line || line.startsWith('- ') || line.match(/^(#{1,4})\s/)) {
        break
      }
      html += `${i2}${inlineMarkdownToHtml(line)}\n`
      i++
    }
    html += `${i1}</p>\n`
  }

  return html + i0
}

/**
 * @param {string} text
 */
function inlineMarkdownToHtml(text) {
  let html = ''
  while (text.length > 0) {
    const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (!linkMatch) {
      html += escapeHtml(text)
      break
    }

    if (linkMatch.index > 0) {
      html += escapeHtml(text.substring(0, linkMatch.index))
    }
    const href = escapeHtml(linkMatch[2])
    html += `<a href="${href}"${href.startsWith('https://') ? ' target="_blank"' : ''}>${escapeHtml(linkMatch[1])}</a>`
    text = text.substring(linkMatch.index + linkMatch[0].length)
  }
  return html
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
