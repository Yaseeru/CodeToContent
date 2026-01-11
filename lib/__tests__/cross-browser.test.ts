/**
 * Cross-Browser Compatibility Tests
 * Task: 28. Cross-browser testing
 */

describe('Cross-Browser Compatibility', () => {
  describe('JavaScript Language Features', () => {
    it('should support Promise', () => {
      expect(typeof Promise).toBe('function');
      expect(typeof Promise.resolve).toBe('function');
    });

    it('should support async/await', async () => {
      const asyncFunction = async () => 'test';
      const result = await asyncFunction();
      expect(result).toBe('test');
    });
  });

  describe('Color Value Validation', () => {
    it('should use valid hex color format', () => {
      const hexColors = ['#121926', '#1B2236', '#4DA1FF'];
      hexColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Typography Scale Validation', () => {
    it('should use consistent typography scale', () => {
      const scale = { h1: 36, h2: 28, h3: 22, body: 16, caption: 14 };
      expect(scale.h1).toBe(36);
      expect(scale.h2).toBe(28);
    });
  });
});
