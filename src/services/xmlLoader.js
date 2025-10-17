import { parseString } from 'xml2js';

export class XMLLoader {
  constructor() {
    this.chunks = [];
    this.totalChunks = 15; // Number of chunks we created
    this.loadedChunks = new Map();
  }

  // Load a specific chunk file
  async loadChunk(chunkNumber) {
    if (this.loadedChunks.has(chunkNumber)) {
      return this.loadedChunks.get(chunkNumber);
    }

    try {
      const chunkFileName = `simplewiki-chunk-${String(chunkNumber).padStart(3, '0')}.xml`;
      const response = await fetch(`/data/${chunkFileName}`);

      if (!response.ok) {
        throw new Error(`Failed to load chunk ${chunkNumber}`);
      }

      const xmlText = await response.text();
      const parsedData = await this.parseXML(xmlText);

      this.loadedChunks.set(chunkNumber, parsedData);
      return parsedData;
    } catch (error) {
      console.error(`Error loading chunk ${chunkNumber}:`, error);
      return null;
    }
  }

  // Parse XML string to JavaScript object
  parseXML(xmlString) {
    return new Promise((resolve, reject) => {
      parseString(xmlString, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Search for an article by title across all chunks
  async findArticleByTitle(title) {
    const searchTitle = title.toLowerCase().trim();

    // Search through chunks sequentially
    for (let chunkNum = 1; chunkNum <= this.totalChunks; chunkNum++) {
      const chunkData = await this.loadChunk(chunkNum);

      if (!chunkData || !chunkData.mediawiki || !chunkData.mediawiki.page) {
        continue;
      }

      const pages = chunkData.mediawiki.page;

      for (const page of pages) {
        const pageTitle = page.title?.[0]?.toLowerCase().trim();

        if (pageTitle === searchTitle) {
          return this.formatArticle(page);
        }
      }
    }

    return null;
  }

  // Format article data
  formatArticle(page) {
    const title = page.title?.[0] || 'Untitled';
    const revision = page.revision?.[0];
    const text = revision?.text?.[0]?._ || revision?.text?.[0] || '';
    const timestamp = revision?.timestamp?.[0] || new Date().toISOString();

    return {
      title,
      content: this.cleanWikitext(text),
      timestamp,
      rawText: text
    };
  }

  // Clean wikitext markup
  cleanWikitext(text) {
    if (!text) return '';

    // Remove common wikitext markup
    let cleaned = text
      // Remove templates
      .replace(/\{\{[^}]+\}\}/g, '')
      // Remove file/image links
      .replace(/\[\[File:[^\]]+\]\]/gi, '')
      .replace(/\[\[Image:[^\]]+\]\]/gi, '')
      // Convert internal links
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      // Remove external links markup
      .replace(/\[http[^\s]+ ([^\]]+)\]/g, '$1')
      // Remove headers
      .replace(/={2,}([^=]+)={2,}/g, '$1')
      // Remove bold/italic
      .replace(/'{2,}([^']+)'{2,}/g, '$1')
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove references
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
      .replace(/<ref[^>]*\/>/gi, '')
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned;
  }

  // Search across all chunks (for future semantic search use)
  async searchAllChunks(searchTerm, maxResults = 10) {
    const results = [];
    const searchLower = searchTerm.toLowerCase();

    for (let chunkNum = 1; chunkNum <= this.totalChunks && results.length < maxResults; chunkNum++) {
      const chunkData = await this.loadChunk(chunkNum);

      if (!chunkData || !chunkData.mediawiki || !chunkData.mediawiki.page) {
        continue;
      }

      const pages = chunkData.mediawiki.page;

      for (const page of pages) {
        if (results.length >= maxResults) break;

        const title = page.title?.[0] || '';
        if (title.toLowerCase().includes(searchLower)) {
          results.push(this.formatArticle(page));
        }
      }
    }

    return results;
  }
}
