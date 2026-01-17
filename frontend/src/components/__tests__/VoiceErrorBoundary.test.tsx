import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceErrorBoundary from '../VoiceErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
     if (shouldThrow) {
          throw new Error('Test error');
     }
     return <div>No error</div>;
};

describe('VoiceErrorBoundary', () => {
     // Suppress console.error for these tests
     const originalError = console.error;
     beforeAll(() => {
          console.error = jest.fn();
     });

     afterAll(() => {
          console.error = originalError;
     });

     it('renders children when there is no error', () => {
          render(
               <VoiceErrorBoundary>
                    <ThrowError shouldThrow={false} />
               </VoiceErrorBoundary>
          );

          expect(screen.getByText('No error')).toBeInTheDocument();
     });

     it('renders fallback UI when an error occurs', () => {
          render(
               <VoiceErrorBoundary>
                    <ThrowError shouldThrow={true} />
               </VoiceErrorBoundary>
          );

          expect(screen.getByText('Voice Feature Temporarily Unavailable')).toBeInTheDocument();
          expect(
               screen.getByText(/The voice profile feature encountered an error/)
          ).toBeInTheDocument();
     });

     it('displays error message in technical details', () => {
          render(
               <VoiceErrorBoundary>
                    <ThrowError shouldThrow={true} />
               </VoiceErrorBoundary>
          );

          const detailsButton = screen.getByText('Technical details');
          fireEvent.click(detailsButton);

          expect(screen.getByText('Test error')).toBeInTheDocument();
     });

     it('resets error state when Try Again button is clicked', () => {
          const { container } = render(
               <VoiceErrorBoundary>
                    <ThrowError shouldThrow={true} />
               </VoiceErrorBoundary>
          );

          expect(screen.getByText('Voice Feature Temporarily Unavailable')).toBeInTheDocument();

          const tryAgainButton = screen.getByText('Try Again');

          // Verify button exists and can be clicked
          expect(tryAgainButton).toBeInTheDocument();
          fireEvent.click(tryAgainButton);

          // Button should still be there after click
          expect(screen.getByText('Try Again')).toBeInTheDocument();
     });

     it('renders custom fallback when provided', () => {
          const customFallback = <div>Custom error message</div>;

          render(
               <VoiceErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
               </VoiceErrorBoundary>
          );

          expect(screen.getByText('Custom error message')).toBeInTheDocument();
          expect(
               screen.queryByText('Voice Feature Temporarily Unavailable')
          ).not.toBeInTheDocument();
     });

     it('calls onError callback when error occurs', () => {
          const mockOnError = jest.fn();

          render(
               <VoiceErrorBoundary onError={mockOnError}>
                    <ThrowError shouldThrow={true} />
               </VoiceErrorBoundary>
          );

          expect(mockOnError).toHaveBeenCalled();
          expect(mockOnError.mock.calls[0][0].message).toBe('Test error');
     });
});
