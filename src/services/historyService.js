export class HistoryService {
  constructor() {
    this.storageKey = 'wiki-plus-history'
    this.maxItems = 50
  }

  getHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading history:', error)
      return []
    }
  }

  addToHistory(item) {
    try {
      let history = this.getHistory()

      // Remove duplicate if exists
      history = history.filter(h => h.title !== item.title)

      // Add to beginning
      history.unshift({
        title: item.title,
        timestamp: new Date().toISOString(),
        url: item.url || ''
      })

      // Keep only max items
      if (history.length > this.maxItems) {
        history = history.slice(0, this.maxItems)
      }

      localStorage.setItem(this.storageKey, JSON.stringify(history))
      return true
    } catch (error) {
      console.error('Error saving to history:', error)
      return false
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey)
      return true
    } catch (error) {
      console.error('Error clearing history:', error)
      return false
    }
  }

  removeItem(title) {
    try {
      let history = this.getHistory()
      history = history.filter(h => h.title !== title)
      localStorage.setItem(this.storageKey, JSON.stringify(history))
      return true
    } catch (error) {
      console.error('Error removing item:', error)
      return false
    }
  }
}
