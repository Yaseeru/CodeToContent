import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import axios from 'axios';
import RepositoryList from '../RepositoryList';
import SearchBar from '../SearchBar';

// Feature: code-to-content, Property 5: Search Filtering
// Validates: Requirements 2.3

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SearchBar - Property 5: Search Filtering', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('token', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     it('should filter repositories based on search query (case-insensitive)', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              id: fc.uuid(),
                              name: fc.string({ minLength: 1, maxLength: 50 }),
                              fullName: fc.string({ minLength: 1, maxLength: 100 }),
                              description: fc.string({ maxLength: 200 }),
                              url: fc.webUrl(),
                         }),
                         { minLength: 1, maxLength: 10 }
                    ),
                    fc.string({ maxLength: 20 }),
                    async (repositories, searchQuery) => {
                         // Mock API response
                         mockedAxios.get.mockResolvedValueOnce({
                              data: { repositories },
                         });

                         // Render components
                         const { container } = render(
                              <div>
                                   <RepositoryList searchQuery={searchQuery} />
                              </div>
                         );

                         // Wait for repositories to load
                         await new Promise(resolve => setTimeout(resolve, 100));

                         // Calculate expected filtered repositories
                         const query = searchQuery.toLowerCase();
                         const expectedFiltered = repositories.filter((repo) => {
                              if (!searchQuery) return true;
                              return (
                                   repo.name.toLowerCase().includes(query) ||
                                   repo.fullName.toLowerCase().includes(query) ||
                                   repo.description.toLowerCase().includes(query)
                              );
                         });

                         // Verify filtered results
                         if (expectedFiltered.length === 0) {
                              expect(screen.getByText('No repositories match your search')).toBeInTheDocument();
                         } else {
                              // Check that all expected repositories are displayed
                              expectedFiltered.forEach((repo) => {
                                   expect(screen.getByText(repo.name)).toBeInTheDocument();
                              });

                              // Check that filtered-out repositories are NOT displayed
                              const filteredOut = repositories.filter(
                                   (repo) => !expectedFiltered.includes(repo)
                              );
                              filteredOut.forEach((repo) => {
                                   // Only check if the name is unique enough to not appear in other repos
                                   if (repo.name.length > 5) {
                                        expect(screen.queryByText(repo.name)).not.toBeInTheDocument();
                                   }
                              });
                         }
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should update filtered results in real-time as user types', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              id: fc.uuid(),
                              name: fc.constantFrom('react-app', 'vue-project', 'angular-demo', 'node-server'),
                              fullName: fc.string({ minLength: 1, maxLength: 100 }),
                              description: fc.string({ maxLength: 200 }),
                              url: fc.webUrl(),
                         }),
                         { minLength: 4, maxLength: 4 }
                    ),
                    async (repositories) => {
                         // Mock API response
                         mockedAxios.get.mockResolvedValueOnce({
                              data: { repositories },
                         });

                         // Create a controlled component wrapper
                         const TestWrapper = () => {
                              const [searchQuery, setSearchQuery] = React.useState('');
                              return (
                                   <div>
                                        <SearchBar value={searchQuery} onChange={setSearchQuery} />
                                        <RepositoryList searchQuery={searchQuery} />
                                   </div>
                              );
                         };

                         const user = userEvent.setup();
                         render(<TestWrapper />);

                         // Wait for repositories to load
                         await new Promise(resolve => setTimeout(resolve, 100));

                         // Type 'react' in search bar
                         const searchInput = screen.getByPlaceholderText('Search repositories...');
                         await user.type(searchInput, 'react');

                         // Verify only 'react-app' is visible
                         const reactRepo = repositories.find(r => r.name === 'react-app');
                         if (reactRepo) {
                              expect(screen.getByText('react-app')).toBeInTheDocument();
                         }

                         // Verify other repos are not visible
                         const otherRepos = repositories.filter(r => r.name !== 'react-app');
                         otherRepos.forEach((repo) => {
                              expect(screen.queryByText(repo.name)).not.toBeInTheDocument();
                         });
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should handle empty search query by showing all repositories', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              id: fc.uuid(),
                              name: fc.string({ minLength: 1, maxLength: 50 }),
                              fullName: fc.string({ minLength: 1, maxLength: 100 }),
                              description: fc.string({ maxLength: 200 }),
                              url: fc.webUrl(),
                         }),
                         { minLength: 1, maxLength: 10 }
                    ),
                    async (repositories) => {
                         // Mock API response
                         mockedAxios.get.mockResolvedValueOnce({
                              data: { repositories },
                         });

                         // Render with empty search query
                         render(<RepositoryList searchQuery="" />);

                         // Wait for repositories to load
                         await new Promise(resolve => setTimeout(resolve, 100));

                         // Verify all repositories are displayed
                         repositories.forEach((repo) => {
                              expect(screen.getByText(repo.name)).toBeInTheDocument();
                         });
                    }
               ),
               { numRuns: 100 }
          );
     });
});
