import { useState } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('')
  const [useAISearch, setUseAISearch] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query, useAISearch)
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
  }

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search articles..."
            value={query}
            onChange={handleQueryChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="search-options">
          <label className="ai-search-toggle">
            <input
              type="checkbox"
              checked={useAISearch}
              onChange={(e) => setUseAISearch(e.target.checked)}
            />
            <span className="toggle-label">
              Use AI Semantic Search
            </span>
          </label>
          {useAISearch && (
            <span className="ai-badge">AI Powered</span>
          )}
        </div>
      </form>
    </div>
  )
}

export default SearchBar
