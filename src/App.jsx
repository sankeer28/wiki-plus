import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import ArticleList from './components/ArticleList'
import ArticleViewer from './components/ArticleViewer'
import History from './components/History'
import ThemeSelector from './components/ThemeSelector'
import SourceSelector from './components/SourceSelector'
import { SemanticSearchService } from './services/semanticSearch'
import { IndexSearchService } from './services/indexSearch'
import { MultiSourceSearchService } from './services/multiSourceSearch'
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
  const [multiSourceService] = useState(() => new MultiSourceSearchService())
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)
  const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false)
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

  const handleLogoClick = () => {
    // Clear search results and selected article to return to home
    setSearchResults([])
    setSelectedArticle(null)
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname)
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
      // Search multiple sources (Wikipedia + Wikidata)
      setLoadingStatus('Searching multiple sources...')
      const multiSourceResults = await multiSourceService.searchAllSources(query)

      if (useSemanticSearch && searchService && multiSourceResults.length > 0) {
        // AI semantic search - enhance multi-source results with semantic ranking
        setLoadingStatus('Analyzing semantic relevance...')

        // Create lightweight articles from search results
        const lightweightArticles = multiSourceResults.map(result => ({
          id: result.id,
          title: result.title,
          content: result.description || result.title,
          timestamp: new Date().toISOString(),
          source: result.source
        }))

        // Index these lightweight articles for semantic search
        await searchService.indexArticles(lightweightArticles)

        // Perform semantic search to get relevance scores
        const semanticResults = await searchService.semanticSearch(query, 50)

        // Convert to preview format with relevance scores and source tags
        const rankedResults = semanticResults.map(article => {
          const originalResult = multiSourceResults.find(r => r.id === article.id)
          return {
            id: article.id,
            title: article.title,
            content: article.content || 'Click to view full article',
            timestamp: new Date().toISOString(),
            isPreview: true,
            score: article.score,
            source: originalResult?.source || 'Wikipedia',
            sourceKey: originalResult?.sourceKey || 'wikipedia',
            sourceColor: originalResult?.sourceColor || '#000000'
          }
        })

        setSearchResults(rankedResults)
      } else {
        // Simple multi-source search (keyword matching only)
        const articlesFromResults = multiSourceResults.map(r => ({
          id: r.id,
          title: r.title,
          content: r.description || 'Click to view article details...',
          timestamp: new Date().toISOString(),
          isPreview: true,
          source: r.source,
          sourceKey: r.sourceKey,
          sourceColor: r.sourceColor
        }))
        setSearchResults(articlesFromResults)
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
    if (article.isPreview) {
      // Load full article content from appropriate source
      setIsLoading(true)
      const fullArticle = await multiSourceService.loadArticleContent(
        article.title,
        article.source || 'Wikipedia',
        article.sourceKey
      )

      if (fullArticle) {
        setSelectedArticle(fullArticle)
        updateURL(article.title)
        historyService.addToHistory({ title: article.title, url: fullArticle.url })
      } else {
        // Article failed to load - show error
        setSelectedArticle({
          title: article.title,
          content: `Unable to load article "${article.title}" from ${article.source}. This article may not be available or may have a different format.`,
          timestamp: new Date().toISOString(),
          source: article.source
        })
      }
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
        <div className="header-title" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src="/logo.svg" alt="Wiki-Plus Logo" className="app-logo" />
          <div className="header-text">
            <h1>Wiki-Plus</h1>
            <p className="subtitle">Knowledge Discovery</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="sources-btn"
            onClick={() => setIsSourceSelectorOpen(true)}
            aria-label="Select sources"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Sources
          </button>
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
          <ArticleViewer
            article={selectedArticle}
            onWikiLinkClick={handleWikiLinkClick}
            onTopicClick={(topic) => handleSearch(topic, true)}
          />
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

      <SourceSelector
        multiSourceService={multiSourceService}
        isOpen={isSourceSelectorOpen}
        onClose={() => setIsSourceSelectorOpen(false)}
        onSourcesChange={() => {
          // Optionally trigger a re-search when sources change
          console.log('Sources updated')
        }}
      />
    </div>
  )
}

export default App
