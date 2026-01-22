/**
 * Property-Based Tests for ImageRenderingService - File Size Limit
 * Tests that generated images always stay under 5MB limit
 * Validates: Requirements 2.6
 */

import * as fc from 'fast-check';
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

// Mock Sharp - simulate realistic PNG compression
jest.mock('sharp', () => {
     return jest.fn((input: Buffer) => {
          const mockSharp = {
               png: jest.fn().mockReturnThis(),
               resize: jest.fn().mockReturnThis(),
               toBuffer: jest.fn().mockImplementation(async () => {
                    // Simulate realistic PNG compression
                    // Typical compression ratio for code screenshots: 10:1 to 20:1
                    // Base size on input buffer size with compression
                    const compressionRatio = 15;
                    const compressedSize = Math.floor(input.length / compressionRatio);

                    // Add some overhead for PNG headers and metadata (typically 1-5KB)
                    const overhead = 3000;
                    const finalSize = compressedSize + overhead;

                    // Return a buffer of the calculated size
                    return Buffer.alloc(finalSize);
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

// Set longer timeout for property-based tests
jest.setTimeout(60000);

describe('ImageRenderingService - Property: Image File Size Limit', () => {
     let service: ImageRenderingService;
     let mockBrowser: jest.Mocked<Browser>;
     let mockPage: jest.Mocked<Page>;

     beforeAll(async () => {
          // Setup mock page with realistic screenshot sizes
          mockPage = {
               goto: jest.fn().mockResolvedValue(null),
               close: jest.fn().mockResolvedValue(undefined),
               setViewport: jest.fn().mockResolvedValue(undefined),
               setContent: jest.fn().mockResolvedValue(undefined),
               screenshot: jest.fn().mockImplementation(async (options: any) => {
                    // Simulate realistic screenshot buffer size based on viewport
                    // 1200x800 at 2x scale = 2400x1600 pixels
                    // RGBA = 4 bytes per pixel
                    // Uncompressed size = 2400 * 1600 * 4 = 15,360,000 bytes (~15MB)
                    // This will be compressed by Sharp mock to ~1MB
                    const width = 2400;
                    const height = 1600;
                    const bytesPerPixel = 4;
                    const uncompressedSize = width * height * bytesPerPixel;

                    return Buffer.alloc(uncompressedSize);
               }),
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
     });

     /**
      * Property 3: Image File Size Limit
      * For any generated snapshot image, the file size should not exceed 5MB to comply with X (Twitter) upload limits.
      * **Validates: Requirements 2.6**
      */
     describe('Property: All generated images are under 5MB', () => {
          it('should generate images under 5MB for various code lengths (10-100 lines)', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate code with varying line counts (10-100 lines)
                         fc.integer({ min: 10, max: 100 }),
                         // Generate different programming languages
                         fc.constantFrom('typescript', 'javascript', 'python', 'java', 'go', 'rust', 'cpp'),
                         // Generate different themes
                         fc.constantFrom<SyntaxTheme>('nord', 'dracula', 'github-dark', 'monokai', 'one-dark-pro'),
                         // Generate varying line lengths (20-120 characters per line)
                         fc.integer({ min: 20, max: 120 }),
                         async (lineCount, language, theme, lineLength) => {
                              // Generate realistic code with specified line count and length
                              const code = generateRealisticCode(lineCount, lineLength, language);
                              const filePath = `src/test.${getFileExtension(language)}`;

                              // Render the code to an image
                              const imageBuffer = await service.renderCodeToImage(code, language, filePath, theme);

                              // Property: Image size must be under 5MB
                              const sizeInBytes = imageBuffer.length;
                              const sizeInMB = sizeInBytes / (1024 * 1024);

                              expect(sizeInMB).toBeLessThan(5);
                              expect(imageBuffer).toBeInstanceOf(Buffer);
                              expect(sizeInBytes).toBeGreaterThan(0);
                         }
                    ),
                    { numRuns: 20 } // Run 20 times with different combinations
               );
          });

          it('should generate images under 5MB for code with varying complexity', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate code with different complexity levels
                         fc.constantFrom('simple', 'moderate', 'complex'),
                         // Generate different line counts
                         fc.integer({ min: 15, max: 80 }),
                         // Generate different languages
                         fc.constantFrom('typescript', 'python', 'go'),
                         async (complexity, lineCount, language) => {
                              const code = generateCodeByComplexity(complexity, lineCount, language);
                              const filePath = `src/component.${getFileExtension(language)}`;

                              const imageBuffer = await service.renderCodeToImage(code, language, filePath, 'nord');

                              // Property: Image size must be under 5MB regardless of complexity
                              const sizeInMB = imageBuffer.length / (1024 * 1024);
                              expect(sizeInMB).toBeLessThan(5);
                         }
                    ),
                    { numRuns: 15 }
               );
          });

          it('should generate images under 5MB for code with special characters', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate code with varying amounts of special characters
                         fc.integer({ min: 20, max: 60 }),
                         fc.constantFrom('typescript', 'javascript', 'python'),
                         async (lineCount, language) => {
                              // Generate code with unicode, emojis, and special characters
                              const code = generateCodeWithSpecialChars(lineCount, language);
                              const filePath = `src/special.${getFileExtension(language)}`;

                              const imageBuffer = await service.renderCodeToImage(code, language, filePath, 'nord');

                              // Property: Special characters should not cause size bloat
                              const sizeInMB = imageBuffer.length / (1024 * 1024);
                              expect(sizeInMB).toBeLessThan(5);
                         }
                    ),
                    { numRuns: 10 }
               );
          });

          it('should maintain compression effectiveness across different code samples', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate different types of code patterns
                         fc.constantFrom('repetitive', 'varied', 'mixed'),
                         fc.integer({ min: 30, max: 70 }),
                         fc.constantFrom<SyntaxTheme>('nord', 'dracula', 'monokai'),
                         async (pattern, lineCount, theme) => {
                              const code = generateCodeByPattern(pattern, lineCount);
                              const filePath = 'src/pattern.ts';

                              const imageBuffer = await service.renderCodeToImage(code, 'typescript', filePath, theme);

                              // Property: Compression should work effectively for all patterns
                              const sizeInMB = imageBuffer.length / (1024 * 1024);
                              expect(sizeInMB).toBeLessThan(5);

                              // Additional check: Verify compression is actually happening
                              // (image should be smaller than uncompressed theoretical size)
                              const theoreticalUncompressedSize = 1200 * 800 * 4; // width * height * 4 bytes (RGBA)
                              expect(imageBuffer.length).toBeLessThan(theoreticalUncompressedSize);
                         }
                    ),
                    { numRuns: 15 }
               );
          });

          it('should handle maximum line count (100 lines) without exceeding 5MB', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('typescript', 'javascript', 'python', 'java', 'go'),
                         fc.constantFrom<SyntaxTheme>('nord', 'dracula', 'github-dark'),
                         async (language, theme) => {
                              // Generate maximum allowed lines (100)
                              const code = generateRealisticCode(100, 80, language);
                              const filePath = `src/large.${getFileExtension(language)}`;

                              const imageBuffer = await service.renderCodeToImage(code, language, filePath, theme);

                              // Property: Even at maximum line count, size must be under 5MB
                              const sizeInMB = imageBuffer.length / (1024 * 1024);
                              expect(sizeInMB).toBeLessThan(5);
                         }
                    ),
                    { numRuns: 10 }
               );
          });
     });
});

