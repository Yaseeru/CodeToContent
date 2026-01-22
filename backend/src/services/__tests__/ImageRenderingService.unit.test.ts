/**
 * Unit Tests for ImageRenderingService
 * Tests image rendering functionality with mocked Puppeteer
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
 */

import { ImageRenderingService, SyntaxTheme } from '../ImageRenderingService';
import puppeteer, { Browser, Page } from 'puppeteer';

// Mock Puppeteer
jest.mock('puppeteer');

// Mock Shiki
jest.mock('shiki', () => ({
     codeToHtml: jest.fn()
}));

// Mock Sharp
jest.mock('sharp', () => {
     return jest.fn(() => ({
          png: jest.fn().mockReturnThis(),
          resize: jest.fn().mockReturnThis(),
          toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image-data'))
     }));
});

// Mock LoggerService
jest.mock('../LoggerService', () => ({
     LoggerService: {
          getInstance: jest.fn(() => ({
               log: jest.fn()
          }))
     },
     LogLevel: {
          DEBUG: 'DEBUG',
          INFO: 'INFO',
          WARN: 'WARN',
          ERROR: 'ERROR'
     }
}));

describe('ImageRenderingService - Unit Tests', () => {
     let service: ImageRenderingService;
     let mockBrowser: jest.Mocked<Browser>;
     let mockPage: jest.Mocked<Page>;

     beforeEach(() => {
          // Reset all mocks
          jest.clearAllMocks();

          // Create mock page
          mockPage = {
               goto: jest.fn().mockResolvedValue(null),
               close: jest.fn().mockResolvedValue(undefined),
               setViewport: jest.fn().mockResolvedValue(undefined),
               setContent: jest.fn().mockResolvedValue(undefined),
               screenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot-data')),
               $: jest.fn().mockResolvedValue({
                    boundingBox: jest.fn().mockResolvedValue({
                         x: 0,
                         y: 0,
                         width: 800,
                         height: 600
                    })
               })
          } as any;

          // Create mock browser
          mockBrowser = {
               newPage: jest.fn().mockResolvedValue(mockPage),
               close: jest.fn().mockResolvedValue(undefined)
          } as any;

          // Mock puppeteer.launch
          (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

          // Create service instance
          service = new ImageRenderingService();
     });

     afterEach(async () => {
          // Cleanup if service was initialized
          if (service.isReady()) {
               await service.cleanup();
          }
     });

     /**
      * Test initialize method
      * Validates: Requirements 2.1
      */
     describe('initialize', () => {
          it('should initialize browser and page pool successfully', async () => {
               await service.initialize();

               expect(puppeteer.launch).toHaveBeenCalledWith(
                    expect.objectContaining({
                         headless: true,
                         args: expect.arrayContaining([
                              '--no-sandbox',
                              '--disable-setuid-sandbox'
                         ])
                    })
               );

               expect(mockBrowser.newPage).toHaveBeenCalledTimes(3); // maxPages = 3
               expect(service.isReady()).toBe(true);
               expect(service.getPoolSize()).toBe(3);
          });

          it('should not reinitialize if already initialized', async () => {
               await service.initialize();
               const firstCallCount = (puppeteer.launch as jest.Mock).mock.calls.length;

               await service.initialize();
               const secondCallCount = (puppeteer.launch as jest.Mock).mock.calls.length;

               expect(secondCallCount).toBe(firstCallCount);
          });

          it('should use PUPPETEER_EXECUTABLE_PATH from environment if set', async () => {
               const originalPath = process.env.PUPPETEER_EXECUTABLE_PATH;
               process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/path/to/chromium';

               await service.initialize();

               expect(puppeteer.launch).toHaveBeenCalledWith(
                    expect.objectContaining({
                         executablePath: '/custom/path/to/chromium'
                    })
               );

               // Restore original value
               if (originalPath) {
                    process.env.PUPPETEER_EXECUTABLE_PATH = originalPath;
               } else {
                    delete process.env.PUPPETEER_EXECUTABLE_PATH;
               }
          });

          it('should throw error if browser launch fails', async () => {
               (puppeteer.launch as jest.Mock).mockRejectedValueOnce(
                    new Error('Failed to launch browser')
               );

               await expect(service.initialize()).rejects.toThrow(
                    'Failed to initialize image rendering service'
               );

               expect(service.isReady()).toBe(false);
          });
     });

     /**
      * Test cleanup method
      * Validates: Requirements 2.1
      */
     describe('cleanup', () => {
          it('should close all pages and browser', async () => {
               await service.initialize();

               await service.cleanup();

               expect(mockPage.close).toHaveBeenCalledTimes(3); // All pages in pool
               expect(mockBrowser.close).toHaveBeenCalledTimes(1);
               expect(service.isReady()).toBe(false);
               expect(service.getPoolSize()).toBe(0);
          });

          it('should handle cleanup errors gracefully', async () => {
               await service.initialize();

               // Mock browser.close to throw error (page.close errors are caught individually)
               mockBrowser.close.mockRejectedValueOnce(new Error('Browser close failed'));

               // Should throw error when browser close fails
               await expect(service.cleanup()).rejects.toThrow(
                    'Failed to cleanup image rendering service'
               );
          });

          it('should do nothing if not initialized', async () => {
               await service.cleanup();

               expect(mockPage.close).not.toHaveBeenCalled();
               expect(mockBrowser.close).not.toHaveBeenCalled();
          });
     });

     /**
      * Test page pool management
      * Validates: Requirements 2.1
      */
     describe('page pool management', () => {
          describe('getPage', () => {
               it('should return page from pool when available', async () => {
                    await service.initialize();

                    const page = await service.getPage();

                    expect(page).toBeDefined();
                    expect(service.getPoolSize()).toBe(2); // One page taken from pool
                    expect(mockBrowser.newPage).toHaveBeenCalledTimes(3); // Only initial pool creation
               });

               it('should create new page when pool is empty', async () => {
                    await service.initialize();

                    // Drain the pool
                    await service.getPage();
                    await service.getPage();
                    await service.getPage();

                    expect(service.getPoolSize()).toBe(0);

                    // This should create a new page
                    const page = await service.getPage();

                    expect(page).toBeDefined();
                    expect(mockBrowser.newPage).toHaveBeenCalledTimes(4); // 3 initial + 1 new
               });

               it('should throw error if not initialized', async () => {
                    await expect(service.getPage()).rejects.toThrow(
                         'ImageRenderingService not initialized'
                    );
               });
          });

          describe('releasePage', () => {
               it('should return page to pool when pool has space', async () => {
                    await service.initialize();

                    const page = await service.getPage();
                    expect(service.getPoolSize()).toBe(2);

                    await service.releasePage(page);

                    expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
                    expect(service.getPoolSize()).toBe(3);
                    expect(mockPage.close).not.toHaveBeenCalled();
               });

               it('should close page when pool is full', async () => {
                    await service.initialize();
                    expect(service.getPoolSize()).toBe(3); // Pool is full

                    // Create a new page (not from pool)
                    const extraPage = await mockBrowser.newPage();

                    await service.releasePage(extraPage);

                    expect(extraPage.close).toHaveBeenCalled();
                    expect(service.getPoolSize()).toBe(3); // Pool size unchanged
               });

               it('should handle null page gracefully', async () => {
                    await service.initialize();

                    await expect(service.releasePage(null as any)).resolves.not.toThrow();
               });

               it('should handle page release errors', async () => {
                    await service.initialize();

                    const page = await service.getPage();
                    mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));

                    // Should not throw, but close the page
                    await expect(service.releasePage(page)).resolves.not.toThrow();
                    expect(mockPage.close).toHaveBeenCalled();
               });
          });
     });

     /**
      * Test generateHighlightedHTML method
      * Validates: Requirements 2.2, 2.4
      */
     describe('generateHighlightedHTML', () => {
          const { codeToHtml } = require('shiki');

          beforeEach(() => {
               codeToHtml.mockResolvedValue('<pre><code class="shiki">highlighted code</code></pre>');
          });

          it('should generate highlighted HTML for TypeScript code', async () => {
               await service.initialize();

               const code = 'const greeting: string = "Hello, World!";';
               const result = await service.generateHighlightedHTML(code, 'typescript', 'nord');

               expect(codeToHtml).toHaveBeenCalledWith(code, {
                    lang: 'typescript',
                    theme: 'nord',
                    structure: 'inline'
               });

               expect(result).toContain('highlighted code');
          });

          it('should auto-detect language from file extension', async () => {
               await service.initialize();

               const code = 'print("Hello, World!")';
               await service.generateHighlightedHTML(code, 'py', 'nord');

               expect(codeToHtml).toHaveBeenCalledWith(code, {
                    lang: 'python',
                    theme: 'nord',
                    structure: 'inline'
               });
          });

          it('should handle various language extensions', async () => {
               await service.initialize();

               const testCases = [
                    { input: 'ts', expected: 'typescript' },
                    { input: 'js', expected: 'javascript' },
                    { input: 'py', expected: 'python' },
                    { input: 'go', expected: 'go' },
                    { input: 'rs', expected: 'rust' },
                    { input: 'java', expected: 'java' },
                    { input: 'cpp', expected: 'cpp' },
                    { input: 'rb', expected: 'ruby' },
                    { input: 'sh', expected: 'bash' },
                    { input: 'json', expected: 'json' },
                    { input: 'yaml', expected: 'yaml' },
                    { input: 'md', expected: 'markdown' }
               ];

               for (const testCase of testCases) {
                    await service.generateHighlightedHTML('code', testCase.input, 'nord');

                    expect(codeToHtml).toHaveBeenCalledWith('code', {
                         lang: testCase.expected,
                         theme: 'nord',
                         structure: 'inline'
                    });
               }
          });

          it('should remove leading dot from file extension', async () => {
               await service.initialize();

               await service.generateHighlightedHTML('code', '.ts', 'nord');

               expect(codeToHtml).toHaveBeenCalledWith('code', {
                    lang: 'typescript',
                    theme: 'nord',
                    structure: 'inline'
               });
          });

          it('should default to text for unknown language', async () => {
               await service.initialize();

               await service.generateHighlightedHTML('code', 'unknown', 'nord');

               expect(codeToHtml).toHaveBeenCalledWith('code', {
                    lang: 'unknown',
                    theme: 'nord',
                    structure: 'inline'
               });
          });

          it('should handle empty code gracefully', async () => {
               await service.initialize();

               const result = await service.generateHighlightedHTML('', 'typescript', 'nord');

               expect(result).toBe('<pre><code></code></pre>');
               expect(codeToHtml).not.toHaveBeenCalled();
          });

          it('should handle whitespace-only code', async () => {
               await service.initialize();

               const result = await service.generateHighlightedHTML('   \n\t  ', 'typescript', 'nord');

               expect(result).toBe('<pre><code></code></pre>');
               expect(codeToHtml).not.toHaveBeenCalled();
          });

          it('should support different themes', async () => {
               await service.initialize();

               const themes: SyntaxTheme[] = ['nord', 'dracula', 'github-dark', 'monokai', 'one-dark-pro'];

               for (const theme of themes) {
                    await service.generateHighlightedHTML('code', 'typescript', theme);

                    expect(codeToHtml).toHaveBeenCalledWith('code', {
                         lang: 'typescript',
                         theme: theme,
                         structure: 'inline'
                    });
               }
          });

          it('should fallback to plain text on Shiki error', async () => {
               await service.initialize();

               codeToHtml.mockRejectedValueOnce(new Error('Shiki error'));

               const code = 'const x = 1;';
               const result = await service.generateHighlightedHTML(code, 'typescript', 'nord');

               expect(result).toContain('<pre><code>');
               expect(result).toContain('const x = 1;');
               expect(result).toContain('</code></pre>');
          });

          it('should escape HTML in fallback mode', async () => {
               await service.initialize();

               codeToHtml.mockRejectedValueOnce(new Error('Shiki error'));

               const code = '<script>alert("XSS")</script>';
               const result = await service.generateHighlightedHTML(code, 'html', 'nord');

               expect(result).toContain('&lt;script&gt;');
               expect(result).toContain('&lt;/script&gt;');
               expect(result).not.toContain('<script>');
          });
     });

     /**
      * Test wrapInTemplate method
      * Validates: Requirements 2.2, 2.3
      */
     describe('wrapInTemplate', () => {
          it('should wrap code in Carbon.now.sh-style template', async () => {
               await service.initialize();

               const highlightedCode = '<pre><code>const x = 1;</code></pre>';
               const filePath = 'src/components/Button.tsx';
               const result = service.wrapInTemplate(highlightedCode, filePath, 'nord');

               expect(result).toContain('<!DOCTYPE html>');
               expect(result).toContain('<html lang="en">');
               expect(result).toContain('Code Snapshot');
               expect(result).toContain(highlightedCode);
               expect(result).toContain(filePath);
          });

          it('should include macOS-style window controls', async () => {
               await service.initialize();

               const result = service.wrapInTemplate('<code>test</code>', 'test.ts', 'nord');

               expect(result).toContain('dot red');
               expect(result).toContain('dot yellow');
               expect(result).toContain('dot green');
               expect(result).toContain('#ff5f56'); // Red color
               expect(result).toContain('#ffbd2e'); // Yellow color
               expect(result).toContain('#27c93f'); // Green color
          });

          it('should apply correct gradient for each theme', async () => {
               await service.initialize();

               const themes: Record<SyntaxTheme, string> = {
                    'nord': '#667eea',
                    'dracula': '#ff79c6',
                    'github-dark': '#434343',
                    'monokai': '#f92672',
                    'one-dark-pro': '#61afef'
               };

               for (const [theme, color] of Object.entries(themes)) {
                    const result = service.wrapInTemplate('<code>test</code>', 'test.ts', theme as SyntaxTheme);
                    expect(result).toContain(color);
               }
          });

          it('should escape file path to prevent XSS', async () => {
               await service.initialize();

               const maliciousPath = '<script>alert("XSS")</script>';
               const result = service.wrapInTemplate('<code>test</code>', maliciousPath, 'nord');

               expect(result).toContain('&lt;script&gt;');
               expect(result).not.toContain('<script>alert');
          });

          it('should include responsive CSS', async () => {
               await service.initialize();

               const result = service.wrapInTemplate('<code>test</code>', 'test.ts', 'nord');

               expect(result).toContain('@media (max-width: 768px)');
               expect(result).toContain('font-family');
               expect(result).toContain('Fira Code');
          });

          it('should include code container styling', async () => {
               await service.initialize();

               const result = service.wrapInTemplate('<code>test</code>', 'test.ts', 'nord');

               expect(result).toContain('.code-container');
               expect(result).toContain('border-radius');
               expect(result).toContain('box-shadow');
               expect(result).toContain('#2e3440'); // Nord dark background
          });

          it('should include scrollbar styling', async () => {
               await service.initialize();

               const result = service.wrapInTemplate('<code>test</code>', 'test.ts', 'nord');

               expect(result).toContain('::-webkit-scrollbar');
               expect(result).toContain('::-webkit-scrollbar-thumb');
               expect(result).toContain('::-webkit-scrollbar-track');
          });
     });

     /**
      * Test renderCodeToImage method with mocked Puppeteer
      * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
      */
     describe('renderCodeToImage', () => {
          const { codeToHtml } = require('shiki');

          beforeEach(() => {
               codeToHtml.mockResolvedValue('<pre><code class="shiki">highlighted code</code></pre>');
          });

          it('should render code to image successfully', async () => {
               await service.initialize();

               const code = 'const greeting = "Hello, World!";';
               const language = 'typescript';
               const filePath = 'src/greeting.ts';

               const result = await service.renderCodeToImage(code, language, filePath, 'nord');

               expect(result).toBeInstanceOf(Buffer);
               expect(codeToHtml).toHaveBeenCalled();
               expect(mockPage.setViewport).toHaveBeenCalledWith({
                    width: 1200,
                    height: 800,
                    deviceScaleFactor: 2
               });
               expect(mockPage.setContent).toHaveBeenCalled();
               expect(mockPage.screenshot).toHaveBeenCalled();
          });

          it('should set correct viewport dimensions', async () => {
               await service.initialize();

               await service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord');

               expect(mockPage.setViewport).toHaveBeenCalledWith({
                    width: 1200,
                    height: 800,
                    deviceScaleFactor: 2 // Retina display
               });
          });

          it('should capture screenshot with correct clip bounds', async () => {
               await service.initialize();

               await service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord');

               expect(mockPage.screenshot).toHaveBeenCalledWith({
                    type: 'png',
                    clip: expect.objectContaining({
                         x: expect.any(Number),
                         y: expect.any(Number),
                         width: expect.any(Number),
                         height: expect.any(Number)
                    })
               });
          });

          it('should optimize image with Sharp', async () => {
               await service.initialize();
               const sharp = require('sharp');

               await service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord');

               expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
          });

          it('should release page back to pool after rendering', async () => {
               await service.initialize();

               const initialPoolSize = service.getPoolSize();
               await service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord');
               const finalPoolSize = service.getPoolSize();

               expect(finalPoolSize).toBe(initialPoolSize);
               expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
          });

          it('should release page even if rendering fails', async () => {
               await service.initialize();

               mockPage.screenshot.mockRejectedValueOnce(new Error('Screenshot failed'));

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow();

               // Page should still be released
               expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
          });

          it('should throw error if code container not found', async () => {
               await service.initialize();

               mockPage.$.mockResolvedValueOnce(null);

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('Code container element not found');
          });

          it('should throw error if bounding box cannot be determined', async () => {
               await service.initialize();

               mockPage.$.mockResolvedValueOnce({
                    boundingBox: jest.fn().mockResolvedValue(null)
               } as any);

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('Could not determine bounding box');
          });

          it('should throw error if image exceeds 5MB', async () => {
               await service.initialize();

               const sharp = require('sharp');
               const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

               sharp.mockReturnValueOnce({
                    png: jest.fn().mockReturnThis(),
                    resize: jest.fn().mockReturnThis(),
                    toBuffer: jest.fn().mockResolvedValue(largeBuffer)
               });

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('exceeds 5MB limit');
          });

          it('should handle different themes', async () => {
               await service.initialize();

               const themes: SyntaxTheme[] = ['nord', 'dracula', 'github-dark', 'monokai', 'one-dark-pro'];

               for (const theme of themes) {
                    await service.renderCodeToImage('code', 'typescript', 'test.ts', theme);

                    expect(codeToHtml).toHaveBeenCalledWith('code', {
                         lang: 'typescript',
                         theme: theme,
                         structure: 'inline'
                    });
               }
          });

          it('should handle various programming languages', async () => {
               await service.initialize();

               const languages = ['typescript', 'python', 'go', 'rust', 'java'];

               for (const lang of languages) {
                    await service.renderCodeToImage('code', lang, `test.${lang}`, 'nord');

                    expect(codeToHtml).toHaveBeenCalledWith('code', {
                         lang: lang,
                         theme: 'nord',
                         structure: 'inline'
                    });
               }
          });
     });

     /**
      * Test error handling
      * Validates: Requirements 2.1, 2.6
      */
     describe('error handling', () => {
          it('should handle Puppeteer launch failure', async () => {
               (puppeteer.launch as jest.Mock).mockRejectedValueOnce(
                    new Error('Chromium not found')
               );

               await expect(service.initialize()).rejects.toThrow(
                    'Failed to initialize image rendering service'
               );
          });

          it('should handle page creation failure', async () => {
               await service.initialize();

               // Drain the pool first so getPage needs to create a new page
               await service.getPage();
               await service.getPage();
               await service.getPage();

               // Now mock the next newPage call to fail
               mockBrowser.newPage.mockRejectedValueOnce(new Error('Page creation failed'));

               await expect(service.getPage()).rejects.toThrow('Page creation failed');
          });

          it('should handle screenshot failure', async () => {
               await service.initialize();

               mockPage.screenshot.mockRejectedValueOnce(new Error('Screenshot failed'));

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('Failed to render code to image');
          });

          it('should handle setContent timeout', async () => {
               await service.initialize();

               mockPage.setContent.mockRejectedValueOnce(new Error('Timeout'));

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('Failed to render code to image');
          });

          it('should handle Sharp optimization failure', async () => {
               await service.initialize();

               const sharp = require('sharp');
               sharp.mockReturnValueOnce({
                    png: jest.fn().mockReturnThis(),
                    resize: jest.fn().mockReturnThis(),
                    toBuffer: jest.fn().mockRejectedValue(new Error('Optimization failed'))
               });

               await expect(
                    service.renderCodeToImage('code', 'typescript', 'test.ts', 'nord')
               ).rejects.toThrow('Failed to render code to image');
          });
     });

     /**
      * Test isReady and getPoolSize utility methods
      */
     describe('utility methods', () => {
          it('should return false for isReady before initialization', () => {
               expect(service.isReady()).toBe(false);
          });

          it('should return true for isReady after initialization', async () => {
               await service.initialize();
               expect(service.isReady()).toBe(true);
          });

          it('should return false for isReady after cleanup', async () => {
               await service.initialize();
               await service.cleanup();
               expect(service.isReady()).toBe(false);
          });

          it('should return correct pool size', async () => {
               await service.initialize();
               expect(service.getPoolSize()).toBe(3);

               await service.getPage();
               expect(service.getPoolSize()).toBe(2);

               await service.getPage();
               expect(service.getPoolSize()).toBe(1);
          });
     });
});
