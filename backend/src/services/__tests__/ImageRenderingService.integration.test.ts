/**
 * Integration Tests for ImageRenderingService
 * Tests end-to-end rendering pipeline with mocked Puppeteer
 * Note: For true end-to-end tests with real browser, Chrome must be installed
 * Run: npx puppeteer browsers install chrome
 * Validates: Requirements 2.6, 9.2
 */

import { ImageRenderingService, SyntaxTheme } from '../ImageRenderingService';
import puppeteer, { Browser, Page } from 'puppeteer';

// Mock Puppeteer
jest.mock('puppeteer');

// Mock Shiki to avoid ESM/CommonJS compatibility issues
jest.mock('shiki', () => ({
     codeToHtml: jest.fn(async (code: string, options: any) => {
          const lang = options.lang || 'text';
          const theme = options.theme || 'nord';
          const lines = code.split('\n').map(line => {
               const escaped = line.replace(/[&<>"']/g, char => {
                    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                    return map[char] || char;
               });
               return `<span class="line"><span style="color:#d8dee9">${escaped}</span></span>`;
          }).join('\n');
          return `<pre class="shiki ${theme}" style="background-color:#2e3440;color:#d8dee9" tabindex="0"><code>${lines}</code></pre>`;
     })
}));

// Mock Sharp
jest.mock('sharp', () => {
     return jest.fn((input: Buffer) => {
          const mockSharp = {
               png: jest.fn().mockReturnThis(),
               resize: jest.fn().mockReturnThis(),
               toBuffer: jest.fn().mockResolvedValue(input),
               metadata: jest.fn().mockResolvedValue({
                    format: 'png',
                    width: 800,
                    height: 600,
                    channels: 4,
                    density: 144
               })
          };
          return mockSharp;
     });
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

jest.setTimeout(30000);

describe('ImageRenderingService - Integration Tests', () => {
     let service: ImageRenderingService;
     let mockBrowser: jest.Mocked<Browser>;
     let mockPage: jest.Mocked<Page>;

     beforeAll(async () => {
          mockPage = {
               goto: jest.fn().mockResolvedValue(null),
               close: jest.fn().mockResolvedValue(undefined),
               setViewport: jest.fn().mockResolvedValue(undefined),
               setContent: jest.fn().mockResolvedValue(undefined),
               screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screenshot-data')),
               $: jest.fn().mockResolvedValue({
                    boundingBox: jest.fn().mockResolvedValue({
                         x: 10,
                         y: 10,
                         width: 800,
                         height: 600
                    })
               })
          } as any;

          mockBrowser = {
               newPage: jest.fn().mockResolvedValue(mockPage),
               close: jest.fn().mockResolvedValue(undefined)
          } as any;

          (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

          service = new ImageRenderingService();
          await service.initialize();
     });

     afterAll(async () => {
          if (service.isReady()) {
               await service.cleanup();
          }
     });

     beforeEach(() => {
          jest.clearAllMocks();
          (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
          mockBrowser.newPage.mockResolvedValue(mockPage);
          mockPage.screenshot.mockResolvedValue(Buffer.from('mock-screenshot-' + Math.random()));
     });

     describe('End-to-End Rendering Pipeline', () => {
          it('should render TypeScript code through complete pipeline', async () => {
               const code = 'interface User {\n  id: string;\n}';
               const imageBuffer = await service.renderCodeToImage(code, 'typescript', 'src/User.ts', 'nord');

               expect(mockPage.setViewport).toHaveBeenCalledWith({
                    width: 1200,
                    height: 800,
                    deviceScaleFactor: 2
               });
               expect(mockPage.setContent).toHaveBeenCalled();
               expect(mockPage.screenshot).toHaveBeenCalled();
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should render Python code through complete pipeline', async () => {
               const code = 'def hello():\n    print("Hello")';
               const imageBuffer = await service.renderCodeToImage(code, 'python', 'src/hello.py', 'dracula');

               expect(imageBuffer).toBeInstanceOf(Buffer);
               expect(mockPage.setContent).toHaveBeenCalled();
          });

          it('should render Go code through complete pipeline', async () => {
               const code = 'package main\n\nfunc main() {}';
               const imageBuffer = await service.renderCodeToImage(code, 'go', 'main.go', 'github-dark');

               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should render JavaScript code through complete pipeline', async () => {
               const code = 'const x = 42;';
               const imageBuffer = await service.renderCodeToImage(code, 'javascript', 'test.js', 'monokai');

               expect(imageBuffer).toBeInstanceOf(Buffer);
          });
     });

     describe('Performance Tests', () => {
          it('should render small code snippet within 3 seconds', async () => {
               const startTime = Date.now();
               await service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord');
               const duration = Date.now() - startTime;

               expect(duration).toBeLessThan(3000);
          });

          it('should render medium code snippet within 3 seconds', async () => {
               const code = 'class Calculator {\n  add(a, b) { return a + b; }\n}';
               const startTime = Date.now();
               await service.renderCodeToImage(code, 'javascript', 'Calculator.js', 'nord');
               const duration = Date.now() - startTime;

               expect(duration).toBeLessThan(3000);
          });

          it('should render large code snippet within 3 seconds', async () => {
               const lines = Array.from({ length: 50 }, (_, i) => `  const var${i} = ${i};`);
               const code = `function large() {\n${lines.join('\n')}\n}`;
               const startTime = Date.now();
               await service.renderCodeToImage(code, 'javascript', 'large.js', 'nord');
               const duration = Date.now() - startTime;

               expect(duration).toBeLessThan(3000);
          });
     });

     describe('Image Size Constraints', () => {
          it('should generate image under 5MB', async () => {
               const imageBuffer = await service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord');
               const sizeInMB = imageBuffer.length / (1024 * 1024);

               expect(sizeInMB).toBeLessThan(5);
          });

          it('should throw error if image exceeds 5MB', async () => {
               const sharp = require('sharp');
               const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

               sharp.mockReturnValueOnce({
                    png: jest.fn().mockReturnThis(),
                    resize: jest.fn().mockReturnThis(),
                    toBuffer: jest.fn().mockResolvedValue(largeBuffer)
               });

               await expect(
                    service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord')
               ).rejects.toThrow('exceeds 5MB limit');
          });
     });

     describe('Theme Support', () => {
          const code = 'const x = 42;';

          it('should render with nord theme', async () => {
               await service.renderCodeToImage(code, 'javascript', 'test.js', 'nord');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];
               expect(html).toContain('#667eea');
          });

          it('should render with dracula theme', async () => {
               await service.renderCodeToImage(code, 'javascript', 'test.js', 'dracula');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];
               expect(html).toContain('#ff79c6');
          });

          it('should render with github-dark theme', async () => {
               await service.renderCodeToImage(code, 'javascript', 'test.js', 'github-dark');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];
               expect(html).toContain('#434343');
          });
     });

     describe('Error Recovery and Resource Cleanup', () => {
          it('should handle empty code gracefully', async () => {
               const imageBuffer = await service.renderCodeToImage('', 'javascript', 'empty.js', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should handle very long file paths', async () => {
               const longPath = 'src/' + 'very/'.repeat(50) + 'file.js';
               const imageBuffer = await service.renderCodeToImage('const x = 42;', 'javascript', longPath, 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should handle code with special characters', async () => {
               const code = 'const html = "<div>Hello & goodbye</div>";';
               const imageBuffer = await service.renderCodeToImage(code, 'javascript', 'test.js', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should handle code with unicode characters', async () => {
               const code = 'const greeting = "Hello 世界 🌍";';
               const imageBuffer = await service.renderCodeToImage(code, 'javascript', 'test.js', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should maintain page pool after successful render', async () => {
               const initialPoolSize = service.getPoolSize();
               await service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord');
               const finalPoolSize = service.getPoolSize();

               expect(finalPoolSize).toBe(initialPoolSize);
          });

          it('should handle multiple concurrent renders', async () => {
               const promises = Array.from({ length: 5 }, (_, i) =>
                    service.renderCodeToImage('const x = 42;', 'javascript', `test${i}.js`, 'nord')
               );

               const results = await Promise.all(promises);
               results.forEach(buffer => expect(buffer).toBeInstanceOf(Buffer));
          });

          it('should handle screenshot failure gracefully', async () => {
               mockPage.screenshot.mockRejectedValueOnce(new Error('Screenshot failed'));

               await expect(
                    service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord')
               ).rejects.toThrow('Failed to render code to image');
          });
     });

     describe('Language Auto-Detection', () => {
          const code = 'const x = 42;';

          it('should detect language from file extension with dot', async () => {
               const imageBuffer = await service.renderCodeToImage(code, '.ts', 'test.ts', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should detect language from file extension without dot', async () => {
               const imageBuffer = await service.renderCodeToImage(code, 'ts', 'test.ts', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should handle uppercase extensions', async () => {
               const imageBuffer = await service.renderCodeToImage(code, 'TS', 'test.ts', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });

          it('should handle unknown languages gracefully', async () => {
               const imageBuffer = await service.renderCodeToImage(code, 'unknownlang', 'test.unknown', 'nord');
               expect(imageBuffer).toBeInstanceOf(Buffer);
          });
     });

     describe('HTML Template Generation', () => {
          it('should include Carbon.now.sh-style elements', async () => {
               await service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];

               expect(html).toContain('code-container');
               expect(html).toContain('code-header');
               expect(html).toContain('dot red');
               expect(html).toContain('dot yellow');
               expect(html).toContain('dot green');
          });

          it('should escape file path to prevent XSS', async () => {
               const maliciousPath = '<script>alert("xss")</script>';
               await service.renderCodeToImage('const x = 42;', 'javascript', maliciousPath, 'nord');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];

               expect(html).toContain('&lt;script&gt;');
               expect(html).not.toContain('<script>alert("xss")');
          });

          it('should include responsive CSS', async () => {
               await service.renderCodeToImage('const x = 42;', 'javascript', 'test.js', 'nord');
               const html = mockPage.setContent.mock.calls[mockPage.setContent.mock.calls.length - 1][0];

               expect(html).toContain('@media');
               expect(html).toContain('max-width: 768px');
          });
     });
});
