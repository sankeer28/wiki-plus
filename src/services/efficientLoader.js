export class EfficientLoader {
  constructor() {
    this.cachedArticles = null
    this.isLoading = false
  }

  async loadArticles(maxArticles = 1000, progressCallback = null) {
    // Return cached articles if available
    if (this.cachedArticles) {
      console.log('Returning cached articles')
      return this.cachedArticles
    }

    if (this.isLoading) {
      console.log('Already loading, please wait...')
      return []
    }

    this.isLoading = true

    try {
      if (progressCallback) progressCallback('Loading Wikipedia data...')

      // Use fetch with streaming for large files
      const response = await fetch('/data/simplewiki-20240901-pages-articles-multistream.xml')

      if (!response.ok) {
        throw new Error('Failed to load Wikipedia data')
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0')
      let loadedSize = 0

      if (progressCallback) progressCallback('Reading file...')

      const reader = response.body.getReader()
      const chunks = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        loadedSize += value.length

        if (totalSize > 0 && progressCallback) {
          const progress = Math.round((loadedSize / totalSize) * 100)
          if (progress % 10 === 0) {
            progressCallback(`Loading: ${progress}%`)
          }
        }
      }

      // Combine chunks
      const blob = new Blob(chunks)
      const text = await blob.text()

      if (progressCallback) progressCallback('Parsing articles...')

      // Parse articles
      const articles = await this.parseArticles(text, maxArticles, progressCallback)

      // Cache the results
      this.cachedArticles = articles

      return articles
    } catch (error) {
      console.error('Error loading articles:', error)
      if (progressCallback) progressCallback(`Error: ${error.message}`)
      return []
    } finally {
      this.isLoading = false
    }
  }

  async parseArticles(xmlContent, maxArticles, progressCallback) {
    const articles = []
    const pageRegex = /<page>([\s\S]*?)<\/page>/g
    const titleRegex = /<title>(.*?)<\/title>/
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/

    let match
    let count = 0
    let processed = 0

    while ((match = pageRegex.exec(xmlContent)) !== null && count < maxArticles) {
      const pageContent = match[1]
      processed++

      const titleMatch = titleRegex.exec(pageContent)
      const textMatch = textRegex.exec(pageContent)

      if (titleMatch && textMatch) {
        const title = this.decodeHTML(titleMatch[1])
        const rawText = this.decodeHTML(textMatch[1])
        const cleanText = this.cleanWikiText(rawText)

        if (cleanText.length > 100) {
          articles.push({
            id: count + 1,
            title: title,
            content: cleanText,
            timestamp: new Date().toISOString()
          })
          count++
        }
      }

      if (count % 100 === 0 && count > 0 && progressCallback) {
        progressCallback(`Parsed ${count} articles...`)
      }
    }

    if (progressCallback) {
      progressCallback(`Extracted ${articles.length} articles`)
    }

    return articles
  }

  cleanWikiText(text) {
    let cleaned = text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      .replace(/<ref[\s\S]*?<\/ref>/g, '')
      .replace(/<ref[^>]*\/>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      .replace(/\[http[^\]]+\]/g, '')
      .replace(/'{2,}/g, '')
      .replace(/={2,}(.*?)={2,}/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return cleaned
  }

  decodeHTML(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&nbsp;': ' '
    }
    return text.replace(/&[^;]+;/g, match => entities[match] || match)
  }

  clearCache() {
    this.cachedArticles = null
  }
}
