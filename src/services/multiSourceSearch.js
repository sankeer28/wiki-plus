import { ArticleLoader } from './articleLoader'

export class MultiSourceSearchService {
  constructor() {
    this.articleLoader = new ArticleLoader()
  }

  // Search English Wikipedia
  async searchWikipedia(query, limit = 20) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json&origin=*`
      const response = await fetch(searchUrl)
      const data = await response.json()

      const titles = data[1] || []
      const descriptions = data[2] || []
      return titles.map((title, idx) => ({
        id: `wiki-${idx}`,
        title: title,
        description: descriptions[idx] || '',
        source: 'Wikipedia',
        sourceColor: '#000000'
      }))
    } catch (error) {
      console.error('Wikipedia search error:', error)
      return []
    }
  }


  // Search Wikidata
  async searchWikidata(query, limit = 20) {
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
        sourceColor: '#339966',
        wikidataId: item.id
      }))
    } catch (error) {
      console.error('Wikidata search error:', error)
      return []
    }
  }

  // Search all sources and combine results
  async searchAllSources(query) {
    try {
      console.log(`Searching all sources for: ${query}`)

      // Search all sources in parallel
      const [wikipediaResults, wikidataResults] = await Promise.all([
        this.searchWikipedia(query, 30),
        this.searchWikidata(query, 20)
      ])

      // Combine results
      const allResults = [
        ...wikipediaResults,
        ...wikidataResults
      ]

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
  async loadArticleContent(title, source) {
    try {
      // Both Wikipedia and Wikidata entries can load from Wikipedia
      const article = await this.articleLoader.loadArticleContent(title)
      article.source = source
      return article
    } catch (error) {
      console.error(`Error loading article from ${source}:`, error)
      return {
        title: title,
        content: `Unable to load article "${title}" from ${source}. Please try again.`,
        timestamp: new Date().toISOString(),
        source: source
      }
    }
  }
}
