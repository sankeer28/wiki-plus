import { useState } from 'react'
import './FileUploader.css'

function FileUploader({ onFileLoad, isProcessing }) {
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState('')

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setFileName(file.name)
    setProgress('Reading file...')

    try {
      const text = await file.text()
      setProgress('Parsing Wikipedia XML...')
      await onFileLoad(text, (msg) => setProgress(msg))
      setProgress('Complete!')

      setTimeout(() => {
        setProgress('')
      }, 3000)
    } catch (error) {
      console.error('Error loading file:', error)
      setProgress('Error loading file')
    }
  }

  return (
    <div className="file-uploader">
      <div className="upload-section">
        <label htmlFor="file-input" className="upload-button">
          Load Wikipedia XML
          <input
            id="file-input"
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            disabled={isProcessing}
            style={{ display: 'none' }}
          />
        </label>
        {fileName && (
          <span className="file-name">{fileName}</span>
        )}
      </div>
      {progress && (
        <div className="progress-message">
          {progress}
        </div>
      )}
    </div>
  )
}

export default FileUploader
