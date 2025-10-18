import { useState, useEffect, useRef } from 'react'
import './ArticleViewer.css'
import ImageLightbox from './ImageLightbox'

const allTopics = [
  { title: 'Quantum Computing', icon: '⚛️', color: '#3b82f6' },
  { title: 'Ancient Egypt', icon: '🏛️', color: '#f59e0b' },
  { title: 'Machine Learning', icon: '🤖', color: '#8b5cf6' },
  { title: 'Space Exploration', icon: '🚀', color: '#06b6d4' },
  { title: 'Renaissance Art', icon: '🎨', color: '#ec4899' },
  { title: 'Climate Change', icon: '🌍', color: '#10b981' },
  { title: 'Cryptocurrency', icon: '💰', color: '#f97316' },
  { title: 'Black Holes', icon: '🌌', color: '#6366f1' },
  { title: 'DNA Structure', icon: '🧬', color: '#14b8a6' },
  { title: 'Philosophy', icon: '💭', color: '#a855f7' },
  { title: 'World War II', icon: '⚔️', color: '#ef4444' },
  { title: 'Shakespeare', icon: '📜', color: '#8b5cf6' },
  { title: 'Artificial Intelligence', icon: '🧠', color: '#3b82f6' },
  { title: 'The Universe', icon: '✨', color: '#6366f1' },
  { title: 'Evolution', icon: '🦎', color: '#22c55e' },
  { title: 'Roman Empire', icon: '🏛️', color: '#dc2626' },
  { title: 'Photosynthesis', icon: '🌱', color: '#16a34a' },
  { title: 'String Theory', icon: '🎻', color: '#8b5cf6' },
  { title: 'Ocean Depths', icon: '🌊', color: '#0891b2' },
  { title: 'Human Brain', icon: '🧠', color: '#ec4899' },
  { title: 'Solar System', icon: '☀️', color: '#f59e0b' },
  { title: 'Medieval Times', icon: '🏰', color: '#78716c' },
  { title: 'Dinosaurs', icon: '🦖', color: '#84cc16' },
  { title: 'Great Pyramids', icon: '📐', color: '#d97706' },
  { title: 'Greek Mythology', icon: '⚡', color: '#eab308' },
  { title: 'Relativity Theory', icon: '⏱️', color: '#6366f1' },
  { title: 'Neuroscience', icon: '🔬', color: '#db2777' },
  { title: 'Mars Exploration', icon: '🔴', color: '#dc2626' },
  { title: 'Genetics', icon: '🧬', color: '#059669' },
  { title: 'Vikings', icon: '⚔️', color: '#0369a1' },
  { title: 'Plate Tectonics', icon: '🌋', color: '#b91c1c' },
  { title: 'Impressionism', icon: '🖼️', color: '#818cf8' },
  { title: 'Jazz Music', icon: '🎺', color: '#c026d3' },
  { title: 'Amazon Rainforest', icon: '🌴', color: '#15803d' },
  { title: 'Particle Physics', icon: '⚛️', color: '#7c3aed' },
  { title: 'Classical Music', icon: '🎼', color: '#4f46e5' },
  { title: 'French Revolution', icon: '🗽', color: '#2563eb' },
  { title: 'Coral Reefs', icon: '🪸', color: '#0891b2' },
  { title: 'Astronomy', icon: '🔭', color: '#1e40af' },
  { title: 'Industrial Revolution', icon: '⚙️', color: '#475569' },
  { title: 'Nuclear Physics', icon: '☢️', color: '#fbbf24' },
  { title: 'Renaissance Literature', icon: '📖', color: '#7c2d12' },
  { title: 'Quantum Mechanics', icon: '⚡', color: '#6366f1' },
  { title: 'Ancient Greece', icon: '🏺', color: '#0284c7' },
  { title: 'Climate Science', icon: '🌡️', color: '#059669' },
  { title: 'Beethoven', icon: '🎹', color: '#581c87' },
  { title: 'Archaeology', icon: '⛏️', color: '#92400e' },
  { title: 'Volcanology', icon: '🌋', color: '#dc2626' },
  { title: 'Deep Sea', icon: '🐋', color: '#0c4a6e' },
  { title: 'Microbiology', icon: '🦠', color: '#15803d' }
]

function ArticleViewer({ article, onWikiLinkClick, onTopicClick }) {
  const [lightboxImage, setLightboxImage] = useState(null)
  const viewerRef = useRef(null)
  const [visibleTopics, setVisibleTopics] = useState([])
  const [fadingOutIndices, setFadingOutIndices] = useState(new Set())
  const [topicCount, setTopicCount] = useState(15)
  const usedTopicsRef = useRef(new Set())

  // Scroll to top when article changes
  useEffect(() => {
    if (article && viewerRef.current) {
      viewerRef.current.scrollTop = 0
    }
  }, [article])

  // Calculate how many topics to show based on screen size
  useEffect(() => {
    const calculateTopicCount = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Estimate based on typical topic bubble size (~150px width, ~50px height with gaps)
      const bubblesPerRow = Math.floor(width / 170)
      const maxRows = Math.floor((height * 0.4) / 60) // Use 40% of height for topics
      const count = Math.min(Math.max(bubblesPerRow * maxRows, 10), 30) // Min 10, max 30

      setTopicCount(count)
    }

    calculateTopicCount()
    window.addEventListener('resize', calculateTopicCount)
    return () => window.removeEventListener('resize', calculateTopicCount)
  }, [])

  // Initialize visible topics on mount
  useEffect(() => {
    if (topicCount === 0) return

    // Shuffle and select initial topics
    const shuffled = [...allTopics].sort(() => Math.random() - 0.5)
    const initial = shuffled.slice(0, topicCount)
    setVisibleTopics(initial)
    // Track which topics are currently visible
    initial.forEach(topic => usedTopicsRef.current.add(topic.title))
  }, [topicCount])

  // Randomly replace one topic every 3-5 seconds
  useEffect(() => {
    if (article) return // Don't run if article is showing

    const getRandomInterval = () => {
      // Random interval between 3-5 seconds
      return 3000 + Math.random() * 2000
    }

    const scheduleNextReplacement = () => {
      const interval = getRandomInterval()

      return setTimeout(() => {
        setVisibleTopics(prev => {
          if (prev.length === 0) return prev

          // Pick a random index to replace
          const randomIndex = Math.floor(Math.random() * prev.length)

          // Mark it as fading out
          setFadingOutIndices(curr => new Set(curr).add(randomIndex))

          // Find a new topic that hasn't been shown recently
          const availableTopics = allTopics.filter(
            topic => !usedTopicsRef.current.has(topic.title)
          )

          // If all topics have been used, reset and allow reuse
          if (availableTopics.length === 0) {
            usedTopicsRef.current.clear()
            prev.forEach(topic => usedTopicsRef.current.add(topic.title))
          }

          const topicsToChooseFrom = availableTopics.length > 0 ? availableTopics : allTopics
          const newTopic = topicsToChooseFrom[Math.floor(Math.random() * topicsToChooseFrom.length)]

          // After fade out animation completes (600ms), replace the topic
          setTimeout(() => {
            setVisibleTopics(current => {
              const updated = [...current]
              // Remove old topic from used set
              usedTopicsRef.current.delete(updated[randomIndex].title)
              // Add new topic
              updated[randomIndex] = newTopic
              usedTopicsRef.current.add(newTopic.title)
              return updated
            })

            // Clear the fading out state
            setFadingOutIndices(curr => {
              const next = new Set(curr)
              next.delete(randomIndex)
              return next
            })
          }, 600)

          return prev
        })

        // Schedule the next replacement
        scheduleNextReplacement()
      }, interval)
    }

    const timeoutId = scheduleNextReplacement()

    return () => clearTimeout(timeoutId)
  }, [article])

  const handleTopicClick = (topic) => {
    // Call the parent's onTopicClick handler with the topic title
    if (onTopicClick) {
      onTopicClick(topic.title)
    }
  }

  if (!article) {
    return (
      <div className="article-viewer empty">
        <div className="welcome-screen">
          <div className="welcome-header">
            <h1 className="welcome-title">Wiki Plus</h1>
            <p className="welcome-subtitle">Search across 9 sources with AI-powered semantic search</p>
          </div>

          <div className="floating-topics">
            {visibleTopics.map((topic, index) => (
              <div
                key={`${topic.title}-${index}`}
                className={`topic-bubble ${fadingOutIndices.has(index) ? 'fade-out' : ''}`}
                style={{
                  '--delay': `${index * 0.1}s`,
                  '--duration': `${15 + (index % 5) * 2}s`,
                  '--color': topic.color,
                  '--index': index
                }}
                onClick={() => handleTopicClick(topic)}
              >
                <span className="topic-icon">{topic.icon}</span>
                <span className="topic-title">{topic.title}</span>
              </div>
            ))}
          </div>

          <p className="welcome-hint">Click any topic above or search for anything</p>
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
      <div className="article-viewer" ref={viewerRef} onClick={handleLinkClick}>
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
