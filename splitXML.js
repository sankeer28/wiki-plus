import fs from 'fs';
import readline from 'readline';
import path from 'path';

const XML_FILE = './public/data/simplewiki-20240901-pages-articles-multistream.xml';
const OUTPUT_DIR = './public/data';
const MAX_CHUNK_SIZE = 95 * 1024 * 1024; // 95MB in bytes (under 100MB limit)

async function splitXMLFile() {
  console.log('Starting XML file splitting...');

  // Check if file exists
  if (!fs.existsSync(XML_FILE)) {
    console.error(`Error: XML file not found at ${XML_FILE}`);
    return;
  }

  const fileStats = fs.statSync(XML_FILE);
  console.log(`File size: ${(fileStats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`);

  let chunkNumber = 1;
  let currentChunkSize = 0;
  let currentChunk = [];
  let insidePage = false;
  let pageBuffer = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(XML_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  // XML header for each chunk
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.10/" version="0.10">\n';
  const xmlFooter = '</mediawiki>';

  let lineCount = 0;
  let isFirstChunk = true;

  for await (const line of rl) {
    lineCount++;

    if (lineCount % 10000 === 0) {
      console.log(`Processing line ${lineCount}...`);
    }

    // Skip the original XML header and root element (we'll add our own)
    if (line.includes('<?xml') || (line.includes('<mediawiki') && !insidePage)) {
      continue;
    }

    // Check if we're starting a page
    if (line.trim().startsWith('<page>')) {
      insidePage = true;
      pageBuffer = [line];
      continue;
    }

    // If we're inside a page, accumulate lines
    if (insidePage) {
      pageBuffer.push(line);

      // Check if page is complete
      if (line.trim().startsWith('</page>')) {
        insidePage = false;
        const pageContent = pageBuffer.join('\n');
        const pageSize = Buffer.byteLength(pageContent, 'utf8');

        // Check if adding this page would exceed chunk size
        if (currentChunkSize + pageSize > MAX_CHUNK_SIZE && currentChunk.length > 0) {
          // Write current chunk
          await writeChunk(chunkNumber, currentChunk, xmlHeader, xmlFooter);
          console.log(`Chunk ${chunkNumber} written (${(currentChunkSize / (1024 * 1024)).toFixed(2)} MB)`);

          chunkNumber++;
          currentChunk = [];
          currentChunkSize = 0;
        }

        // Add page to current chunk
        currentChunk.push(pageContent);
        currentChunkSize += pageSize;
        pageBuffer = [];
      }
      continue;
    }

    // Check if this is the closing mediawiki tag
    if (line.trim() === '</mediawiki>') {
      // Write final chunk if there's content
      if (currentChunk.length > 0) {
        await writeChunk(chunkNumber, currentChunk, xmlHeader, xmlFooter);
        console.log(`Final chunk ${chunkNumber} written (${(currentChunkSize / (1024 * 1024)).toFixed(2)} MB)`);
      }
      break;
    }
  }

  console.log(`\nSplitting complete! Created ${chunkNumber} chunks.`);
  console.log(`Chunks saved to: ${OUTPUT_DIR}`);
}

async function writeChunk(chunkNumber, pages, header, footer) {
  const chunkFileName = `simplewiki-chunk-${String(chunkNumber).padStart(3, '0')}.xml`;
  const chunkPath = path.join(OUTPUT_DIR, chunkFileName);

  const content = header + pages.join('\n') + '\n' + footer;

  await fs.promises.writeFile(chunkPath, content, 'utf8');
}

// Run the splitter
splitXMLFile().catch(error => {
  console.error('Error splitting XML:', error);
  process.exit(1);
});
