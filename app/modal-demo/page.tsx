'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ModalDemoPage() {
     const [isOpen, setIsOpen] = useState(false);
     const [isConfirmOpen, setIsConfirmOpen] = useState(false);

     return (
          <div className="min-h-screen bg-bg-app p-xl">
               <div className="max-w-4xl mx-auto space-y-xl">
                    <div>
                         <h1 className="text-lg font-semibold text-text-primary mb-md">
                              Modal Component Demo
                         </h1>
                         <p className="text-base text-text-secondary">
                              Testing the Modal component according to design specifications:
                         </p>
                         <ul className="list-disc list-inside text-sm text-text-muted mt-sm space-y-xs">
                              <li>Small and centered (max 480px width)</li>
                              <li>24px padding</li>
                              <li>Elevated surface background color</li>
                              <li>Subtle border</li>
                              <li>No animations (0ms transitions)</li>
                              <li>Escape key handler</li>
                         </ul>
                    </div>

                    <div className="space-y-md">
                         <div>
                              <Button onClick={() => setIsOpen(true)}>
                                   Open Simple Modal
                              </Button>
                         </div>

                         <div>
                              <Button onClick={() => setIsConfirmOpen(true)} variant="secondary">
                                   Open Confirmation Modal
                              </Button>
                         </div>
                    </div>

                    {/* Simple Modal */}
                    <Modal
                         open={isOpen}
                         onClose={() => setIsOpen(false)}
                         title="Simple Modal"
                    >
                         <p className="text-text-secondary">
                              This is a simple modal with just content and a title.
                              You can close it by clicking the X button, clicking outside,
                              or pressing the Escape key.
                         </p>
                    </Modal>

                    {/* Confirmation Modal with Actions */}
                    <Modal
                         open={isConfirmOpen}
                         onClose={() => setIsConfirmOpen(false)}
                         title="Confirm Action"
                         actions={
                              <>
                                   <Button
                                        variant="ghost"
                                        onClick={() => setIsConfirmOpen(false)}
                                   >
                                        Cancel
                                   </Button>
                                   <Button
                                        variant="primary"
                                        onClick={() => {
                                             alert('Action confirmed!');
                                             setIsConfirmOpen(false);
                                        }}
                                   >
                                        Confirm
                                   </Button>
                              </>
                         }
                    >
                         <p className="text-text-secondary">
                              Are you sure you want to proceed with this action?
                              This is a confirmation modal with action buttons.
                         </p>
                    </Modal>
               </div>
          </div>
     );
}
