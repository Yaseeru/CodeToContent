'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "./icons/X";

export interface ModalProps {
     open: boolean;
     onClose: () => void;
     title?: string;
     children: React.ReactNode;
     actions?: React.ReactNode;
     className?: string;
     maxWidth?: string;
}

/**
 * Modal Component
 * 
 * A minimal, purpose-driven modal dialog following developer-focused design principles.
 * 
 * Design Requirements:
 * - Small and centered (max 480px width)
 * - 24px padding
 * - Elevated surface background color
 * - Subtle border
 * - No animations (0ms transitions)
 * - Escape key handler for dismissal
 * 
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 */
export function Modal({
     open,
     onClose,
     title,
     children,
     actions,
     className,
     maxWidth = "480px"
}: ModalProps) {
     // Handle Escape key to close modal
     React.useEffect(() => {
          if (!open) return;

          const handleEscape = (event: KeyboardEvent) => {
               if (event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
               }
          };

          document.addEventListener('keydown', handleEscape);
          return () => document.removeEventListener('keydown', handleEscape);
     }, [open, onClose]);

     // Prevent body scroll when modal is open
     React.useEffect(() => {
          if (open) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = '';
          }

          return () => {
               document.body.style.overflow = '';
          };
     }, [open]);

     if (!open) return null;

     return (
          <div
               className="fixed inset-0 z-50 flex items-center justify-center"
               role="dialog"
               aria-modal="true"
               aria-labelledby={title ? "modal-title" : undefined}
          >
               {/* Overlay - subtle backdrop with blur */}
               <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden="true"
               />

               {/* Modal Container - centered, small, elevated */}
               <div
                    className={cn(
                         // Positioning and sizing
                         "relative z-10",
                         "w-full",
                         // Small and centered (max 480px width from design tokens)
                         "max-w-[480px]",
                         // 24px padding (xl from spacing scale)
                         "p-xl",
                         // 8px border radius (from modal tokens)
                         "rounded-modal",
                         // Elevated surface background color
                         "bg-bg-elevated",
                         // Subtle border
                         "border border-border-subtle",
                         // No animations or transitions (0ms)
                         "transition-none",
                         // Shadow for depth (subtle)
                         "shadow-lg",
                         // Margin for mobile
                         "mx-lg",
                         className
                    )}
                    style={{ maxWidth }}
                    onClick={(e) => e.stopPropagation()}
               >
                    {/* Header with title and close button */}
                    {title && (
                         <div className="flex items-start justify-between mb-lg">
                              <h2
                                   id="modal-title"
                                   className="text-md font-semibold text-text-primary"
                              >
                                   {title}
                              </h2>
                              <button
                                   onClick={onClose}
                                   className={cn(
                                        "p-xs rounded-button",
                                        "text-text-muted hover:text-text-secondary",
                                        "hover:bg-[rgba(110,110,128,0.05)]",
                                        "transition-none",
                                        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--border-focus)]"
                                   )}
                                   aria-label="Close modal"
                              >
                                   <X size="md" />
                              </button>
                         </div>
                    )}

                    {/* Content */}
                    <div className="text-base text-text-secondary">
                         {children}
                    </div>

                    {/* Actions */}
                    {actions && (
                         <div className="flex items-center justify-end gap-sm mt-xl">
                              {actions}
                         </div>
                    )}
               </div>
          </div>
     );
}

Modal.displayName = "Modal";
