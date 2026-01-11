'use client';

import { useState } from 'react';
import { CommandBar } from '@/components/ui/CommandBar';

/**
 * Demo page for CommandBar component
 * This page demonstrates the CommandBar functionality including:
 * - Search input with keyboard focus (/ key)
 * - Theme toggle integration
 * - Flat styling with subtle border
 */
export default function CommandBarDemoPage() {
     const [searchResults, setSearchResults] = useState<string[]>([]);
     const [searchQuery, setSearchQuery] = useState('');

     // Mock data for fuzzy search demonstration
     const mockData = [
          'my-awesome-repo',
          'react-project',
          'typescript-utils',
          'next-app-starter',
          'commit: Add new feature',
          'commit: Fix bug in authentication',
          'commit: Update dependencies',
          'action: Generate README',
          'action: Create documentation',
          'action: Export content',
     ];

     // Simple fuzzy search implementation
     const handleSearch = (query: string) => {
          setSearchQuery(query);

          if (!query.trim()) {
               setSearchResults([]);
               return;
          }

          // Simple fuzzy matching: check if all characters appear in order
          const results = mockData.filter(item => {
               const lowerItem = item.toLowerCase();
               const lowerQuery = query.toLowerCase();
               let queryIndex = 0;

               for (let i = 0; i < lowerItem.length && queryIndex < lowerQuery.length; i++) {
                    if (lowerItem[i] === lowerQuery[queryIndex]) {
                         queryIndex++;
                    }
               }

               return queryIndex === lowerQuery.length;
          });

          setSearchResults(results);
     };

     return (
          <div className="min-h-screen bg-bg-app">
               {/* Command Bar */}
               <CommandBar onSearch={handleSearch} />

               {/* Demo Content */}
               <div className="max-w-4xl mx-auto px-lg py-xl">
                    <div className="space-y-xl">
                         {/* Header */}
                         <div>
                              <h1 className="text-lg font-semibold text-text-primary mb-sm">
                                   Command Bar Demo
                              </h1>
                              <p className="text-sm text-text-secondary">
                                   Press <kbd className="px-sm py-xs border border-border-subtle rounded-button text-xs">
                                        /
                                   </kbd> to focus the search bar. Press <kbd className="px-sm py-xs border border-border-subtle rounded-button text-xs">
                                        Escape
                                   </kbd> to clear and blur.
                              </p>
                         </div>

                         {/* Features List */}
                         <div className="bg-bg-panel border border-border-subtle rounded-panel p-lg">
                              <h2 className="text-base font-medium text-text-primary mb-md">
                                   Features
                              </h2>
                              <ul className="space-y-sm text-sm text-text-secondary">
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>48px height with flat styling</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>Keyboard focus with / key</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>Fuzzy search across repos, commits, actions</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>Escape key to clear and blur</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>Integrated theme toggle</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>Subtle border bottom</span>
                                   </li>
                                   <li className="flex items-start gap-sm">
                                        <span className="text-accent-neutral">•</span>
                                        <span>No transitions or animations (instant)</span>
                                   </li>
                              </ul>
                         </div>

                         {/* Search Results */}
                         {searchQuery && (
                              <div className="bg-bg-panel border border-border-subtle rounded-panel p-lg">
                                   <h2 className="text-base font-medium text-text-primary mb-md">
                                        Search Results
                                        {searchResults.length > 0 && (
                                             <span className="text-sm font-regular text-text-muted ml-sm">
                                                  ({searchResults.length})
                                             </span>
                                        )}
                                   </h2>

                                   {searchResults.length > 0 ? (
                                        <ul className="space-y-sm">
                                             {searchResults.map((result, index) => (
                                                  <li
                                                       key={index}
                                                       className="px-md py-sm bg-bg-elevated rounded-list text-sm text-text-primary hover:bg-accent-neutral hover:bg-opacity-5 transition-none"
                                                  >
                                                       {result}
                                                  </li>
                                             ))}
                                        </ul>
                                   ) : (
                                        <p className="text-sm text-text-muted">
                                             No results found for &quot;{searchQuery}&quot;
                                        </p>
                                   )}
                              </div>
                         )}

                         {/* Mock Data Display */}
                         {!searchQuery && (
                              <div className="bg-bg-panel border border-border-subtle rounded-panel p-lg">
                                   <h2 className="text-base font-medium text-text-primary mb-md">
                                        Available Items (Mock Data)
                                   </h2>
                                   <ul className="space-y-sm">
                                        {mockData.map((item, index) => (
                                             <li
                                                  key={index}
                                                  className="px-md py-sm bg-bg-elevated rounded-list text-sm text-text-secondary"
                                             >
                                                  {item}
                                             </li>
                                        ))}
                                   </ul>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
