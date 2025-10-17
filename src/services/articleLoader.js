export class ArticleLoader {
  constructor() {
    this.cache = new Map()
  }

  async loadArticleContent(title) {
    // Check cache first
    if (this.cache.has(title)) {
      console.log(`Loading "${title}" from cache`)
      return this.cache.get(title)
    }

    try {
      console.log(`Fetching article: ${title}`)

      // Use Wikipedia API to fetch FULL article content (not just summary)
      const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        // Try Simple English Wikipedia instead
        const simpleApiUrl = `https://simple.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`
        const simpleResponse = await fetch(simpleApiUrl)

        if (!simpleResponse.ok) {
          throw new Error('Article not found')
        }

        const htmlContent = await simpleResponse.text()
        const article = {
          title: title,
          content: this.formatHTMLContent(htmlContent),
          timestamp: new Date().toISOString(),
          url: `https://simple.wikipedia.org/wiki/${encodeURIComponent(title)}`
        }

        this.cache.set(title, article)
        return article
      }

      const htmlContent = await response.text()

      const article = {
        title: title,
        content: this.formatHTMLContent(htmlContent),
        timestamp: new Date().toISOString(),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
      }

      // Cache the article
      this.cache.set(title, article)
      console.log(`Article "${title}" loaded and cached`)

      return article
    } catch (error) {
      console.error(`Error loading article "${title}" from API:`, error)

      // Return error article if loading fails
      return {
        title: title,
        content: `Unable to load article "${title}". The article may not exist or there was a network error. Please try again or search for a different article.`,
        timestamp: new Date().toISOString()
      }
    }
  }

  formatHTMLContent(htmlContent) {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // Remove only truly unwanted elements (keep images and infoboxes)
    const selectorsToRemove = [
      'script',
      'style',
      '.mw-editsection',
      '.mw-references-wrap',
      '.navbox',
      'sup.reference'
    ]

    selectorsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove())
    })

    // Get the main content
    const body = doc.body
    const contentElements = []
    const images = []

    // Process all relevant content elements
    body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, ul, ol, figure, .thumb, .infobox, img').forEach(el => {
      // Skip if element is inside an infobox (infobox handles its own images)
      if (el.closest('.infobox') && !el.classList.contains('infobox')) {
        return
      }

      // Skip if IMG is inside figure or thumb (they'll be processed by their parent)
      if (el.tagName === 'IMG' && el.closest('figure, .thumb')) {
        return
      }

      if (el.tagName === 'IMG') {
        // Standalone image
        const imgData = this.extractImageData(el)
        if (imgData) {
          images.push(imgData)
          contentElements.push({
            type: 'image',
            data: imgData
          })
        }
      } else if (el.classList.contains('thumb') || el.tagName === 'FIGURE') {
        // Image with caption
        const imgData = this.extractImageFromFigure(el)
        if (imgData) {
          images.push(imgData)
          contentElements.push({
            type: 'image',
            data: imgData
          })
        }
      } else if (el.classList.contains('infobox')) {
        // Infobox (contains images and structured data)
        const infoboxData = this.extractInfobox(el)
        if (infoboxData) {
          contentElements.push({
            type: 'infobox',
            data: infoboxData
          })
        }
      } else if (el.tagName.startsWith('H')) {
        // Headers
        const text = el.textContent.trim()
        if (text) {
          contentElements.push({
            type: 'heading',
            level: parseInt(el.tagName[1]),
            text: text,
            html: this.processLinks(el)
          })
        }
      } else if (el.tagName === 'P') {
        // Paragraphs
        const text = el.textContent.trim()
        if (text) {
          contentElements.push({
            type: 'paragraph',
            text: text,
            html: this.processLinks(el)
          })
        }
      } else if (el.tagName === 'UL' || el.tagName === 'OL') {
        // Lists
        const items = Array.from(el.querySelectorAll('li')).map(li => ({
          text: li.textContent.trim(),
          html: this.processLinks(li)
        }))
        if (items.length > 0) {
          contentElements.push({
            type: el.tagName === 'UL' ? 'unordered-list' : 'ordered-list',
            items: items
          })
        }
      }
    })

    return {
      elements: contentElements,
      images: images
    }
  }

  extractImageData(img) {
    let src = img.getAttribute('src') || img.getAttribute('data-src')
    if (!src) return null

    // Convert protocol-relative URLs to https
    if (src.startsWith('//')) {
      src = 'https:' + src
    }

    // Use higher resolution image if available
    const srcset = img.getAttribute('srcset')
    if (srcset) {
      const sources = srcset.split(',').map(s => s.trim().split(' '))
      const highRes = sources.find(s => s[1] && parseInt(s[1]) >= 500)
      if (highRes) {
        src = highRes[0].startsWith('//') ? 'https:' + highRes[0] : highRes[0]
      }
    }

    return {
      src: src,
      alt: img.getAttribute('alt') || '',
      title: img.getAttribute('title') || '',
      width: img.getAttribute('width') || 'auto',
      height: img.getAttribute('height') || 'auto'
    }
  }

  extractImageFromFigure(figure) {
    const img = figure.querySelector('img')
    if (!img) return null

    const imgData = this.extractImageData(img)
    if (!imgData) return null

    // Get caption if available
    const caption = figure.querySelector('figcaption, .thumbcaption')
    if (caption) {
      imgData.caption = caption.textContent.trim()
    }

    return imgData
  }

  extractInfobox(infobox) {
    const rows = []
    const images = []

    // Extract images from infobox
    infobox.querySelectorAll('img').forEach(img => {
      const imgData = this.extractImageData(img)
      if (imgData) {
        images.push(imgData)
      }
    })

    // Extract key-value pairs
    infobox.querySelectorAll('tr').forEach(tr => {
      const th = tr.querySelector('th')
      const td = tr.querySelector('td')

      if (th && td) {
        rows.push({
          label: th.textContent.trim(),
          value: td.textContent.trim()
        })
      }
    })

    return {
      images: images,
      rows: rows
    }
  }

  processLinks(element) {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true)

    // Process all links to make them internal wiki links
    clone.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('./')) {
        // Wikipedia internal link format: ./Article_Name
        const title = decodeURIComponent(href.substring(2).replace(/_/g, ' '))
        link.setAttribute('data-wiki-link', title)
        link.setAttribute('href', '#')
        link.classList.add('wiki-link')
      } else if (href && !href.startsWith('http')) {
        // Relative link
        const title = decodeURIComponent(href.replace(/^\/wiki\//, '').replace(/_/g, ' '))
        link.setAttribute('data-wiki-link', title)
        link.setAttribute('href', '#')
        link.classList.add('wiki-link')
      }
    })

    return clone.innerHTML
  }

  clearCache() {
    this.cache.clear()
    console.log('Article cache cleared')
  }

  getCacheSize() {
    return this.cache.size
  }
}
