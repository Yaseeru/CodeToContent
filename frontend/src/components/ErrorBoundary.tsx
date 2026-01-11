import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
     children: ReactNode;
}

interface State {
     hasError: boolean;
     error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
          super(props);
          this.state = {
               hasError: false,
               error: null,
          };
     }

     static getDerivedStateFromError(error: Error): State {
          return {
               hasError: true,
               error,
          };
     }

     componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
          console.error('Error caught by boundary:', error, errorInfo);
     }

     handleReset = (): void => {
          this.setState({
               hasError: false,
               error: null,
          });
     };

     render(): ReactNode {
          if (this.state.hasError) {
               return (
                    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
                         <div className="max-w-md text-center">
                              <h1 className="text-3xl font-semibold text-dark-text mb-4">
                                   Something went wrong
                              </h1>
                              <p className="text-base text-dark-text-secondary mb-6 leading-relaxed">
                                   An unexpected error occurred. Your work has been preserved.
                              </p>
                              {this.state.error && (
                                   <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-6 text-left">
                                        <p className="text-sm text-dark-text-tertiary font-mono">
                                             {this.state.error.message}
                                        </p>
                                   </div>
                              )}
                              <div className="flex gap-3 justify-center">
                                   <button
                                        onClick={this.handleReset}
                                        className="px-6 py-3 bg-dark-accent text-white font-medium rounded-lg"
                                   >
                                        Try Again
                                   </button>
                                   <button
                                        onClick={() => (window.location.href = '/')}
                                        className="px-6 py-3 bg-dark-surface border border-dark-border text-dark-text font-medium rounded-lg"
                                   >
                                        Go Home
                                   </button>
                              </div>
                         </div>
                    </div>
               );
          }

          return this.props.children;
     }
}

export default ErrorBoundary;
