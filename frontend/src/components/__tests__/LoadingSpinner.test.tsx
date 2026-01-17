import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
     it('renders with default size', () => {
          const { container } = render(<LoadingSpinner />);
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toBeInTheDocument();
          expect(spinner).toHaveClass('w-8', 'h-8');
     });

     it('renders with small size', () => {
          const { container } = render(<LoadingSpinner size="sm" />);
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toHaveClass('w-4', 'h-4');
     });

     it('renders with large size', () => {
          const { container } = render(<LoadingSpinner size="lg" />);
          const spinner = container.querySelector('.animate-spin');
          expect(spinner).toHaveClass('w-12', 'h-12');
     });

     it('renders with message', () => {
          render(<LoadingSpinner message="Loading data..." />);
          expect(screen.getByText('Loading data...')).toBeInTheDocument();
     });

     it('does not render message when not provided', () => {
          const { container } = render(<LoadingSpinner />);
          const message = container.querySelector('p');
          expect(message).not.toBeInTheDocument();
     });

     it('renders in fullscreen mode', () => {
          const { container } = render(<LoadingSpinner fullScreen={true} />);
          const fullscreenContainer = container.querySelector('.fixed.inset-0');
          expect(fullscreenContainer).toBeInTheDocument();
          expect(fullscreenContainer).toHaveClass('bg-dark-bg', 'bg-opacity-75');
     });

     it('does not render in fullscreen mode by default', () => {
          const { container } = render(<LoadingSpinner />);
          const fullscreenContainer = container.querySelector('.fixed.inset-0');
          expect(fullscreenContainer).not.toBeInTheDocument();
     });

     it('renders fullscreen with message', () => {
          render(<LoadingSpinner fullScreen={true} message="Processing..." />);
          expect(screen.getByText('Processing...')).toBeInTheDocument();
          const fullscreenContainer = document.querySelector('.fixed.inset-0');
          expect(fullscreenContainer).toBeInTheDocument();
     });
});
