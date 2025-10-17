# Custom Wikipedia with AI-Powered Semantic Search

A modern, React-based Wikipedia browser with AI-powered semantic search capabilities using Transformers.js and PGlite.

## Features

- **AI-Powered Semantic Search**: Uses Transformers.js to run local AI embeddings for intelligent article search
- **PGlite Database**: Lightweight PostgreSQL-compatible database running entirely in the browser
- **Real-time Search**: Toggle between keyword search and AI semantic search
- **Modern UI**: Clean, responsive interface with gradient design
- **Vector Embeddings**: Articles are automatically indexed with vector embeddings for semantic similarity
- **No Backend Required**: Everything runs in your browser

## Technologies Used

- **React + Vite**: Fast development and optimized production builds
- **Transformers.js**: Run Hugging Face models directly in the browser
- **PGlite**: In-browser PostgreSQL database
- **XML2JS**: Parse Wikipedia XML dumps
- **CSS3**: Modern styling with gradients and animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd wiki-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How It Works

### Semantic Search

1. **Initialization**: When the app loads, it:
   - Initializes the Transformers.js embedding model (Xenova/all-MiniLM-L6-v2)
   - Creates a PGlite database
   - Loads sample articles
   - Generates embeddings for each article
   - Stores articles with their embeddings in the database

2. **Search Process**:
   - **Keyword Search**: Simple text matching in titles and content
   - **AI Semantic Search**:
     - Generates an embedding for your query
     - Compares it with all article embeddings using cosine similarity
     - Returns the most semantically similar articles
     - Shows relevance scores

### Architecture

```
wiki-app/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx          # Search input with AI toggle
│   │   ├── ArticleList.jsx        # List of articles/results
│   │   └── ArticleViewer.jsx      # Article content display
│   ├── services/
│   │   ├── semanticSearch.js      # Transformers.js + PGlite integration
│   │   └── wikiParser.js          # Wikipedia XML parser
│   ├── App.jsx                    # Main application
│   └── App.css                    # Global styles
```

## Using Real Wikipedia Data

Currently, the app uses sample articles. To load real Wikipedia data:

1. The `simplewiki-20240901-pages-articles-multistream.xml` file is available in the parent directory

2. Update `App.jsx` to use the parser:
```javascript
const parser = new WikiParser()
// Load from file
const xmlContent = await fetch('../simplewiki-20240901-pages-articles-multistream.xml')
  .then(res => res.text())
const articles = await parser.parseWikiXML(xmlContent)
```

Note: The full Wikipedia XML is very large (1.4GB). Consider:
- Using a smaller subset
- Implementing pagination
- Adjusting the `maxArticles` limit in `wikiParser.js`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Change the Embedding Model

Edit `semanticSearch.js`:
```javascript
this.embedder = await pipeline(
  'feature-extraction',
  'Xenova/your-model-name'  // Change model here
)
```

### Adjust Search Results

Change the limit in `App.jsx`:
```javascript
const results = await searchService.semanticSearch(query, 20) // Change limit
```

### Styling

All component styles are in separate CSS files:
- `App.css` - Main layout
- `SearchBar.css` - Search interface
- `ArticleList.css` - Article list
- `ArticleViewer.css` - Article display

## Performance Notes

- First load may take 10-30 seconds to download and initialize the AI model
- The model is cached in the browser for subsequent visits
- Semantic search is fast once initialized (typically <100ms per query)
- Indexing articles with embeddings takes ~1 second per 10 articles

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires WebAssembly and modern JavaScript support.

## Future Enhancements

- [ ] File upload for custom Wikipedia dumps
- [ ] Article categories and filtering
- [ ] Export search results
- [ ] Bookmark favorite articles
- [ ] Dark mode
- [ ] Full-text highlighting
- [ ] Article history
- [ ] Multi-language support

## License

MIT

## Acknowledgments

- Wikipedia for the data
- Hugging Face for Transformers.js
- Electric SQL for PGlite
- The open-source community
