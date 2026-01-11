import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
     beforeEach(() => {
          localStorage.clear();
     });

     it('renders children when valid JWT exists', () => {
          // Mock a valid JWT (3 parts separated by dots)
          (localStorage.getItem as jest.Mock).mockReturnValueOnce('header.payload.signature');

          render(
               <MemoryRouter initialEntries={['/protected']}>
                    <Routes>
                         <Route
                              path="/protected"
                              element={
                                   <ProtectedRoute>
                                        <div>Protected Content</div>
                                   </ProtectedRoute>
                              }
                         />
                         <Route path="/" element={<div>Landing Page</div>} />
                    </Routes>
               </MemoryRouter>
          );

          expect(screen.getByText('Protected Content')).toBeInTheDocument();
          expect(screen.queryByText('Landing Page')).not.toBeInTheDocument();
     });

     it('redirects to landing page when JWT does not exist', () => {
          (localStorage.getItem as jest.Mock).mockReturnValueOnce(null);

          render(
               <MemoryRouter initialEntries={['/protected']}>
                    <Routes>
                         <Route
                              path="/protected"
                              element={
                                   <ProtectedRoute>
                                        <div>Protected Content</div>
                                   </ProtectedRoute>
                              }
                         />
                         <Route path="/" element={<div>Landing Page</div>} />
                    </Routes>
               </MemoryRouter>
          );

          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
          expect(screen.getByText('Landing Page')).toBeInTheDocument();
     });

     it('redirects to landing page when JWT is invalid', () => {
          // Mock an invalid JWT (not 3 parts)
          (localStorage.getItem as jest.Mock).mockReturnValueOnce('invalid-token');

          render(
               <MemoryRouter initialEntries={['/protected']}>
                    <Routes>
                         <Route
                              path="/protected"
                              element={
                                   <ProtectedRoute>
                                        <div>Protected Content</div>
                                   </ProtectedRoute>
                              }
                         />
                         <Route path="/" element={<div>Landing Page</div>} />
                    </Routes>
               </MemoryRouter>
          );

          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
          expect(screen.getByText('Landing Page')).toBeInTheDocument();
          expect(localStorage.removeItem).toHaveBeenCalledWith('jwt');
     });

     it('redirects to landing page when JWT is empty string', () => {
          (localStorage.getItem as jest.Mock).mockReturnValueOnce('');

          render(
               <MemoryRouter initialEntries={['/protected']}>
                    <Routes>
                         <Route
                              path="/protected"
                              element={
                                   <ProtectedRoute>
                                        <div>Protected Content</div>
                                   </ProtectedRoute>
                              }
                         />
                         <Route path="/" element={<div>Landing Page</div>} />
                    </Routes>
               </MemoryRouter>
          );

          expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
          expect(screen.getByText('Landing Page')).toBeInTheDocument();
     });
});
