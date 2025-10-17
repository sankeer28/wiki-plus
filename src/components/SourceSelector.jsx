import { useState, useEffect } from 'react'
import './SourceSelector.css'

function SourceSelector({ multiSourceService, isOpen, onClose, onSourcesChange }) {
  const [sources, setSources] = useState([])
  const [selectedSources, setSelectedSources] = useState([])

  useEffect(() => {
    if (multiSourceService && isOpen) {
      const allSources = multiSourceService.getAllSources()
      setSources(allSources)
      setSelectedSources(allSources.filter(s => s.enabled).map(s => s.key))
    }
  }, [multiSourceService, isOpen])

  const handleToggle = (sourceKey) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceKey)) {
        return prev.filter(k => k !== sourceKey)
      } else {
        return [...prev, sourceKey]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedSources(sources.map(s => s.key))
  }

  const handleDeselectAll = () => {
    setSelectedSources([])
  }

  const handleApply = () => {
    multiSourceService.setEnabledSources(selectedSources)
    onSourcesChange(selectedSources)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="source-overlay" onClick={onClose}>
      <div className="source-panel" onClick={(e) => e.stopPropagation()}>
        <div className="source-header">
          <h2>Select Sources</h2>
          <button className="close-source-btn" onClick={onClose}>✕</button>
        </div>

        <div className="source-actions">
          <button className="action-btn" onClick={handleSelectAll}>
            Select All
          </button>
          <button className="action-btn" onClick={handleDeselectAll}>
            Deselect All
          </button>
          <span className="selected-count">
            {selectedSources.length} of {sources.length} selected
          </span>
        </div>

        <div className="source-list">
          {sources.map(source => (
            <label key={source.key} className="source-item">
              <input
                type="checkbox"
                checked={selectedSources.includes(source.key)}
                onChange={() => handleToggle(source.key)}
              />
              <div className="source-info">
                <span className="source-name">{source.name}</span>
                <span
                  className="source-indicator"
                  style={{ backgroundColor: source.color }}
                ></span>
              </div>
            </label>
          ))}
        </div>

        <div className="source-footer">
          <button className="apply-btn" onClick={handleApply}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default SourceSelector
