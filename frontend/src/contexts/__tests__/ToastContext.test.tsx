import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../ToastContext';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
     const toast = useToast();

     return (
          <div>
               <button onClick={() => toast.showSuccess('Success message')}>Show Success</button>
               <button onClick={() => toast.showError('Error message')}>Show Error</button>
               <button onClick={() => toast.showWarning('Warning message')}>Show Warning</button>
               <button onClick={() => toast.showInfo('Info message')}>Show Info</button>
               <button onClick={() => toast.showError('Error with retry', jest.fn())}>
                    Show Error with Retry
               </button>
          </div>
     );
};

describe('ToastContext', () => {
     beforeEach(() => {
          jest.useFakeTimers();
     });

     afterEach(() => {
          jest.runOnlyPendingTimers();
          jest.useRealTimers();
     });

     it('throws error when useToast is used outside ToastProvider', () => {
          // Suppress console.error for this test
          const originalError = console.error;
          console.error = jest.fn();

          expect(() => {
               render(<TestComponent />);
          }).toThrow('useToast must be used within a ToastProvider');

          console.error = originalError;
     });

     it('shows success toast when showSuccess is called', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Success');
          fireEvent.click(button);

          expect(screen.getByText('Success message')).toBeInTheDocument();
          expect(screen.getByText('success')).toBeInTheDocument();
     });

     it('shows error toast when showError is called', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Error');
          fireEvent.click(button);

          expect(screen.getByText('Error message')).toBeInTheDocument();
          expect(screen.getByText('error')).toBeInTheDocument();
     });

     it('shows warning toast when showWarning is called', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Warning');
          fireEvent.click(button);

          expect(screen.getByText('Warning message')).toBeInTheDocument();
          expect(screen.getByText('warning')).toBeInTheDocument();
     });

     it('shows info toast when showInfo is called', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Info');
          fireEvent.click(button);

          expect(screen.getByText('Info message')).toBeInTheDocument();
          expect(screen.getByText('info')).toBeInTheDocument();
     });

     it('shows error toast with retry button', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Error with Retry');
          fireEvent.click(button);

          expect(screen.getByText('Error with retry')).toBeInTheDocument();
          expect(screen.getByText('Retry')).toBeInTheDocument();
     });

     it('removes toast when close button is clicked', async () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Success');
          fireEvent.click(button);

          expect(screen.getByText('Success message')).toBeInTheDocument();

          const closeButton = screen.getByLabelText('Close notification');
          fireEvent.click(closeButton);

          await waitFor(() => {
               expect(screen.queryByText('Success message')).not.toBeInTheDocument();
          });
     });

     it('displays multiple toasts simultaneously', () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          fireEvent.click(screen.getByText('Show Success'));
          fireEvent.click(screen.getByText('Show Error'));
          fireEvent.click(screen.getByText('Show Warning'));

          expect(screen.getByText('Success message')).toBeInTheDocument();
          expect(screen.getByText('Error message')).toBeInTheDocument();
          expect(screen.getByText('Warning message')).toBeInTheDocument();
     });

     it('auto-removes non-error toasts after delay', async () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Success');
          fireEvent.click(button);

          expect(screen.getByText('Success message')).toBeInTheDocument();

          // Fast-forward time
          jest.advanceTimersByTime(5000);

          await waitFor(() => {
               expect(screen.queryByText('Success message')).not.toBeInTheDocument();
          });
     });

     it('does not auto-remove error toasts', async () => {
          render(
               <ToastProvider>
                    <TestComponent />
               </ToastProvider>
          );

          const button = screen.getByText('Show Error');
          fireEvent.click(button);

          expect(screen.getByText('Error message')).toBeInTheDocument();

          // Fast-forward time
          jest.advanceTimersByTime(10000);

          // Error toast should still be visible
          expect(screen.getByText('Error message')).toBeInTheDocument();
     });
});