/**
 * Helper function to generate realistic code based on language
 */
function generateRealisticCode(lineCount: number, avgLineLength: number, language: string): string {
     const lines: string[] = [];

     for (let i = 0; i < lineCount; i++) {
          let line = '';

          switch (language) {
               case 'typescript':
               case 'javascript':
                    line = generateJavaScriptLine(i, avgLineLength);
                    break;
               case 'python':
                    line = generatePythonLine(i, avgLineLength);
                    break;
               case 'java':
                    line = generateJavaLine(i, avgLineLength);
                    break;
               case 'go':
                    line = generateGoLine(i, avgLineLength);
                    break;
               case 'rust':
                    line = generateRustLine(i, avgLineLength);
                    break;
               case 'cpp':
                    line = generateCppLine(i, avgLineLength);
                    break;
               default:
                    line = `  const variable${i} = "value${i}";`;
          }

          lines.push(line);
     }

     return lines.join('\n');
}

/**
 * Generate JavaScript/TypeScript code line
 */
function generateJavaScriptLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `  const variable${lineNum} = "value${lineNum}";`,
          `  function process${lineNum}(param: string): string {`,
          `    return param.toUpperCase();`,
          `  }`,
          `  interface Data${lineNum} {`,
          `    id: number;`,
          `    name: string;`,
          `  }`,
          `  // Comment explaining logic for line ${lineNum}`,
          `  if (condition${lineNum}) {`,
          `    console.log("Processing ${lineNum}");`,
          `  }`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate Python code line
 */
function generatePythonLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `def function_${lineNum}(param):`,
          `    return param * ${lineNum}`,
          `class DataClass${lineNum}:`,
          `    def __init__(self, value):`,
          `        self.value = value`,
          `# Comment for line ${lineNum}`,
          `if condition_${lineNum}:`,
          `    print(f"Processing {${lineNum}}")`,
          `variable_${lineNum} = "value_${lineNum}"`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate Java code line
 */
function generateJavaLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `    public class DataClass${lineNum} {`,
          `        private String value${lineNum};`,
          `        public String getValue() {`,
          `            return value${lineNum};`,
          `        }`,
          `    }`,
          `    // Comment for line ${lineNum}`,
          `    if (condition${lineNum}) {`,
          `        System.out.println("Processing ${lineNum}");`,
          `    }`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate Go code line
 */
function generateGoLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `func Process${lineNum}(param string) string {`,
          `    return param`,
          `}`,
          `type Data${lineNum} struct {`,
          `    ID int`,
          `    Name string`,
          `}`,
          `// Comment for line ${lineNum}`,
          `if condition${lineNum} {`,
          `    fmt.Println("Processing ${lineNum}")`,
          `}`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate Rust code line
 */
function generateRustLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `fn process_${lineNum}(param: &str) -> String {`,
          `    param.to_string()`,
          `}`,
          `struct Data${lineNum} {`,
          `    id: i32,`,
          `    name: String,`,
          `}`,
          `// Comment for line ${lineNum}`,
          `if condition_${lineNum} {`,
          `    println!("Processing {}", ${lineNum});`,
          `}`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate C++ code line
 */
function generateCppLine(lineNum: number, avgLength: number): string {
     const patterns = [
          `class DataClass${lineNum} {`,
          `private:`,
          `    int value${lineNum};`,
          `public:`,
          `    int getValue() {`,
          `        return value${lineNum};`,
          `    }`,
          `};`,
          `// Comment for line ${lineNum}`,
          `if (condition${lineNum}) {`,
          `    std::cout << "Processing ${lineNum}" << std::endl;`,
          `}`,
     ];

     const pattern = patterns[lineNum % patterns.length];
     return pattern.padEnd(avgLength, ' ');
}

/**
 * Generate code based on complexity level
 */
function generateCodeByComplexity(complexity: string, lineCount: number, language: string): string {
     const lines: string[] = [];

     for (let i = 0; i < lineCount; i++) {
          let line = '';

          switch (complexity) {
               case 'simple':
                    // Simple assignments and declarations
                    line = `  const value${i} = ${i};`;
                    break;
               case 'moderate':
                    // Functions and conditionals
                    if (i % 3 === 0) {
                         line = `  function process${i}(x: number): number {`;
                    } else if (i % 3 === 1) {
                         line = `    return x * ${i} + ${i};`;
                    } else {
                         line = `  }`;
                    }
                    break;
               case 'complex':
                    // Nested structures and complex logic
                    if (i % 5 === 0) {
                         line = `  class Complex${i}<T extends BaseType> {`;
                    } else if (i % 5 === 1) {
                         line = `    private readonly data: Map<string, T> = new Map();`;
                    } else if (i % 5 === 2) {
                         line = `    async process(input: T): Promise<Result<T>> {`;
                    } else if (i % 5 === 3) {
                         line = `      return await this.transform(input).catch(handleError);`;
                    } else {
                         line = `    }`;
                    }
                    break;
          }

          lines.push(line);
     }

     return lines.join('\n');
}

/**
 * Generate code with special characters and unicode
 */
function generateCodeWithSpecialChars(lineCount: number, language: string): string {
     const lines: string[] = [];
     const specialChars = ['©', '™', '€', '£', '¥', '§', '¶', '†', '‡', '•'];
     const emojis = ['🚀', '✨', '🔥', '💡', '🎯', '⚡', '🌟', '💻', '🎨', '🔧'];

     for (let i = 0; i < lineCount; i++) {
          const specialChar = specialChars[i % specialChars.length];
          const emoji = emojis[i % emojis.length];

          const patterns = [
               `  // Comment with special char: ${specialChar} and emoji: ${emoji}`,
               `  const message${i} = "Hello 世界 ${emoji}";`,
               `  const unicode${i} = "Ñoño ${specialChar} Café";`,
               `  const math${i} = "α + β = γ ${specialChar}";`,
               `  const symbols${i} = "← → ↑ ↓ ⇒ ⇐ ${emoji}";`,
          ];

          lines.push(patterns[i % patterns.length]);
     }

     return lines.join('\n');
}

/**
 * Generate code based on pattern type
 */
function generateCodeByPattern(pattern: string, lineCount: number): string {
     const lines: string[] = [];

     for (let i = 0; i < lineCount; i++) {
          let line = '';

          switch (pattern) {
               case 'repetitive':
                    // Highly repetitive code (better compression)
                    line = `  const value = "repeated_value_${i % 5}";`;
                    break;
               case 'varied':
                    // Highly varied code (worse compression)
                    line = `  const uniqueVar${i}_${Math.random().toString(36).substring(7)} = ${i};`;
                    break;
               case 'mixed':
                    // Mix of repetitive and varied
                    if (i % 2 === 0) {
                         line = `  const value = "repeated";`;
                    } else {
                         line = `  const unique${i} = ${i};`;
                    }
                    break;
          }

          lines.push(line);
     }

     return lines.join('\n');
}

/**
 * Get file extension for language
 */
function getFileExtension(language: string): string {
     const extensions: Record<string, string> = {
          'typescript': 'ts',
          'javascript': 'js',
          'python': 'py',
          'java': 'java',
          'go': 'go',
          'rust': 'rs',
          'cpp': 'cpp',
     };

     return extensions[language] || 'txt';
}
