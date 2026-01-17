import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
     children: ReactNode;
     fallback?: ReactNode;
     onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
     hasError: boolean;
     error: Error | null;
}

/**
 * Error boundary specifically for voice profile components.
 * Provides graceful degradation when voice features fail.
 */
class VoiceErrorBoundary extends Component<Props, State> {
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
          console.error('Voice component error:', error, errorInfo);

          // Call optional error handler
          if (this.props.onError) {
               this.props.onError(error, errorInfo);
          }
     }

     handleReset = (): void => {
          this.setState({
               hasError: false,
               error: null,
          });
     };

     render(): ReactNode {
          if (this.state.hasError) {
               // Use custom fallback if provided
               if (this.props.fallback) {
                    return this.props.fallback;
               }

               // Default fallback UI
               return (
                    <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-6">
                         <div className="flex items-start gap-3">
                              <svg
                                   className="w-6 h-6 text-yellow-400 flex-shrink-0"
                                   fill="currentColor"
                                   viewBox="0 0 20 20"
                              >
                                   <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                   />
                              </svg>
                              <div className="flex-1">
                                   <h3 className="text-yellow-400 font-medium mb-2">
                                        Voice Feature Temporarily Unavailable
                                   </h3>
                                   <p className="text-yellow-400 text-sm leading-relaxed mb-4">
                                        The voice profile feature encountered an error. You can continue using the
                                        standard content generation without voice personalization.
                                   </p>
                                   {this.state.error && (
                                        <details className="mb-4">
                                             <summary className="text-yellow-400 text-xs cursor-pointer hover:underline">
                                                  Technical details
                                             </summary>
                                             <p className="text-yellow-400 text-xs font-mono mt-2 p-2 bg-dark-bg rounded">
                                                  {this.state.error.message}
                                             </p>
                                        </details>
                                   )}
                                   <button
                                        onClick={this.handleReset}
                                        className="px-4 py-2 bg-yellow-700 text-white text-sm font-medium rounded-lg hover:bg-yellow-600"
                                   >
                                        Try Again
                                   </button>
                              </div>
                         </div>
                    </div>
               );
          }

          return this.props.children;
     }
}

export default VoiceErrorBoundary;
