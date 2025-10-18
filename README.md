# Wiki-Plus: Custom Wikipedia 
React-based Wikipedia browser with AI-powered semantic search  using Transformers.js and PGlite.

## Features
- **AI-Powered Semantic Search**: Uses Transformers.js to run local AI embeddings for intelligent article search
- **PGlite Database**: Lightweight PostgreSQL-compatible database running entirely in the browser
- **Real-time Search**: Toggle between keyword search and AI semantic search
- **Modern UI**: Clean, responsive interface with gradient design
- **Vector Embeddings**: Articles are automatically indexed with vector embeddings for semantic similarity
- **No Backend Required**: Everything runs in your browser


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
