export class WikiParser {
  constructor() {
    this.articles = []
  }

  async parseWikiXML(xmlContent, maxArticles = 500, progressCallback = null) {
    console.log('Parsing Wikipedia XML...')
    const articles = []

    try {
      // Simple regex-based parser for Wikipedia XML
      const pageRegex = /<page>([\s\S]*?)<\/page>/g
      const titleRegex = /<title>(.*?)<\/title>/
      const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/
      const timestampRegex = /<timestamp>(.*?)<\/timestamp>/

      let match
      let count = 0
      let processed = 0

      while ((match = pageRegex.exec(xmlContent)) !== null && count < maxArticles) {
        const pageContent = match[1]
        processed++

        const titleMatch = titleRegex.exec(pageContent)
        const textMatch = textRegex.exec(pageContent)
        const timestampMatch = timestampRegex.exec(pageContent)

        if (titleMatch && textMatch) {
          const title = this.decodeHTML(titleMatch[1])
          const rawText = this.decodeHTML(textMatch[1])
          const cleanText = this.cleanWikiText(rawText)

          if (cleanText.length > 100) { // Only include articles with substantial content
            articles.push({
              id: count + 1,
              title: title,
              content: cleanText,
              timestamp: timestampMatch ? timestampMatch[1] : null
            })
            count++
          }
        }

        // Log progress
        if (count % 50 === 0 && count > 0) {
          const message = `Parsed ${count} articles (processed ${processed} pages)...`
          console.log(message)
          if (progressCallback) progressCallback(message)
        }
      }

      const finalMessage = `Parsing complete: ${articles.length} articles extracted from ${processed} pages`
      console.log(finalMessage)
      if (progressCallback) progressCallback(finalMessage)

      this.articles = articles
      return articles
    } catch (error) {
      console.error('Error parsing Wikipedia XML:', error)
      if (progressCallback) progressCallback(`Error: ${error.message}`)
      return []
    }
  }

  cleanWikiText(text) {
    // Remove Wikipedia markup
    let cleaned = text
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove templates
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      // Remove references
      .replace(/<ref[\s\S]*?<\/ref>/g, '')
      .replace(/<ref[^>]*\/>/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove links but keep text
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
      // Remove external links
      .replace(/\[http[^\]]+\]/g, '')
      // Remove formatting
      .replace(/'{2,}/g, '')
      // Remove section headers
      .replace(/={2,}(.*?)={2,}/g, '$1')
      // Remove multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
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

  async loadSampleArticles() {
    // Sample articles for testing without the full XML file
    return [
      {
        id: 1,
        title: 'Artificial Intelligence',
        content: 'Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of intelligent agents: any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Machine Learning',
        content: 'Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.',
        timestamp: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Neural Networks',
        content: 'Artificial neural networks are computing systems inspired by the biological neural networks that constitute animal brains. An ANN is based on a collection of connected units or nodes called artificial neurons, which loosely model the neurons in a biological brain.',
        timestamp: new Date().toISOString()
      },
      {
        id: 4,
        title: 'Natural Language Processing',
        content: 'Natural language processing is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data.',
        timestamp: new Date().toISOString()
      },
      {
        id: 5,
        title: 'Computer Vision',
        content: 'Computer vision is an interdisciplinary scientific field that deals with how computers can gain high-level understanding from digital images or videos. From the perspective of engineering, it seeks to understand and automate tasks that the human visual system can do.',
        timestamp: new Date().toISOString()
      }
    ]
  }
}
