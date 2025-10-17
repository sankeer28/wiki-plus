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

    // Remove unwanted elements
    const selectorsToRemove = [
      'script',
      'style',
      '.mw-editsection',
      '.reference',
      '.mw-references-wrap',
      '.navbox',
      '.infobox',
      '.thumb',
      'sup.reference'
    ]

    selectorsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove())
    })

    // Get the main content
    const body = doc.body
    let textContent = ''

    // Extract text from paragraphs and headers
    body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach(el => {
      const text = el.textContent.trim()
      if (text) {
        if (el.tagName.startsWith('H')) {
          textContent += `\n\n## ${text}\n\n`
        } else if (el.tagName === 'LI') {
          textContent += `• ${text}\n`
        } else {
          textContent += `${text}\n\n`
        }
      }
    })

    return textContent.trim() || 'No content available for this article.'
  }

  clearCache() {
    this.cache.clear()
    console.log('Article cache cleared')
  }

  getCacheSize() {
    return this.cache.size
  }
}
