import puppeteer, { Browser, Page } from 'puppeteer';
import { codeToHtml } from 'shiki';
import sharp from 'sharp';
import { LoggerService, LogLevel } from './LoggerService';

/**
 * Supported themes for syntax highlighting
 */
export type SyntaxTheme = 'nord' | 'dracula' | 'github-dark' | 'monokai' | 'one-dark-pro';

/**
 * Language mapping for file extensions to Shiki language identifiers
 */
const LANGUAGE_MAP: Record<string, string> = {
     'ts': 'typescript',
     'tsx': 'tsx',
     'js': 'javascript',
     'jsx': 'jsx',
     'py': 'python',
     'go': 'go',
     'rs': 'rust',
     'java': 'java',
     'cpp': 'cpp',
     'c': 'c',
     'cs': 'csharp',
     'rb': 'ruby',
     'php': 'php',
     'swift': 'swift',
     'kt': 'kotlin',
     'scala': 'scala',
     'sh': 'bash',
     'bash': 'bash',
     'zsh': 'bash',
     'sql': 'sql',
     'html': 'html',
     'css': 'css',
     'scss': 'scss',
     'json': 'json',
     'yaml': 'yaml',
     'yml': 'yaml',
     'xml': 'xml',
     'md': 'markdown',
     'markdown': 'markdown'
};

/**
 * Service for rendering code snippets to PNG images using Puppeteer.
 * Implements page pooling for performance optimization and Shiki for syntax highlighting.
 */
export class ImageRenderingService {
     private browser: Browser | null = null;
     private pagePool: Page[] = [];
     private readonly maxPages = 3;
     private isInitialized = false;
     private logger: LoggerService;

     constructor() {
          this.logger = LoggerService.getInstance();
     }

