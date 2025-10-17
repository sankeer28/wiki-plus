import { ArticleLoader } from './articleLoader'

export class IndexSearchService {
  constructor() {
    this.index = []
    this.cachedArticles = new Map()
    this.isIndexLoaded = false
    this.articleLoader = new ArticleLoader()
  }

  async loadIndex() {
    if (this.isIndexLoaded) return this.index

    try {
      console.log('Loading Wikipedia index...')
      const response = await fetch('/data/simplewiki-20240901-pages-articles-multistream-index.txt')

      if (!response.ok) {
        throw new Error('Failed to load index')
      }

      const text = await response.text()
      const lines = text.split('\n')

      // Parse index file
      // Format: offset:page_id:title
      this.index = lines
        .filter(line => line.trim())
        .map((line, idx) => {
          const parts = line.split(':')
          if (parts.length >= 3) {
            return {
              id: idx + 1,
              offset: parseInt(parts[0]),
              pageId: parts[1],
              title: parts.slice(2).join(':').trim()
            }
          }
          return null
        })
        .filter(item => item !== null)

      this.isIndexLoaded = true
      console.log(`Loaded ${this.index.length} article titles from index`)
      return this.index
    } catch (error) {
      console.error('Error loading index:', error)
      return []
    }
  }

  searchIndex(query) {
    if (!query || query.trim() === '') return []

    const searchTerm = query.toLowerCase()
    const results = this.index
      .filter(item => item.title.toLowerCase().includes(searchTerm))
      .slice(0, 50) // Limit to 50 results

    return results
  }

  async loadArticleContent(title) {
    // Check cache first
    if (this.cachedArticles.has(title)) {
      return this.cachedArticles.get(title)
    }

    try {
      // Use the article loader to fetch from Wikipedia API
      const article = await this.articleLoader.loadArticleContent(title)

      // Cache the result
      this.cachedArticles.set(title, article)
      return article
    } catch (error) {
      console.error('Error loading article:', error)
      return {
        title: title,
        content: `Error loading article: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }
  }

  getSampleArticles() {
    // Return first 100 articles from index for browsing
    return this.index.slice(0, 100).map(item => ({
      id: item.id,
      title: item.title,
      content: 'Click to load full article content...',
      timestamp: new Date().toISOString(),
      isPreview: true
    }))
  }

  clearCache() {
    this.cachedArticles.clear()
  }
}
