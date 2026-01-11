import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
     beforeEach(() => {
          // Reset window.location mock
          delete (window as any).location;
          (window as any).location = { href: '' };
     });

     it('renders the Continue with GitHub button', () => {
          render(<LandingPage />);

          const button = screen.getByRole('button', { name: /continue with github/i });
          expect(button).toBeInTheDocument();
     });

     it('displays the application title', () => {
          render(<LandingPage />);

          const title = screen.getByText('CodeToContent');
          expect(title).toBeInTheDocument();
     });

     it('displays the application description', () => {
          render(<LandingPage />);

          const description = screen.getByText(/transform your github repositories/i);
          expect(description).toBeInTheDocument();
     });

     it('redirects to OAuth endpoint when button is clicked', () => {
          render(<LandingPage />);

          const button = screen.getByRole('button', { name: /continue with github/i });
          fireEvent.click(button);

          expect(window.location.href).toBe('/api/auth/github');
     });
});
