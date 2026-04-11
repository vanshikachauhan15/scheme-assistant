/**
 * Updates document title and meta tags so browser tab + search/social snippets
 * match the active UI language (Hindi vs English).
 */
function getOrCreateMeta(selector, create) {
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    create(el)
    document.head.appendChild(el)
  }
  return el
}

/**
 * @param {{ title: string; description: string; lang: string }} p
 */
export function applySeoMeta({ title, description, lang }) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.title = title

  const desc = getOrCreateMeta('meta[name="description"]', (el) => {
    el.setAttribute('name', 'description')
  })
  desc.setAttribute('content', description)

  const ogTitle = getOrCreateMeta('meta[property="og:title"]', (el) => {
    el.setAttribute('property', 'og:title')
  })
  ogTitle.setAttribute('content', title)

  const ogDesc = getOrCreateMeta('meta[property="og:description"]', (el) => {
    el.setAttribute('property', 'og:description')
  })
  ogDesc.setAttribute('content', description)

  const twTitle = getOrCreateMeta('meta[name="twitter:title"]', (el) => {
    el.setAttribute('name', 'twitter:title')
  })
  twTitle.setAttribute('content', title)

  const twDesc = getOrCreateMeta('meta[name="twitter:description"]', (el) => {
    el.setAttribute('name', 'twitter:description')
  })
  twDesc.setAttribute('content', description)
}
