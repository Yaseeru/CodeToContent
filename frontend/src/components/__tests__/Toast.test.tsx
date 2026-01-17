import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toast from '../Toast';

describe('Toast Component', () => {
     const mockOnClose = jest.fn();
     const mockOnRetry = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
          jest.useFakeTimers();
     });

     afterEach(() => {
          jest.runOnlyPendingTimers();
          jest.useRealTimers();
     });

     it('renders success toast with correct styling', () => {
          render(
               <Toast
                    message="Operation successful"
                    type="success"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          expect(screen.getByText('Operation successful')).toBeInTheDocument();
          expect(screen.getByText('success')).toBeInTheDocument();
     });

     it('renders error toast with correct styling', () => {
          render(
               <Toast
                    message="Operation failed"
                    type="error"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          expect(screen.getByText('Operation failed')).toBeInTheDocument();
          expect(screen.getByText('error')).toBeInTheDocument();
     });

     it('renders warning toast with correct styling', () => {
          render(
               <Toast
                    message="Warning message"
                    type="warning"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          expect(screen.getByText('Warning message')).toBeInTheDocument();
          expect(screen.getByText('warning')).toBeInTheDocument();
     });

     it('renders info toast with correct styling', () => {
          render(
               <Toast
                    message="Info message"
                    type="info"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          expect(screen.getByText('Info message')).toBeInTheDocument();
          expect(screen.getByText('info')).toBeInTheDocument();
     });

     it('calls onClose when close button is clicked', () => {
          render(
               <Toast
                    message="Test message"
                    type="success"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          const closeButton = screen.getByLabelText('Close notification');
          fireEvent.click(closeButton);

          expect(mockOnClose).toHaveBeenCalledTimes(1);
     });

     it('auto-closes after specified delay for non-error toasts', () => {
          render(
               <Toast
                    message="Test message"
                    type="success"
                    onClose={mockOnClose}
                    autoClose={true}
                    autoCloseDelay={3000}
               />
          );

          expect(mockOnClose).not.toHaveBeenCalled();

          jest.advanceTimersByTime(3000);

          expect(mockOnClose).toHaveBeenCalledTimes(1);
     });

     it('does not auto-close error toasts', () => {
          render(
               <Toast
                    message="Error message"
                    type="error"
                    onClose={mockOnClose}
                    autoClose={true}
                    autoCloseDelay={3000}
               />
          );

          jest.advanceTimersByTime(5000);

          expect(mockOnClose).not.toHaveBeenCalled();
     });

     it('renders retry button for error toasts when onRetry is provided', () => {
          render(
               <Toast
                    message="Error message"
                    type="error"
                    onClose={mockOnClose}
                    onRetry={mockOnRetry}
                    autoClose={false}
               />
          );

          const retryButton = screen.getByText('Retry');
          expect(retryButton).toBeInTheDocument();

          fireEvent.click(retryButton);
          expect(mockOnRetry).toHaveBeenCalledTimes(1);
     });

     it('does not render retry button for non-error toasts', () => {
          render(
               <Toast
                    message="Success message"
                    type="success"
                    onClose={mockOnClose}
                    onRetry={mockOnRetry}
                    autoClose={false}
               />
          );

          expect(screen.queryByText('Retry')).not.toBeInTheDocument();
     });

     it('does not render retry button when onRetry is not provided', () => {
          render(
               <Toast
                    message="Error message"
                    type="error"
                    onClose={mockOnClose}
                    autoClose={false}
               />
          );

          expect(screen.queryByText('Retry')).not.toBeInTheDocument();
     });
});
