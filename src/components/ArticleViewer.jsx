import './ArticleViewer.css'

function ArticleViewer({ article }) {
  if (!article) {
    return (
      <div className="article-viewer empty">
        <div className="empty-state">
          <h2>Welcome to Custom Wikipedia</h2>
          <p>Select an article from the list to view its content</p>
          <p>Use the search bar above to find articles with AI-powered semantic search</p>
        </div>
      </div>
    )
  }

  return (
    <div className="article-viewer">
      <article className="article-content">
        <header className="article-header">
          <h1 className="article-title">{article.title}</h1>
          {article.timestamp && (
            <div className="article-meta">
              <span>Last updated: {new Date(article.timestamp).toLocaleDateString()}</span>
            </div>
          )}
        </header>

        <div className="article-body">
          {article.content?.split('\n').map((paragraph, index) => (
            paragraph.trim() && <p key={index}>{paragraph}</p>
          ))}
        </div>

        {article.categories && article.categories.length > 0 && (
          <footer className="article-footer">
            <div className="categories">
              <strong>Categories:</strong>
              {article.categories.map((category, index) => (
                <span key={index} className="category-tag">
                  {category}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  )
}

export default ArticleViewer