     /**
      * Initialize the Puppeteer browser instance and pre-warm the page pool.
      * Must be called before using the service.
      */
     async initialize(): Promise<void> {
          if (this.isInitialized) {
               this.logger.log(LogLevel.WARN, 'ImageRenderingService already initialized');
               return;
          }

          try {
               this.logger.log(LogLevel.INFO, 'Initializing ImageRenderingService with Puppeteer');

               // Launch browser with optimized settings for headless rendering
               this.browser = await puppeteer.launch({
                    headless: true,
                    args: [
                         '--no-sandbox',
                         '--disable-setuid-sandbox',
                         '--disable-dev-shm-usage', // Overcome limited resource problems
                         '--disable-accelerated-2d-canvas',
                         '--no-first-run',
                         '--no-zygote',
                         '--disable-gpu'
                    ],
                    // Use environment variable for production deployment
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
               });

               // Pre-warm page pool for better performance
               this.logger.log(LogLevel.INFO, `Pre-warming page pool with ${this.maxPages} pages`);
               for (let i = 0; i < this.maxPages; i++) {
                    const page = await this.browser.newPage();
                    this.pagePool.push(page);
               }

               this.isInitialized = true;
               this.logger.log(LogLevel.INFO, 'ImageRenderingService initialized successfully');
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Failed to initialize ImageRenderingService', {
                    error: error instanceof Error ? error.message : String(error)
               });
               throw new Error('Failed to initialize image rendering service');
          }
     }

     /**
      * Get a page from the pool or create a new one if pool is empty.
      * Pages are reused for better performance.
      */
     async getPage(): Promise<Page> {
          if (!this.isInitialized || !this.browser) {
               throw new Error('ImageRenderingService not initialized. Call initialize() first.');
          }

          // Try to get a page from the pool
          const page = this.pagePool.pop();

          if (page) {
               this.logger.log(LogLevel.DEBUG, 'Reusing page from pool', {
                    poolSize: this.pagePool.length
               });
               return page;
          }

          // Pool is empty, create a new page
          this.logger.log(LogLevel.DEBUG, 'Creating new page (pool empty)');
          return await this.browser.newPage();
     }

     /**
      * Release a page back to the pool for reuse.
      * If pool is full, the page is closed instead.
      */
     async releasePage(page: Page): Promise<void> {
          if (!page) {
               return;
          }

          try {
               // If pool has space, reset and return the page
               if (this.pagePool.length < this.maxPages) {
                    // Navigate to blank page to clear state
                    await page.goto('about:blank');
                    this.pagePool.push(page);
                    this.logger.log(LogLevel.DEBUG, 'Page returned to pool', {
                         poolSize: this.pagePool.length
                    });
               } else {
                    // Pool is full, close the page
                    await page.close();
                    this.logger.log(LogLevel.DEBUG, 'Page closed (pool full)');
               }
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Error releasing page', {
                    error: error instanceof Error ? error.message : String(error)
               });
               // Try to close the page if release failed
               try {
                    await page.close();
               } catch (closeError) {
                    // Ignore close errors
               }
          }
     }

     /**
      * Clean up all resources: close all pages and browser.
      * Should be called when shutting down the service.
      */
     async cleanup(): Promise<void> {
          if (!this.isInitialized) {
               return;
          }

          try {
               this.logger.log(LogLevel.INFO, 'Cleaning up ImageRenderingService');

               // Close all pages in the pool
               const closePromises = this.pagePool.map(page =>
                    page.close().catch(error => {
                         this.logger.log(LogLevel.ERROR, 'Error closing page during cleanup', {
                              error: error instanceof Error ? error.message : String(error)
                         });
                    })
               );
               await Promise.all(closePromises);
               this.pagePool = [];

               // Close the browser
               if (this.browser) {
                    await this.browser.close();
                    this.browser = null;
               }

               this.isInitialized = false;
               this.logger.log(LogLevel.INFO, 'ImageRenderingService cleanup complete');
          } catch (error) {
               this.logger.log(LogLevel.ERROR, 'Error during ImageRenderingService cleanup', {
                    error: error instanceof Error ? error.message : String(error)
               });
               throw new Error('Failed to cleanup image rendering service');
          }
     }

     /**
      * Check if the service is initialized and ready to use.
      */
     isReady(): boolean {
          return this.isInitialized && this.browser !== null;
     }

     /**
      * Get the current size of the page pool.
      * Useful for monitoring and debugging.
      */
     getPoolSize(): number {
          return this.pagePool.length;
     }

     /**
      * Auto-detect programming language from file extension or language hint.
      * Falls back to 'text' for unknown languages.
      * 
      * @param language - Language hint (file extension or language name)
      * @returns Shiki-compatible language identifier
      */
     private detectLanguage(language: string): string {
          if (!language) {
               this.logger.log(LogLevel.WARN, 'No language provided, defaulting to text');
               return 'text';
          }

          // Normalize input: lowercase and remove leading dot
          const normalized = language.toLowerCase().replace(/^\./, '');

          // Check if it's a known language
          const detected = LANGUAGE_MAP[normalized] || normalized;

          this.logger.log(LogLevel.DEBUG, 'Language detected', {
               input: language,
               detected
          });

          return detected;
     }

     /**
      * Generate syntax-highlighted HTML from code using Shiki.
      * Supports multiple themes and auto-detects programming language.
      * 
      * @param code - Source code to highlight
      * @param language - Programming language (file extension or language name)
      * @param theme - Color theme for syntax highlighting (default: 'nord')
      * @returns HTML string with syntax-highlighted code
      */
     async generateHighlightedHTML(
          code: string,
          language: string,
          theme: SyntaxTheme = 'nord'
     ): Promise<string> {
          try {
               // Handle edge case: empty code
               if (!code || code.trim().length === 0) {
                    this.logger.log(LogLevel.WARN, 'Empty code provided for highlighting');
                    return '<pre><code></code></pre>';
               }

               // Auto-detect language
               const detectedLanguage = this.detectLanguage(language);

               this.logger.log(LogLevel.DEBUG, 'Generating highlighted HTML', {
                    language: detectedLanguage,
                    theme,
                    codeLength: code.length
               });

               // Generate syntax-highlighted HTML using Shiki
               const html = await codeToHtml(code, {
                    lang: detectedLanguage,
                    theme: theme,
                    // Use inline styles for better rendering in Puppeteer
                    structure: 'inline'
               });

               this.logger.log(LogLevel.DEBUG, 'HTML generation successful', {
                    htmlLength: html.length
               });

               return html;

          } catch (error) {
               // Handle unknown language gracefully
               this.logger.log(LogLevel.ERROR, 'Failed to generate highlighted HTML', {
                    error: error instanceof Error ? error.message : String(error),
                    language,
                    theme
               });

               // Fallback: return plain code wrapped in pre/code tags
               this.logger.log(LogLevel.WARN, 'Falling back to plain text rendering');
               return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
          }
     }

     /**
      * Escape HTML special characters to prevent XSS.
      * Used as fallback when syntax highlighting fails.
      * 
      * @param text - Text to escape
      * @returns HTML-safe text
      */
     private escapeHtml(text: string): string {
          const htmlEscapeMap: Record<string, string> = {
               '&': '&amp;',
               '<': '&lt;',
               '>': '&gt;',
               '"': '&quot;',
               "'": '&#39;'
          };

          return text.replace(/[&<>"']/g, char => htmlEscapeMap[char] || char);
     }

     /**
      * Render code snippet to a PNG image.
      * This is the main entry point for generating code snapshot images.
      * 
      * Process:
      * 1. Generate syntax-highlighted HTML with Shiki
      * 2. Wrap in Carbon.now.sh-style template
      * 3. Set viewport dimensions (1200x800, 2x scale for retina)
      * 4. Capture screenshot with Puppeteer
      * 5. Optimize image with Sharp (PNG, quality 90)
      * 6. Ensure under 5MB size limit
      * 
      * @param code - Source code to render
      * @param language - Programming language (file extension or language name)
      * @param filePath - File path to display in header
      * @param theme - Color theme for syntax highlighting (default: 'nord')
      * @returns Buffer containing optimized PNG image data
      * @throws Error if rendering fails or image exceeds 5MB
      */
     async renderCodeToImage(
          code: string,
          language: string,
          filePath: string,
          theme: SyntaxTheme = 'nord'
     ): Promise<Buffer> {
          const startTime = Date.now();
          let page: Page | null = null;

          try {
               this.logger.log(LogLevel.INFO, 'Starting code to image rendering', {
                    language,
                    filePath,
                    theme,
                    codeLength: code.length
               });

               // Step 1: Generate syntax-highlighted HTML with Shiki
               const highlightedHTML = await this.generateHighlightedHTML(code, language, theme);

               // Step 2: Wrap in styled template
               const styledHTML = this.wrapInTemplate(highlightedHTML, filePath, theme);

               // Step 3: Get a page from the pool
               page = await this.getPage();

               // Step 4: Set viewport dimensions (1200x800, 2x scale for retina)
               await page.setViewport({
                    width: 1200,
                    height: 800,
                    deviceScaleFactor: 2 // Retina display quality
               });

               // Load the HTML content
               await page.setContent(styledHTML, {
                    waitUntil: 'networkidle0', // Wait for all resources to load
                    timeout: 10000 // 10 second timeout
               });

               // Step 5: Capture screenshot with Puppeteer
               // Get the bounding box of the code container for precise cropping
               const element = await page.$('.code-container');
               if (!element) {
                    throw new Error('Code container element not found in rendered HTML');
               }

               const boundingBox = await element.boundingBox();
               if (!boundingBox) {
                    throw new Error('Could not determine bounding box of code container');
               }

               // Add padding around the code container
               const padding = 60 * 2; // 60px padding * 2 for device scale factor
               const screenshot = await page.screenshot({
                    type: 'png',
                    clip: {
                         x: Math.max(0, boundingBox.x - padding),
                         y: Math.max(0, boundingBox.y - padding),
                         width: boundingBox.width + (padding * 2),
                         height: boundingBox.height + (padding * 2)
                    }
               });

               // Step 6: Optimize image with Sharp (PNG, quality 90)
               const optimized = await sharp(screenshot)
                    .png({
                         quality: 90,
                         compressionLevel: 9, // Maximum compression
                         adaptiveFiltering: true,
                         palette: true // Use palette-based PNG for smaller file size
                    })
                    .resize({
                         width: 1200,
                         withoutEnlargement: true, // Don't upscale if smaller
                         fit: 'inside' // Maintain aspect ratio
                    })
                    .toBuffer();

               // Step 7: Ensure under 5MB size limit
               const sizeInMB = optimized.length / (1024 * 1024);
               if (sizeInMB > 5) {
                    this.logger.log(LogLevel.ERROR, 'Generated image exceeds 5MB limit', {
                         sizeInMB: sizeInMB.toFixed(2),
                         filePath
                    });
                    throw new Error(`Generated image size (${sizeInMB.toFixed(2)}MB) exceeds 5MB limit`);
               }

               const duration = Date.now() - startTime;
               this.logger.log(LogLevel.INFO, 'Code to image rendering successful', {
                    filePath,
                    sizeInMB: sizeInMB.toFixed(2),
                    durationMs: duration,
                    dimensions: {
                         width: boundingBox.width,
                         height: boundingBox.height
                    }
               });

               return optimized;

          } catch (error) {
               const duration = Date.now() - startTime;
               this.logger.log(LogLevel.ERROR, 'Failed to render code to image', {
                    error: error instanceof Error ? error.message : String(error),
                    filePath,
                    language,
                    durationMs: duration
               });

               throw new Error(`Failed to render code to image: ${error instanceof Error ? error.message : String(error)}`);

          } finally {
               // Always release the page back to the pool
               if (page) {
                    await this.releasePage(page);
               }
          }
     }

     /**
      * Wrap syntax-highlighted code in a Carbon.now.sh-style HTML template.
      * Creates a beautiful code snapshot with:
      * - Minimal frame with macOS-style window controls (red, yellow, green dots)
      * - Gradient background for visual appeal
      * - Dark-themed code container with shadows and rounded corners
      * - File path header
      * - Responsive layout that adapts to code length
      * 
      * @param highlightedCode - Syntax-highlighted HTML from Shiki
      * @param filePath - File path to display in header (e.g., "src/components/Button.tsx")
      * @param theme - Color theme (affects background gradient)
      * @returns Complete HTML document ready for rendering
      */
     wrapInTemplate(
          highlightedCode: string,
          filePath: string,
          theme: SyntaxTheme = 'nord'
     ): string {
          // Select gradient based on theme
          const gradients: Record<SyntaxTheme, string> = {
               'nord': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               'dracula': 'linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%)',
               'github-dark': 'linear-gradient(135deg, #434343 0%, #000000 100%)',
               'monokai': 'linear-gradient(135deg, #f92672 0%, #66d9ef 100%)',
               'one-dark-pro': 'linear-gradient(135deg, #61afef 0%, #c678dd 100%)'
          };

          const gradient = gradients[theme] || gradients['nord'];

          // Escape file path for safe HTML rendering
          const safeFilePath = this.escapeHtml(filePath);

          return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Snapshot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 60px;
      background: ${gradient};
      font-family: 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }

    .code-container {
      background: #2e3440;
      border-radius: 10px;
      padding: 0;
      box-shadow: 
        0 20px 68px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(0, 0, 0, 0.1);
      max-width: 1200px;
      width: 100%;
      overflow: hidden;
    }

    .code-header {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: #3b4252;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    }

    .code-dots {
      display: flex;
      gap: 8px;
      margin-right: 16px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .dot.red {
      background: #ff5f56;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    }

    .dot.yellow {
      background: #ffbd2e;
      background: linear-gradient(135deg, #ffd93d 0%, #f4c430 100%);
    }

    .dot.green {
      background: #27c93f;
      background: linear-gradient(135deg, #32d74b 0%, #28c840 100%);
    }

    .code-title {
      color: #d8dee9;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.3px;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .code-content {
      padding: 24px;
      overflow-x: auto;
      background: #2e3440;
    }

    /* Override Shiki styles for better integration */
    .code-content pre {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      overflow: visible !important;
    }

    .code-content code {
      font-size: 14px !important;
      line-height: 1.6 !important;
      font-family: 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace !important;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      body {
        padding: 30px;
      }

      .code-container {
        border-radius: 8px;
      }

      .code-header {
        padding: 12px 16px;
      }

      .code-content {
        padding: 16px;
      }

      .code-content code {
        font-size: 12px !important;
      }

      .dot {
        width: 10px;
        height: 10px;
      }

      .code-title {
        font-size: 12px;
      }
    }

    /* Ensure code doesn't break layout */
    .code-content {
      word-wrap: break-word;
      word-break: break-word;
    }

    /* Scrollbar styling for better aesthetics */
    .code-content::-webkit-scrollbar {
      height: 8px;
    }

    .code-content::-webkit-scrollbar-track {
      background: #3b4252;
      border-radius: 4px;
    }

    .code-content::-webkit-scrollbar-thumb {
      background: #4c566a;
      border-radius: 4px;
    }

    .code-content::-webkit-scrollbar-thumb:hover {
      background: #5e81ac;
    }
  </style>
</head>
<body>
  <div class="code-container">
    <div class="code-header">
      <div class="code-dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="code-title">${safeFilePath}</div>
    </div>
    <div class="code-content">
      ${highlightedCode}
    </div>
  </div>
</body>
</html>`;
     }
}
