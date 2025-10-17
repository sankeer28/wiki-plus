import { useState } from 'react'
import './ThemeSelector.css'

function ThemeSelector({ themeService, currentTheme, onThemeChange, isOpen, onClose }) {
  const themes = themeService.getAvailableThemes()

  const handleThemeSelect = (themeId) => {
    onThemeChange(themeId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="theme-overlay" onClick={onClose}>
      <div className="theme-panel" onClick={(e) => e.stopPropagation()}>
        <div className="theme-header">
          <h2>Choose Theme</h2>
          <button className="close-theme-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <div className={`theme-preview ${theme.id}`}>
                <div className="theme-preview-header"></div>
                <div className="theme-preview-content">
                  <div className="theme-preview-line"></div>
                  <div className="theme-preview-line short"></div>
                  <div className="theme-preview-line"></div>
                </div>
              </div>
              <div className="theme-name">{theme.name}</div>
              {currentTheme === theme.id && (
                <div className="theme-checkmark">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector
