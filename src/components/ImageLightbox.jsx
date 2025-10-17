import { useState, useEffect } from 'react'
import './ImageLightbox.css'

function ImageLightbox({ image, onClose }) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    // Reset position when zoom changes
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [zoom])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 4))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1))
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90)
  }

  const handleRotateRight = () => {
    setRotation(prev => prev + 90)
  }

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      } else if (e.key === '0') {
        handleReset()
      } else if (e.key === 'ArrowLeft' || e.key === '[') {
        handleRotateLeft()
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        handleRotateRight()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onClose])

  if (!image) return null

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="lightbox-controls">
          <button onClick={handleRotateLeft} aria-label="Rotate left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"></path>
            </svg>
          </button>

          <button onClick={handleRotateRight} aria-label="Rotate right">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
            </svg>
          </button>

          <div className="control-divider"></div>

          <button onClick={handleZoomOut} disabled={zoom <= 1} aria-label="Zoom out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <span className="zoom-level">{Math.round(zoom * 100)}%</span>

          <button onClick={handleZoomIn} disabled={zoom >= 4} aria-label="Zoom in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <div className="control-divider"></div>

          <button onClick={handleReset} aria-label="Reset zoom and rotation">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>

        <div
          className="lightbox-image-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={image.src}
            alt={image.alt || 'Full size image'}
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
            draggable="false"
          />
        </div>

        {image.caption && (
          <div className="lightbox-caption">
            {image.caption}
          </div>
        )}

        <div className="lightbox-hint">
          Press Esc to close • Scroll or +/- to zoom • Arrow keys to rotate • Click and drag to pan
        </div>
      </div>
    </div>
  )
}

export default ImageLightbox
