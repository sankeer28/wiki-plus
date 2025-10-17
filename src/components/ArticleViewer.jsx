import { useState } from 'react'
import './ArticleViewer.css'
import ImageLightbox from './ImageLightbox'

function ArticleViewer({ article, onWikiLinkClick }) {
  const [lightboxImage, setLightboxImage] = useState(null)
  if (!article) {
    return (
      <div className="article-viewer empty">
        <div className="empty-state">
          <h2>Welcome to Wiki Plus</h2>
          <p>Select an article from the list to view its content</p>
          <p>Use the search bar above to find articles with AI-powered semantic search</p>
        </div>
      </div>
    )
  }

  const handleImageClick = (imageData) => {
    setLightboxImage(imageData)
  }

  const handleLinkClick = (e) => {
    const target = e.target.closest('a')
    if (target && target.classList.contains('wiki-link')) {
      e.preventDefault()
      const wikiTitle = target.getAttribute('data-wiki-link')
      if (wikiTitle && onWikiLinkClick) {
        onWikiLinkClick(wikiTitle)
      }
    }
  }

  const renderContent = () => {
    // Handle legacy plain text content
    if (typeof article.content === 'string') {
      return article.content.split('\n').map((line, index) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return null

        if (trimmedLine.startsWith('## ')) {
          return <h2 key={index}>{trimmedLine.substring(3)}</h2>
        } else if (trimmedLine.startsWith('### ')) {
          return <h3 key={index}>{trimmedLine.substring(4)}</h3>
        } else if (trimmedLine.startsWith('# ')) {
          return <h2 key={index}>{trimmedLine.substring(2)}</h2>
        } else {
          return <p key={index}>{trimmedLine}</p>
        }
      })
    }

    // Handle new structured content with images and links
    if (article.content?.elements) {
      return article.content.elements.map((element, index) => {
        switch (element.type) {
          case 'heading':
            const HeadingTag = `h${element.level}`
            return (
              <HeadingTag
                key={index}
                dangerouslySetInnerHTML={{ __html: element.html }}
              />
            )

          case 'paragraph':
            return (
              <p
                key={index}
                dangerouslySetInnerHTML={{ __html: element.html }}
              />
            )

          case 'unordered-list':
            return (
              <ul key={index}>
                {element.items.map((item, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                ))}
              </ul>
            )

          case 'ordered-list':
            return (
              <ol key={index}>
                {element.items.map((item, i) => (
                  <li
                    key={i}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                ))}
              </ol>
            )

          case 'image':
            return (
              <figure key={index} className="article-image">
                <img
                  src={element.data.src}
                  alt={element.data.alt}
                  title={element.data.title}
                  loading="lazy"
                  onClick={() => handleImageClick({
                    src: element.data.fullSrc || element.data.src,
                    alt: element.data.alt,
                    caption: element.data.caption
                  })}
                  style={{ cursor: 'pointer' }}
                />
                {element.data.caption && (
                  <figcaption>{element.data.caption}</figcaption>
                )}
              </figure>
            )

          case 'infobox':
            return (
              <aside key={index} className="infobox">
                {element.data.images.length > 0 && (
                  <div className="infobox-images">
                    {element.data.images.map((img, i) => (
                      <img
                        key={i}
                        src={img.src}
                        alt={img.alt}
                        title={img.title}
                        loading="lazy"
                        onClick={() => handleImageClick({
                          src: img.fullSrc || img.src,
                          alt: img.alt,
                          caption: img.caption
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                )}
                {element.data.rows.length > 0 && (
                  <table className="infobox-table">
                    <tbody>
                      {element.data.rows.map((row, i) => (
                        <tr key={i}>
                          <th>{row.label}</th>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </aside>
            )

          default:
            return null
        }
      })
    }

    return <p>No content available for this article.</p>
  }

  return (
    <>
      <div className="article-viewer" onClick={handleLinkClick}>
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
            {renderContent()}
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

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  )
}

export default ArticleViewer
