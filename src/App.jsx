import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import ArticleList from './components/ArticleList'
import ArticleViewer from './components/ArticleViewer'
import History from './components/History'
import ThemeSelector from './components/ThemeSelector'
import { SemanticSearchService } from './services/semanticSearch'
import { IndexSearchService } from './services/indexSearch'
import { HistoryService } from './services/historyService'
import { ThemeService } from './services/themeService'

function App() {
  const [articles, setArticles] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing...')
  const [searchService, setSearchService] = useState(null)
  const [indexService, setIndexService] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)
  const [historyService] = useState(() => new HistoryService())
  const [themeService] = useState(() => new ThemeService())
  const [currentTheme, setCurrentTheme] = useState('dark')

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = themeService.getCurrentTheme()
    setCurrentTheme(savedTheme)
    themeService.setTheme(savedTheme)
  }, [themeService])

  const handleThemeChange = (themeId) => {
    themeService.setTheme(themeId)
    setCurrentTheme(themeId)
  }

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

        // Check if URL has an article parameter
        const urlParams = new URLSearchParams(window.location.search)
        const articleTitle = urlParams.get('article')
        if (articleTitle && idxService) {
          // Load the article from URL
          const fullArticle = await idxService.loadArticleContent(decodeURIComponent(articleTitle))
          setSelectedArticle(fullArticle)
        }
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
        const indexResults = (await indexService.searchIndex(query)).slice(0, 10)

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
        // Simple index-based search (now uses Wikipedia search API for full access)
        if (indexService) {
          const results = await indexService.searchIndex(query)
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

  const updateURL = (title) => {
    // Update URL with article title
    const url = new URL(window.location)
    url.searchParams.set('article', encodeURIComponent(title))
    window.history.pushState({}, '', url)
  }

  const handleArticleSelect = async (article) => {
    if (article.isPreview && indexService) {
      // Load full article content
      setIsLoading(true)
      const fullArticle = await indexService.loadArticleContent(article.title)
      setSelectedArticle(fullArticle)
      updateURL(article.title)
      historyService.addToHistory({ title: article.title, url: fullArticle.url })
      setIsLoading(false)
    } else {
      setSelectedArticle(article)
      updateURL(article.title)
      historyService.addToHistory({ title: article.title, url: article.url })
    }
  }

  const handleWikiLinkClick = async (title) => {
    // Load the linked article
    if (indexService) {
      setIsLoading(true)
      const fullArticle = await indexService.loadArticleContent(title)
      setSelectedArticle(fullArticle)
      updateURL(title)
      historyService.addToHistory({ title: title, url: fullArticle.url })
      setIsLoading(false)
    }
  }

  const handleHistoryArticleSelect = async (title) => {
    if (indexService) {
      setIsLoading(true)
      const fullArticle = await indexService.loadArticleContent(title)
      setSelectedArticle(fullArticle)
      updateURL(title)
      setIsLoading(false)
    }
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const articleTitle = urlParams.get('article')

      if (articleTitle && indexService) {
        setIsLoading(true)
        const fullArticle = await indexService.loadArticleContent(decodeURIComponent(articleTitle))
        setSelectedArticle(fullArticle)
        setIsLoading(false)
      } else {
        setSelectedArticle(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [indexService])

  if (isInitializing) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <img src="/logo.svg" alt="Wiki-Plus Logo" className="loading-logo" />
          <h1>Wiki-Plus</h1>
          <p>{loadingStatus}</p>
          <div className="loader"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title">
          <img src="/logo.svg" alt="Wiki-Plus Logo" className="app-logo" />
          <div className="header-text">
            <h1>Wiki-Plus</h1>
            <p className="subtitle">AI-Powered Knowledge Discovery</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="theme-btn"
            onClick={() => setIsThemeSelectorOpen(true)}
            aria-label="Change theme"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Theme
          </button>
          <button
            className="history-btn"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="View history"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </button>
        </div>
      </header>

      <div className="controls-container">
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>

      <div className="content-container">
        <div className={`articles-section ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <ArticleList
            articles={searchResults.length > 0 ? searchResults : articles}
            onArticleSelect={handleArticleSelect}
            isSearchResult={searchResults.length > 0}
          />
        </div>

        <div className="viewer-section">
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isSidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
          <ArticleViewer article={selectedArticle} onWikiLinkClick={handleWikiLinkClick} />
        </div>
      </div>

      <History
        historyService={historyService}
        onArticleSelect={handleHistoryArticleSelect}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <ThemeSelector
        themeService={themeService}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </div>
  )
}

export default App
