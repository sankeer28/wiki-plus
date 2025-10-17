import { pipeline } from '@huggingface/transformers'

export class SemanticSearchService {
  constructor() {
    this.embedder = null
    this.articles = []
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return

    console.log('Initializing Semantic Search Service...')

    try {
      // Initialize Transformers.js embeddings pipeline
      console.log('Loading embedding model...')
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      )

      this.isInitialized = true
      console.log('Semantic Search Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Semantic Search Service:', error)
      throw error
    }
  }

  async generateEmbedding(text) {
    if (!this.embedder) {
      throw new Error('Embedder not initialized')
    }

    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true
    })

    return Array.from(output.data)
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magA * magB)
  }

  async indexArticle(article) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Generate embedding for the article content
      const embedding = await this.generateEmbedding(
        `${article.title} ${article.content.substring(0, 500)}`
      )

      // Store article with embedding in memory
      this.articles.push({
        ...article,
        embedding: embedding
      })

      return true
    } catch (error) {
      console.error('Error indexing article:', error)
      return false
    }
  }

  async indexArticles(articles) {
    console.log(`Indexing ${articles.length} articles...`)
    let indexed = 0

    // Clear existing articles
    this.articles = []

    for (const article of articles) {
      const success = await this.indexArticle(article)
      if (success) indexed++

      // Log progress every 10 articles
      if (indexed % 10 === 0 && indexed > 0) {
        console.log(`Indexed ${indexed}/${articles.length} articles`)
      }
    }

    console.log(`Indexing complete: ${indexed} articles indexed`)
    return indexed
  }

  async semanticSearch(query, limit = 10) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)

      if (this.articles.length === 0) {
        console.warn('No articles found in database')
        return []
      }

      // Calculate similarity scores
      const scoredArticles = this.articles.map(article => {
        const score = this.cosineSimilarity(queryEmbedding, article.embedding)

        return {
          id: article.id,
          title: article.title,
          content: article.content,
          timestamp: article.timestamp,
          score: score
        }
      })

      // Sort by score and return top results
      return scoredArticles
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('Semantic search error:', error)
      return []
    }
  }

  getArticleCount() {
    return this.articles.length
  }

  clearDatabase() {
    this.articles = []
    console.log('Database cleared')
  }

  getAllArticles() {
    return this.articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      timestamp: article.timestamp
    }))
  }
}
