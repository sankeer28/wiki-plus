import { ArticleLoader } from './articleLoader'

export class MultiSourceSearchService {
  constructor() {
    this.articleLoader = new ArticleLoader()
    this.sources = {
      wikipedia: { name: 'Wikipedia', url: 'https://en.wikipedia.org/w/api.php', color: '#000000', enabled: true },
      wikidata: { name: 'Wikidata', url: 'https://www.wikidata.org/w/api.php', color: '#339966', enabled: true },
      wikiquote: { name: 'Wikiquote', url: 'https://en.wikiquote.org/w/api.php', color: '#990000', enabled: true },
      wiktionary: { name: 'Wiktionary', url: 'https://en.wiktionary.org/w/api.php', color: '#0066cc', enabled: true },
      wikivoyage: { name: 'Wikivoyage', url: 'https://en.wikivoyage.org/w/api.php', color: '#ff6600', enabled: true },
      wikibooks: { name: 'Wikibooks', url: 'https://en.wikibooks.org/w/api.php', color: '#996633', enabled: true },
      wikinews: { name: 'Wikinews', url: 'https://en.wikinews.org/w/api.php', color: '#cc0000', enabled: true },
      wikiversity: { name: 'Wikiversity', url: 'https://en.wikiversity.org/w/api.php', color: '#6633cc', enabled: true },
      wikisource: { name: 'Wikisource', url: 'https://en.wikisource.org/w/api.php', color: '#666666', enabled: true }
    }
  }

  // Generic search for MediaWiki-based sources
  async searchMediaWiki(sourceKey, query, limit = 15) {
    const source = this.sources[sourceKey]
    if (!source || !source.enabled) return []

    try {
      const searchUrl = `${source.url}?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json&origin=*`
      const response = await fetch(searchUrl)
      const data = await response.json()

      const titles = data[1] || []
      const descriptions = data[2] || []
      return titles.map((title, idx) => ({
        id: `${sourceKey}-${idx}`,
        title: title,
        description: descriptions[idx] || '',
        source: source.name,
        sourceKey: sourceKey,
        sourceColor: source.color
      }))
    } catch (error) {
      console.error(`${source.name} search error:`, error)
      return []
    }
  }


  // Search Wikidata (uses different API format)
  async searchWikidata(query, limit = 15) {
    if (!this.sources.wikidata.enabled) return []

    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&limit=${limit}&format=json&origin=*`
      const response = await fetch(searchUrl)
      const data = await response.json()

      const results = data.search || []
      return results.map((item, idx) => ({
        id: `wikidata-${item.id}`,
        title: item.label || item.id,
        description: item.description || 'No description available',
        source: 'Wikidata',
        sourceKey: 'wikidata',
        sourceColor: this.sources.wikidata.color,
        wikidataId: item.id
      }))
    } catch (error) {
      console.error('Wikidata search error:', error)
      return []
    }
  }

  // Set which sources are enabled
  setEnabledSources(enabledSources) {
    Object.keys(this.sources).forEach(key => {
      this.sources[key].enabled = enabledSources.includes(key)
    })
  }

  // Get all source configurations
  getAllSources() {
    return Object.keys(this.sources).map(key => ({
      key: key,
      ...this.sources[key]
    }))
  }

  // Search all enabled sources and combine results
  async searchAllSources(query) {
    try {
      console.log(`Searching enabled sources for: ${query}`)

      // Get all enabled sources
      const enabledSourceKeys = Object.keys(this.sources).filter(key => this.sources[key].enabled)

      // Create search promises for all enabled sources
      const searchPromises = enabledSourceKeys.map(key => {
        if (key === 'wikidata') {
          return this.searchWikidata(query, 15)
        } else {
          return this.searchMediaWiki(key, query, 15)
        }
      })

      // Execute all searches in parallel
      const resultsArrays = await Promise.all(searchPromises)

      // Combine all results
      const allResults = resultsArrays.flat()

      // Remove duplicates based on title (case insensitive)
      const uniqueResults = []
      const seenTitles = new Set()

      for (const result of allResults) {
        const normalizedTitle = result.title.toLowerCase()
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle)
          uniqueResults.push(result)
        }
      }

      console.log(`Found ${uniqueResults.length} unique results from ${allResults.length} total results`)
      return uniqueResults
    } catch (error) {
      console.error('Multi-source search error:', error)
      return []
    }
  }

  // Load article content based on source
  async loadArticleContent(title, source, sourceKey) {
    try {
      // Get the source configuration
      const sourceConfig = sourceKey ? this.sources[sourceKey] : null

      // For non-Wikipedia sources, try their specific API first
      if (sourceConfig && sourceKey !== 'wikipedia' && sourceKey !== 'wikidata') {
        const baseUrl = sourceConfig.url.replace('/w/api.php', '')
        const apiUrl = `${baseUrl}/api/rest_v1/page/html/${encodeURIComponent(title)}`

        const response = await fetch(apiUrl)
        if (response.ok) {
          const htmlContent = await response.text()
          return {
            title: title,
            content: this.articleLoader.formatHTMLContent(htmlContent),
            timestamp: new Date().toISOString(),
            url: `${baseUrl}/wiki/${encodeURIComponent(title)}`,
            source: source
          }
        }
      }

      // Fallback to Wikipedia or general load
      const article = await this.articleLoader.loadArticleContent(title)
      article.source = source
      return article
    } catch (error) {
      console.error(`Error loading article from ${source}:`, error)
      // Return null to indicate failure instead of error message
      return null
    }
  }
}
