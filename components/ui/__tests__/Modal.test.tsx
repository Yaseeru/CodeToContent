import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from '../Modal';

describe('Modal Component', () => {
     it('renders when open is true', () => {
          render(
               <Modal open={true} onClose={() => { }}>
                    <p>Modal content</p>
               </Modal>
          );

          expect(screen.getByText('Modal content')).toBeInTheDocument();
     });

     it('does not render when open is false', () => {
          render(
               <Modal open={false} onClose={() => { }}>
                    <p>Modal content</p>
               </Modal>
          );

          expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
     });

     it('renders title when provided', () => {
          render(
               <Modal open={true} onClose={() => { }} title="Test Modal">
                    <p>Modal content</p>
               </Modal>
          );

          expect(screen.getByText('Test Modal')).toBeInTheDocument();
     });

     it('calls onClose when Escape key is pressed', () => {
          const handleClose = jest.fn();
          render(
               <Modal open={true} onClose={handleClose}>
                    <p>Modal content</p>
               </Modal>
          );

          fireEvent.keyDown(document, { key: 'Escape' });

          expect(handleClose).toHaveBeenCalledTimes(1);
     });

     it('calls onClose when overlay is clicked', () => {
          const handleClose = jest.fn();
          render(
               <Modal open={true} onClose={handleClose}>
                    <p>Modal content</p>
               </Modal>
          );

          const overlay = screen.getByRole('dialog').querySelector('.absolute');
          fireEvent.click(overlay!);

          expect(handleClose).toHaveBeenCalledTimes(1);
     });

     it('calls onClose when close button is clicked', () => {
          const handleClose = jest.fn();
          render(
               <Modal open={true} onClose={handleClose} title="Test Modal">
                    <p>Modal content</p>
               </Modal>
          );

          const closeButton = screen.getByLabelText('Close modal');
          fireEvent.click(closeButton);

          expect(handleClose).toHaveBeenCalledTimes(1);
     });

     it('does not close when modal content is clicked', () => {
          const handleClose = jest.fn();
          render(
               <Modal open={true} onClose={handleClose}>
                    <p>Modal content</p>
               </Modal>
          );

          fireEvent.click(screen.getByText('Modal content'));

          expect(handleClose).not.toHaveBeenCalled();
     });

     it('renders actions when provided', () => {
          render(
               <Modal
                    open={true}
                    onClose={() => { }}
                    actions={
                         <>
                              <button>Cancel</button>
                              <button>Confirm</button>
                         </>
                    }
               >
                    <p>Modal content</p>
               </Modal>
          );

          expect(screen.getByText('Cancel')).toBeInTheDocument();
          expect(screen.getByText('Confirm')).toBeInTheDocument();
     });

     it('has proper ARIA attributes', () => {
          render(
               <Modal open={true} onClose={() => { }} title="Test Modal">
                    <p>Modal content</p>
               </Modal>
          );

          const dialog = screen.getByRole('dialog');
          expect(dialog).toHaveAttribute('aria-modal', 'true');
          expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
     });

     it('applies custom className', () => {
          render(
               <Modal open={true} onClose={() => { }} className="custom-class">
                    <p>Modal content</p>
               </Modal>
          );

          const modalContainer = screen.getByRole('dialog').querySelector('.custom-class');
          expect(modalContainer).toBeInTheDocument();
     });

     it('applies custom maxWidth', () => {
          render(
               <Modal open={true} onClose={() => { }} maxWidth="600px">
                    <p>Modal content</p>
               </Modal>
          );

          const modalContainer = screen.getByRole('dialog').querySelector('[style*="max-width"]');
          expect(modalContainer).toHaveStyle({ maxWidth: '600px' });
     });
});
