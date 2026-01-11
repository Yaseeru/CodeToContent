import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ListView, ListViewItem } from '../ListView';

describe('ListView Component', () => {
     const mockItems: ListViewItem[] = [
          { id: '1', content: 'Item 1' },
          { id: '2', content: 'Item 2' },
          { id: '3', content: 'Item 3' },
     ];

     it('renders list items correctly', () => {
          render(<ListView items={mockItems} />);

          expect(screen.getByText('Item 1')).toBeInTheDocument();
          expect(screen.getByText('Item 2')).toBeInTheDocument();
          expect(screen.getByText('Item 3')).toBeInTheDocument();
     });

     it('displays empty message when no items', () => {
          render(<ListView items={[]} emptyMessage="No data" />);

          expect(screen.getByText('No data')).toBeInTheDocument();
     });

     it('calls onSelect when item is clicked', () => {
          const handleSelect = jest.fn();
          render(<ListView items={mockItems} onSelect={handleSelect} />);

          fireEvent.click(screen.getByText('Item 2'));

          expect(handleSelect).toHaveBeenCalledWith('2');
     });

     it('handles keyboard navigation with ArrowDown', () => {
          const handleSelect = jest.fn();
          render(<ListView items={mockItems} onSelect={handleSelect} />);

          const listContainer = screen.getByRole('list');
          const firstItem = screen.getByText('Item 1').parentElement!;

          firstItem.focus();
          fireEvent.keyDown(listContainer, { key: 'ArrowDown' });

          expect(document.activeElement).toBe(screen.getByText('Item 2').parentElement);
     });

     it('handles keyboard navigation with ArrowUp', () => {
          const handleSelect = jest.fn();
          render(<ListView items={mockItems} onSelect={handleSelect} />);

          const listContainer = screen.getByRole('list');
          const secondItem = screen.getByText('Item 2').parentElement!;

          secondItem.focus();
          fireEvent.keyDown(listContainer, { key: 'ArrowUp' });

          expect(document.activeElement).toBe(screen.getByText('Item 1').parentElement);
     });

     it('handles Enter key to select item', () => {
          const handleSelect = jest.fn();
          render(<ListView items={mockItems} onSelect={handleSelect} />);

          const listContainer = screen.getByRole('list');
          const firstItem = screen.getByText('Item 1').parentElement!;

          firstItem.focus();
          fireEvent.keyDown(listContainer, { key: 'Enter' });

          expect(handleSelect).toHaveBeenCalledWith('1');
     });

     it('applies selected styling to selected item', () => {
          render(<ListView items={mockItems} selectedId="2" />);

          const selectedItem = screen.getByText('Item 2').parentElement!;

          expect(selectedItem).toHaveAttribute('aria-selected', 'true');
     });

     it('skips disabled items during keyboard navigation', () => {
          const itemsWithDisabled: ListViewItem[] = [
               { id: '1', content: 'Item 1' },
               { id: '2', content: 'Item 2', disabled: true },
               { id: '3', content: 'Item 3' },
          ];

          render(<ListView items={itemsWithDisabled} />);

          const listContainer = screen.getByRole('list');
          const firstItem = screen.getByText('Item 1').parentElement!;

          firstItem.focus();
          fireEvent.keyDown(listContainer, { key: 'ArrowDown' });

          // Should skip disabled item and go to Item 3
          expect(document.activeElement).toBe(screen.getByText('Item 3').parentElement);
     });

     it('handles Home key to focus first item', () => {
          render(<ListView items={mockItems} />);

          const listContainer = screen.getByRole('list');
          const lastItem = screen.getByText('Item 3').parentElement!;

          lastItem.focus();
          fireEvent.keyDown(listContainer, { key: 'Home' });

          expect(document.activeElement).toBe(screen.getByText('Item 1').parentElement);
     });

     it('handles End key to focus last item', () => {
          render(<ListView items={mockItems} />);

          const listContainer = screen.getByRole('list');
          const firstItem = screen.getByText('Item 1').parentElement!;

          firstItem.focus();
          fireEvent.keyDown(listContainer, { key: 'End' });

          expect(document.activeElement).toBe(screen.getByText('Item 3').parentElement);
     });

     it('calls onItemAction when provided instead of onSelect', () => {
          const handleAction = jest.fn();
          const handleSelect = jest.fn();
          render(
               <ListView
                    items={mockItems}
                    onItemAction={handleAction}
                    onSelect={handleSelect}
               />
          );

          fireEvent.click(screen.getByText('Item 1'));

          expect(handleAction).toHaveBeenCalledWith('1');
          expect(handleSelect).not.toHaveBeenCalled();
     });

     it('has proper ARIA attributes', () => {
          render(<ListView items={mockItems} aria-label="Test list" />);

          const list = screen.getByRole('list');
          expect(list).toHaveAttribute('aria-label', 'Test list');

          const items = screen.getAllByRole('listitem');
          expect(items).toHaveLength(3);
     });

     it('wraps around when navigating past last item with ArrowDown', () => {
          render(<ListView items={mockItems} />);

          const listContainer = screen.getByRole('list');
          const lastItem = screen.getByText('Item 3').parentElement!;

          lastItem.focus();
          fireEvent.keyDown(listContainer, { key: 'ArrowDown' });

          // Should wrap to first item
          expect(document.activeElement).toBe(screen.getByText('Item 1').parentElement);
     });

     it('wraps around when navigating past first item with ArrowUp', () => {
          render(<ListView items={mockItems} />);

          const listContainer = screen.getByRole('list');
          const firstItem = screen.getByText('Item 1').parentElement!;

          firstItem.focus();
          fireEvent.keyDown(listContainer, { key: 'ArrowUp' });

          // Should wrap to last item
          expect(document.activeElement).toBe(screen.getByText('Item 3').parentElement);
     });
});
