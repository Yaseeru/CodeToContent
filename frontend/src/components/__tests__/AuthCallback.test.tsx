import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AuthCallback from '../AuthCallback';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
     ...jest.requireActual('react-router-dom'),
     useNavigate: () => mockNavigate,
}));

describe('AuthCallback', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.clear();
     });

     it('handles successful OAuth callback', async () => {
          const mockToken = 'mock-jwt-token';
          mockedAxios.get.mockResolvedValueOnce({
               data: { token: mockToken }
          });

          render(
               <MemoryRouter initialEntries={['/auth/callback?code=test-code']}>
                    <AuthCallback />
               </MemoryRouter>
          );

          // Should show loading state initially
          expect(screen.getByText(/authenticating/i)).toBeInTheDocument();

          // Wait for the async operation to complete
          await waitFor(() => {
               expect(localStorage.setItem).toHaveBeenCalledWith('jwt', mockToken);
               expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
          });
     });

     it('displays error message when OAuth fails', async () => {
          mockedAxios.get.mockRejectedValueOnce({
               response: { data: { message: 'Invalid authorization code' } }
          });

          render(
               <MemoryRouter initialEntries={['/auth/callback?code=invalid-code']}>
                    <AuthCallback />
               </MemoryRouter>
          );

          // Wait for error to be displayed
          await waitFor(() => {
               expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
               expect(screen.getByText(/invalid authorization code/i)).toBeInTheDocument();
          });

          // Should show retry button
          const retryButton = screen.getByRole('button', { name: /try again/i });
          expect(retryButton).toBeInTheDocument();
     });

     it('handles OAuth error parameter', async () => {
          render(
               <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
                    <AuthCallback />
               </MemoryRouter>
          );

          // Wait for error to be displayed
          await waitFor(() => {
               expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
               expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
          });
     });

     it('handles missing authorization code', async () => {
          render(
               <MemoryRouter initialEntries={['/auth/callback']}>
                    <AuthCallback />
               </MemoryRouter>
          );

          // Wait for error to be displayed
          await waitFor(() => {
               expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
               expect(screen.getByText(/no authorization code received/i)).toBeInTheDocument();
          });
     });

     it('navigates to landing page when retry button is clicked', async () => {
          mockedAxios.get.mockRejectedValueOnce({
               response: { data: { message: 'Network error' } }
          });

          render(
               <MemoryRouter initialEntries={['/auth/callback?code=test-code']}>
                    <AuthCallback />
               </MemoryRouter>
          );

          // Wait for error to be displayed
          await waitFor(() => {
               expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
          });

          // Click retry button
          const retryButton = screen.getByRole('button', { name: /try again/i });
          retryButton.click();

          expect(mockNavigate).toHaveBeenCalledWith('/');
     });
});
