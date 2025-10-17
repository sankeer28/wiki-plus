import { XMLLoader } from './xmlLoader'

export class ArticleLoader {
  constructor() {
    this.cache = new Map()
    this.xmlLoader = new XMLLoader()
  }

  async loadArticleContent(title) {
    // Check cache first
    if (this.cache.has(title)) {
      console.log(`Loading "${title}" from cache`)
      return this.cache.get(title)
    }

    try {
      console.log(`Fetching article: ${title}`)

      // Use Wikipedia API to fetch article content
      const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        // Try Simple English Wikipedia instead
        const simpleApiUrl = `https://simple.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        const simpleResponse = await fetch(simpleApiUrl)

        if (!simpleResponse.ok) {
          throw new Error('Article not found')
        }

        const data = await simpleResponse.json()
        const article = {
          title: data.title || title,
          content: this.formatWikipediaContent(data),
          timestamp: data.timestamp || new Date().toISOString(),
          url: data.content_urls?.desktop?.page
        }

        this.cache.set(title, article)
        return article
      }

      const data = await response.json()

      const article = {
        title: data.title || title,
        content: this.formatWikipediaContent(data),
        timestamp: data.timestamp || new Date().toISOString(),
        url: data.content_urls?.desktop?.page
      }

      // Cache the article
      this.cache.set(title, article)
      console.log(`Article "${title}" loaded and cached`)

      return article
    } catch (error) {
      console.error(`Error loading article "${title}" from API:`, error)

      // Try to load from local XML chunks as fallback
      try {
        console.log(`Attempting to load "${title}" from local XML chunks...`)
        const xmlArticle = await this.xmlLoader.findArticleByTitle(title)

        if (xmlArticle) {
          console.log(`Found "${title}" in local XML chunks`)
          this.cache.set(title, xmlArticle)
          return xmlArticle
        }
      } catch (xmlError) {
        console.error(`Error loading from XML chunks:`, xmlError)
      }

      // Return error article if both methods fail
      return {
        title: title,
        content: `Unable to load article "${title}". The article may not exist or there was a network error. Please try again or search for a different article.`,
        timestamp: new Date().toISOString()
      }
    }
  }

  formatWikipediaContent(data) {
    let content = ''

    // Add extract (summary)
    if (data.extract) {
      content += data.extract + '\n\n'
    }

    // Add description if available
    if (data.description) {
      content += `Description: ${data.description}\n\n`
    }

    // Add type if available
    if (data.type) {
      content += `Type: ${data.type}\n\n`
    }

    // Add link to full article
    if (data.content_urls?.desktop?.page) {
      content += `\n\nRead more: ${data.content_urls.desktop.page}`
    }

    return content || 'No content available for this article.'
  }

  clearCache() {
    this.cache.clear()
    console.log('Article cache cleared')
  }

  getCacheSize() {
    return this.cache.size
  }
}
