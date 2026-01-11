/**
 * Color Contrast Verification Script
 * 
 * Verifies that all text/background color combinations in both dark and light modes
 * meet WCAG AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text).
 */

import { darkMode, lightMode } from '../lib/design-tokens';
import { verifyThemeContrast, formatContrastRatio, type ColorCombination } from '../lib/color-contrast';

function printResults(themeName: string, results: ColorCombination[]) {
     console.log(`\n${'='.repeat(60)}`);
     console.log(`${themeName.toUpperCase()} MODE - Color Contrast Verification`);
     console.log('='.repeat(60));

     const failures = results.filter(r => !r.passes);
     const passes = results.filter(r => r.passes);

     console.log(`\n✓ Passing: ${passes.length}/${results.length}`);
     console.log(`✗ Failing: ${failures.length}/${results.length}`);

     if (failures.length > 0) {
          console.log('\n❌ FAILED COMBINATIONS:');
          console.log('-'.repeat(60));
          failures.forEach(combo => {
               console.log(`\n  ${combo.name}`);
               console.log(`    Foreground: ${combo.foreground}`);
               console.log(`    Background: ${combo.background}`);
               console.log(`    Ratio: ${formatContrastRatio(combo.ratio)} (Required: ${combo.isLargeText ? '3.0:1' : '4.5:1'})`);
               console.log(`    Grade: ${combo.grade}`);
          });
     }

     console.log('\n✅ PASSING COMBINATIONS:');
     console.log('-'.repeat(60));
     passes.forEach(combo => {
          console.log(`  ✓ ${combo.name.padEnd(30)} ${formatContrastRatio(combo.ratio).padStart(8)} [${combo.grade}]`);
     });
}

function main() {
     console.log('\n🎨 WCAG AA Color Contrast Verification');
     console.log('Checking all text/background combinations...\n');

     // Verify dark mode
     const darkResults = verifyThemeContrast(darkMode);
     printResults('Dark', darkResults);

     // Verify light mode
     const lightResults = verifyThemeContrast(lightMode);
     printResults('Light', lightResults);

     // Summary
     const totalTests = darkResults.length + lightResults.length;
     const totalFailures = darkResults.filter(r => !r.passes).length + lightResults.filter(r => !r.passes).length;

     console.log(`\n${'='.repeat(60)}`);
     console.log('SUMMARY');
     console.log('='.repeat(60));
     console.log(`Total combinations tested: ${totalTests}`);
     console.log(`Total failures: ${totalFailures}`);
     console.log(`Overall status: ${totalFailures === 0 ? '✅ PASS' : '❌ FAIL'}`);
     console.log('='.repeat(60));

     // Exit with error code if there are failures
     if (totalFailures > 0) {
          process.exit(1);
     }
}

main();
