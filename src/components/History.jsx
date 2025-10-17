import { useState, useEffect } from 'react'
import './History.css'

function History({ historyService, onArticleSelect, isOpen, onClose }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = () => {
    const items = historyService.getHistory()
    setHistory(items)
  }

  const handleClearAll = () => {
    historyService.clearHistory()
    setHistory([])
  }

  const handleRemoveItem = (title, e) => {
    e.stopPropagation()
    historyService.removeItem(title)
    loadHistory()
  }

  const handleItemClick = (item) => {
    onArticleSelect(item.title)
    onClose()
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>History</h2>
          <div className="history-actions">
            {history.length > 0 && (
              <button className="clear-history-btn" onClick={handleClearAll}>
                Clear All
              </button>
            )}
            <button className="close-history-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <p>No history yet</p>
              <p className="history-empty-hint">
                Articles you view will appear here
              </p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="history-item"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="history-item-content">
                    <div className="history-item-title">{item.title}</div>
                    <div className="history-item-time">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                  <button
                    className="history-item-remove"
                    onClick={(e) => handleRemoveItem(item.title, e)}
                    aria-label="Remove from history"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
