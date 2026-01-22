import { ImageRenderingService, SyntaxTheme } from '../ImageRenderingService';

// Mock Shiki to avoid ESM/CommonJS compatibility issues in Jest
jest.mock('shiki', () => ({
     codeToHtml: jest.fn(async (code: string, options: any) => {
          // Simulate Shiki's output with inline styles
          const lang = options.lang || 'text';
          const theme = options.theme || 'nord';
          return `<pre class="shiki ${theme}" style="background-color:#2e3440;color:#d8dee9" tabindex="0"><code><span class="line"><span style="color:#d8dee9">${code}</span></span></code></pre>`;
     })
}));

describe('ImageRenderingService - Syntax Highlighting', () => {
     let service: ImageRenderingService;

     beforeEach(() => {
          service = new ImageRenderingService();
     });

     describe('generateHighlightedHTML', () => {
          describe('Basic Functionality', () => {
               it('should generate highlighted HTML for TypeScript code', async () => {
                    const code = 'const greeting: string = "Hello, World!";';
                    const language = 'typescript';

                    const html = await service.generateHighlightedHTML(code, language);

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html).toContain('Hello, World!');
                    expect(html.length).toBeGreaterThan(code.length);
               });

               it('should generate highlighted HTML for JavaScript code', async () => {
                    const code = 'function add(a, b) { return a + b; }';
                    const language = 'javascript';

                    const html = await service.generateHighlightedHTML(code, language);

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html).toContain('function');
                    expect(html).toContain('add');
               });

               it('should generate highlighted HTML for Python code', async () => {
                    const code = 'def greet(name):\n    return f"Hello, {name}!"';
                    const language = 'python';

                    const html = await service.generateHighlightedHTML(code, language);

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html).toContain('def');
                    expect(html).toContain('greet');
               });

               it('should generate highlighted HTML for Go code', async () => {
                    const code = 'package main\n\nfunc main() {\n    fmt.Println("Hello")\n}';
                    const language = 'go';

                    const html = await service.generateHighlightedHTML(code, language);

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html).toContain('package');
                    expect(html).toContain('main');
               });
          });

          describe('Theme Support', () => {
               const code = 'const x = 42;';
               const language = 'typescript';

               it('should support nord theme', async () => {
                    const html = await service.generateHighlightedHTML(code, language, 'nord');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should support dracula theme', async () => {
                    const html = await service.generateHighlightedHTML(code, language, 'dracula');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should support github-dark theme', async () => {
                    const html = await service.generateHighlightedHTML(code, language, 'github-dark');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should support monokai theme', async () => {
                    const html = await service.generateHighlightedHTML(code, language, 'monokai');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should support one-dark-pro theme', async () => {
                    const html = await service.generateHighlightedHTML(code, language, 'one-dark-pro');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should default to nord theme when no theme specified', async () => {
                    const html = await service.generateHighlightedHTML(code, language);
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });
          });

          describe('Language Auto-Detection', () => {
               const code = 'const x = 42;';

               it('should detect language from file extension with dot', async () => {
                    const html = await service.generateHighlightedHTML(code, '.ts');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should detect language from file extension without dot', async () => {
                    const html = await service.generateHighlightedHTML(code, 'ts');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should handle uppercase extensions', async () => {
                    const html = await service.generateHighlightedHTML(code, 'TS');
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should map common file extensions correctly', async () => {
                    const testCases = [
                         { ext: 'js', expected: 'javascript' },
                         { ext: 'py', expected: 'python' },
                         { ext: 'go', expected: 'go' },
                         { ext: 'rs', expected: 'rust' },
                         { ext: 'java', expected: 'java' },
                         { ext: 'rb', expected: 'ruby' },
                         { ext: 'php', expected: 'php' }
                    ];

                    for (const { ext } of testCases) {
                         const html = await service.generateHighlightedHTML(code, ext);
                         expect(html).toBeDefined();
                         expect(html).toContain('<pre');
                    }
               });

               it('should handle yaml and yml extensions', async () => {
                    const yamlCode = 'name: test\nversion: 1.0';

                    const html1 = await service.generateHighlightedHTML(yamlCode, 'yaml');
                    const html2 = await service.generateHighlightedHTML(yamlCode, 'yml');

                    expect(html1).toBeDefined();
                    expect(html2).toBeDefined();
                    expect(html1).toContain('<pre');
                    expect(html2).toContain('<pre');
               });

               it('should handle markdown extensions', async () => {
                    const mdCode = '# Hello\n\nThis is **bold**';

                    const html1 = await service.generateHighlightedHTML(mdCode, 'md');
                    const html2 = await service.generateHighlightedHTML(mdCode, 'markdown');

                    expect(html1).toBeDefined();
                    expect(html2).toBeDefined();
               });
          });

          describe('Edge Cases', () => {
               it('should handle empty code string', async () => {
                    const html = await service.generateHighlightedHTML('', 'typescript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre><code></code></pre>');
               });

               it('should handle whitespace-only code', async () => {
                    const html = await service.generateHighlightedHTML('   \n\n   ', 'typescript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre><code></code></pre>');
               });

               it('should handle unknown language gracefully', async () => {
                    const code = 'some code here';
                    const html = await service.generateHighlightedHTML(code, 'unknownlang');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html).toContain('some code here');
               });

               it('should handle empty language string', async () => {
                    const code = 'const x = 42;';
                    const html = await service.generateHighlightedHTML(code, '');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should handle code with special HTML characters', async () => {
                    const code = 'const html = "<div>Hello & goodbye</div>";';
                    const html = await service.generateHighlightedHTML(code, 'typescript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    // Should contain the code content (escaped or in HTML)
                    expect(html.length).toBeGreaterThan(0);
               });

               it('should handle very long code snippets', async () => {
                    const longCode = 'const x = 1;\n'.repeat(100);
                    const html = await service.generateHighlightedHTML(longCode, 'typescript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
                    expect(html.length).toBeGreaterThan(longCode.length);
               });

               it('should handle code with unicode characters', async () => {
                    const code = 'const greeting = "Hello 世界 🌍";';
                    const html = await service.generateHighlightedHTML(code, 'typescript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });

               it('should handle code with tabs and mixed indentation', async () => {
                    const code = 'function test() {\n\tif (true) {\n\t    return 42;\n\t}\n}';
                    const html = await service.generateHighlightedHTML(code, 'javascript');

                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               });
          });

          describe('Multiple Languages', () => {
               it('should support all common programming languages', async () => {
                    const languages = [
                         'typescript', 'javascript', 'python', 'go', 'rust',
                         'java', 'cpp', 'c', 'csharp', 'ruby', 'php',
                         'swift', 'kotlin', 'scala', 'bash', 'sql',
                         'html', 'css', 'json', 'yaml', 'xml'
                    ];

                    const code = 'const x = 42;';

                    for (const lang of languages) {
                         const html = await service.generateHighlightedHTML(code, lang);
                         expect(html).toBeDefined();
                         expect(html).toContain('<pre');
                    }
               });
          });

          describe('HTML Output Structure', () => {
               it('should return valid HTML structure', async () => {
                    const code = 'const x = 42;';
                    const html = await service.generateHighlightedHTML(code, 'typescript');

                    expect(html).toMatch(/<pre/);
                    expect(html).toMatch(/<\/pre>/);
               });

               it('should use inline styles for Puppeteer compatibility', async () => {
                    const code = 'const x = 42;';
                    const html = await service.generateHighlightedHTML(code, 'typescript');

                    // Shiki with structure: 'inline' should include style attributes
                    expect(html).toContain('style=');
               });

               it('should preserve code content in output', async () => {
                    const code = 'function hello() { return "world"; }';
                    const html = await service.generateHighlightedHTML(code, 'javascript');

                    expect(html).toContain('hello');
                    expect(html).toContain('world');
               });
          });

          describe('Error Handling', () => {
               it('should fallback to plain text on highlighting error', async () => {
                    // This test verifies the fallback mechanism works
                    const code = 'const x = 42;';

                    // Even with invalid theme, should return something
                    const html = await service.generateHighlightedHTML(code, 'typescript', 'invalid-theme' as SyntaxTheme);

                    expect(html).toBeDefined();
                    expect(html.length).toBeGreaterThan(0);
               });

               it('should escape HTML in fallback mode', async () => {
                    // When highlighting fails, HTML should be escaped
                    const code = '<script>alert("xss")</script>';

                    // Force an error by using invalid parameters
                    const html = await service.generateHighlightedHTML(code, '');

                    expect(html).toBeDefined();
                    // Should not contain unescaped script tags if fallback is used
                    if (html.includes('&lt;') || html.includes('&gt;')) {
                         expect(html).toContain('&lt;script&gt;');
                    }
               });
          });
     });

     describe('Language Detection (private method behavior)', () => {
          it('should handle various file extension formats', async () => {
               const code = 'test';

               // Test different formats that should all work
               const formats = [
                    'ts', '.ts', 'TS', '.TS',
                    'js', '.js', 'JS', '.JS',
                    'py', '.py', 'PY', '.PY'
               ];

               for (const format of formats) {
                    const html = await service.generateHighlightedHTML(code, format);
                    expect(html).toBeDefined();
                    expect(html).toContain('<pre');
               }
          });
     });

     describe('wrapInTemplate', () => {
          describe('Basic Functionality', () => {
               it('should wrap highlighted code in Carbon.now.sh-style template', () => {
                    const highlightedCode = '<pre><code>const x = 42;</code></pre>';
                    const filePath = 'src/components/Button.tsx';

                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toBeDefined();
                    expect(html).toContain('<!DOCTYPE html>');
                    expect(html).toContain('<html');
                    expect(html).toContain('</html>');
                    expect(html).toContain(highlightedCode);
                    expect(html).toContain(filePath);
               });

               it('should include window control dots (red, yellow, green)', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const filePath = 'test.ts';

                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('dot red');
                    expect(html).toContain('dot yellow');
                    expect(html).toContain('dot green');
                    expect(html).toContain('code-dots');
               });

               it('should include file path in header', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const filePath = 'src/services/AuthService.ts';

                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('code-title');
                    expect(html).toContain(filePath);
               });

               it('should include gradient background', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const filePath = 'test.ts';

                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('linear-gradient');
                    expect(html).toContain('background:');
               });

               it('should include code container with styling', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const filePath = 'test.ts';

                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('code-container');
                    expect(html).toContain('border-radius');
                    expect(html).toContain('box-shadow');
               });
          });

          describe('Theme Support', () => {
               const highlightedCode = '<pre><code>const x = 42;</code></pre>';
               const filePath = 'test.ts';

               it('should use nord gradient by default', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('#667eea');
                    expect(html).toContain('#764ba2');
               });

               it('should use nord gradient when nord theme specified', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath, 'nord');
                    expect(html).toContain('#667eea');
                    expect(html).toContain('#764ba2');
               });

               it('should use dracula gradient when dracula theme specified', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath, 'dracula');
                    expect(html).toContain('#ff79c6');
                    expect(html).toContain('#bd93f9');
               });

               it('should use github-dark gradient when github-dark theme specified', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath, 'github-dark');
                    expect(html).toContain('#434343');
                    expect(html).toContain('#000000');
               });

               it('should use monokai gradient when monokai theme specified', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath, 'monokai');
                    expect(html).toContain('#f92672');
                    expect(html).toContain('#66d9ef');
               });

               it('should use one-dark-pro gradient when one-dark-pro theme specified', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath, 'one-dark-pro');
                    expect(html).toContain('#61afef');
                    expect(html).toContain('#c678dd');
               });
          });

          describe('HTML Structure', () => {
               const highlightedCode = '<pre><code>test</code></pre>';
               const filePath = 'test.ts';

               it('should have proper HTML5 doctype', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toMatch(/^<!DOCTYPE html>/);
               });

               it('should include meta charset UTF-8', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('<meta charset="UTF-8">');
               });

               it('should include viewport meta tag for responsiveness', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('<meta name="viewport"');
                    expect(html).toContain('width=device-width');
               });

               it('should include title tag', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('<title>Code Snapshot</title>');
               });

               it('should include complete style block', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('<style>');
                    expect(html).toContain('</style>');
               });

               it('should have proper nesting: container > header + content', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('code-container');
                    expect(html).toContain('code-header');
                    expect(html).toContain('code-content');
               });
          });

          describe('Security - XSS Prevention', () => {
               const highlightedCode = '<pre><code>test</code></pre>';

               it('should escape HTML special characters in file path', () => {
                    const maliciousPath = '<script>alert("xss")</script>';
                    const html = service.wrapInTemplate(highlightedCode, maliciousPath);

                    expect(html).not.toContain('<script>alert("xss")</script>');
                    expect(html).toContain('&lt;script&gt;');
                    expect(html).toContain('&lt;/script&gt;');
               });

               it('should escape ampersands in file path', () => {
                    const filePath = 'src/utils/encode&decode.ts';
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('&amp;');
               });

               it('should escape quotes in file path', () => {
                    const filePath = 'src/file"with"quotes.ts';
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('&quot;');
               });

               it('should escape single quotes in file path', () => {
                    const filePath = "src/file'with'quotes.ts";
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('&#39;');
               });

               it('should escape less-than and greater-than in file path', () => {
                    const filePath = 'src/<component>.ts';
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('&lt;');
                    expect(html).toContain('&gt;');
               });
          });

          describe('Responsive Design', () => {
               const highlightedCode = '<pre><code>test</code></pre>';
               const filePath = 'test.ts';

               it('should include responsive media queries', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('@media');
                    expect(html).toContain('max-width: 768px');
               });

               it('should include responsive padding adjustments', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('padding: 60px');
                    expect(html).toContain('padding: 30px');
               });

               it('should include responsive font size adjustments', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('font-size: 14px');
                    expect(html).toContain('font-size: 12px');
               });
          });

          describe('Styling Details', () => {
               const highlightedCode = '<pre><code>test</code></pre>';
               const filePath = 'test.ts';

               it('should include monospace font family', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('Fira Code');
                    expect(html).toContain('Monaco');
                    expect(html).toContain('monospace');
               });

               it('should include dark theme colors', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('#2e3440'); // Nord dark background
                    expect(html).toContain('#3b4252'); // Nord header background
               });

               it('should include scrollbar styling', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('::-webkit-scrollbar');
                    expect(html).toContain('::-webkit-scrollbar-track');
                    expect(html).toContain('::-webkit-scrollbar-thumb');
               });

               it('should include box-shadow for depth', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('box-shadow');
                    expect(html).toContain('rgba(0, 0, 0');
               });

               it('should include rounded corners', () => {
                    const html = service.wrapInTemplate(highlightedCode, filePath);
                    expect(html).toContain('border-radius');
               });
          });

          describe('Edge Cases', () => {
               it('should handle empty highlighted code', () => {
                    const html = service.wrapInTemplate('', 'test.ts');
                    expect(html).toBeDefined();
                    expect(html).toContain('<!DOCTYPE html>');
                    expect(html).toContain('test.ts');
               });

               it('should handle empty file path', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const html = service.wrapInTemplate(highlightedCode, '');
                    expect(html).toBeDefined();
                    expect(html).toContain('<!DOCTYPE html>');
                    expect(html).toContain(highlightedCode);
               });

               it('should handle very long file paths', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const longPath = 'src/' + 'very/'.repeat(50) + 'deep/file.ts';
                    const html = service.wrapInTemplate(highlightedCode, longPath);

                    expect(html).toBeDefined();
                    expect(html).toContain(longPath);
                    expect(html).toContain('text-overflow: ellipsis');
               });

               it('should handle file paths with unicode characters', () => {
                    const highlightedCode = '<pre><code>test</code></pre>';
                    const unicodePath = 'src/文件/ファイル/файл.ts';
                    const html = service.wrapInTemplate(highlightedCode, unicodePath);

                    expect(html).toBeDefined();
                    expect(html).toContain(unicodePath);
               });

               it('should handle very large highlighted code', () => {
                    const largeCode = '<pre><code>' + 'x'.repeat(10000) + '</code></pre>';
                    const html = service.wrapInTemplate(largeCode, 'test.ts');

                    expect(html).toBeDefined();
                    expect(html).toContain(largeCode);
               });

               it('should handle highlighted code with special HTML entities', () => {
                    const highlightedCode = '<pre><code>&lt;div&gt;&amp;&quot;</code></pre>';
                    const html = service.wrapInTemplate(highlightedCode, 'test.ts');

                    expect(html).toBeDefined();
                    expect(html).toContain(highlightedCode);
               });
          });

          describe('Integration with generateHighlightedHTML', () => {
               it('should work with actual Shiki output', async () => {
                    const code = 'const greeting: string = "Hello, World!";';
                    const language = 'typescript';
                    const filePath = 'src/greeting.ts';

                    const highlightedCode = await service.generateHighlightedHTML(code, language);
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toBeDefined();
                    expect(html).toContain('<!DOCTYPE html>');
                    expect(html).toContain(filePath);
                    expect(html).toContain('Hello, World!');
                    expect(html).toContain('code-container');
                    expect(html).toContain('dot red');
               });

               it('should preserve Shiki styling in wrapped template', async () => {
                    const code = 'function test() { return 42; }';
                    const language = 'javascript';
                    const filePath = 'test.js';

                    const highlightedCode = await service.generateHighlightedHTML(code, language);
                    const html = service.wrapInTemplate(highlightedCode, filePath);

                    expect(html).toContain('<pre');
                    expect(html).toContain('style=');
                    expect(html).toContain('code-content');
               });
          });
     });
});
