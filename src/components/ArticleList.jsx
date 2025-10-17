import './ArticleList.css'

function ArticleList({ articles, onArticleSelect, isSearchResult }) {
  return (
    <div className="article-list">
      <div className="article-list-header">
        <h2>
          {isSearchResult ? 'Search Results' : 'Articles'}
        </h2>
        <span className="article-count">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      <div className="articles-container">
        {articles.length === 0 ? (
          <div className="no-articles">
            <p>No articles found</p>
            {isSearchResult && (
              <p className="suggestion">Try a different search term or disable AI search</p>
            )}
          </div>
        ) : (
          articles.map((article, index) => (
            <div
              key={article.id || index}
              className="article-item"
              onClick={() => onArticleSelect(article)}
            >
              <h3 className="article-title">{article.title}</h3>
              <p className="article-preview">
                {article.content?.substring(0, 150)}...
              </p>
              {article.score && (
                <div className="relevance-score">
                  Relevance: {(article.score * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ArticleList
