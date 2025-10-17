import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import ArticleList from './components/ArticleList'
import ArticleViewer from './components/ArticleViewer'
import { SemanticSearchService } from './services/semanticSearch'
import { IndexSearchService } from './services/indexSearch'

function App() {
  const [articles, setArticles] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing...')
  const [searchService, setSearchService] = useState(null)
  const [indexService, setIndexService] = useState(null)

  useEffect(() => {
    // Initialize app with index-based loading
    const initializeApp = async () => {
      setIsInitializing(true)

      try {
        setLoadingStatus('Loading Wikipedia index...')

        // Initialize index search service
        const idxService = new IndexSearchService()
        await idxService.loadIndex()
        setIndexService(idxService)

        // Get initial articles to display (first 100 from index)
        const initialArticles = idxService.getSampleArticles()
        setArticles(initialArticles)

        setLoadingStatus('Initializing AI models...')
        // Initialize semantic search service (for AI search)
        const service = new SemanticSearchService()
        await service.initialize()
        setSearchService(service)

        setLoadingStatus('Ready!')
        console.log('Initialization complete!')
      } catch (error) {
        console.error('Initialization error:', error)
        setLoadingStatus(`Error: ${error.message}`)
      } finally {
        setTimeout(() => setIsInitializing(false), 500)
      }
    }

    initializeApp()
  }, [])

  const handleSearch = async (query, useSemanticSearch = false) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      if (useSemanticSearch && searchService && indexService) {
        // AI semantic search - load first 10 results and generate embeddings
        const indexResults = indexService.searchIndex(query).slice(0, 10)

        setLoadingStatus('Loading articles for AI search...')

        // Load full content for top results
        const articlesWithContent = []
        for (const result of indexResults) {
          const fullArticle = await indexService.loadArticleContent(result.title)
          articlesWithContent.push(fullArticle)
        }

        setLoadingStatus('Generating embeddings...')

        // Index these articles for semantic search
        await searchService.indexArticles(articlesWithContent)

        // Perform semantic search
        const semanticResults = await searchService.semanticSearch(query, 10)
        setSearchResults(semanticResults)
      } else {
        // Simple index-based search
        if (indexService) {
          const results = indexService.searchIndex(query)
          const articlesFromResults = results.map(r => ({
            id: r.id,
            title: r.title,
            content: 'Click to view article details...',
            timestamp: new Date().toISOString(),
            isPreview: true
          }))
          setSearchResults(articlesFromResults)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArticleSelect = async (article) => {
    if (article.isPreview && indexService) {
      // Load full article content
      setIsLoading(true)
      const fullArticle = await indexService.loadArticleContent(article.title)
      setSelectedArticle(fullArticle)
      setIsLoading(false)
    } else {
      setSelectedArticle(article)
    }
  }

  if (isInitializing) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <h1>MiniWiki</h1>
          <p>{loadingStatus}</p>
          <div className="loader"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>MiniWiki</h1>
        <p className="subtitle">AI-Powered Knowledge Discovery</p>
      </header>

      <div className="controls-container">
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>

      <div className="content-container">
        <div className="articles-section">
          <ArticleList
            articles={searchResults.length > 0 ? searchResults : articles}
            onArticleSelect={handleArticleSelect}
            isSearchResult={searchResults.length > 0}
          />
        </div>

        <div className="viewer-section">
          <ArticleViewer article={selectedArticle} />
        </div>
      </div>
    </div>
  )
}

export default App
