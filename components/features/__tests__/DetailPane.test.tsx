import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DetailPane } from '../DetailPane'
import '@testing-library/jest-dom'

describe('DetailPane', () => {
     describe('Basic Rendering', () => {
          it('should render with content', () => {
               render(<DetailPane content="Test content" />)
               expect(screen.getByText('Test content')).toBeInTheDocument()
          })

          it('should render with title', () => {
               render(<DetailPane content="Test content" title="Test Title" />)
               expect(screen.getByText('Test Title')).toBeInTheDocument()
          })

          it('should render placeholder when content is empty', () => {
               render(<DetailPane content="" placeholder="Empty state" />)
               expect(screen.getByText('Empty state')).toBeInTheDocument()
          })

          it('should render in read-only mode', () => {
               render(<DetailPane content="Test content" readOnly />)
               expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
               expect(screen.getByRole('article')).toBeInTheDocument()
          })
     })

     describe('Editing Functionality', () => {
          it('should allow editing when not read-only', () => {
               const handleChange = jest.fn()
               render(<DetailPane content="Initial content" onContentChange={handleChange} />)

               const textarea = screen.getByRole('textbox')
               fireEvent.change(textarea, { target: { value: 'Updated content' } })

               expect(handleChange).toHaveBeenCalledWith('Updated content')
          })

          it('should call onSave when textarea loses focus', async () => {
               const handleSave = jest.fn()
               render(<DetailPane content="Initial content" onSave={handleSave} />)

               const textarea = screen.getByRole('textbox')
               fireEvent.change(textarea, { target: { value: 'Updated content' } })
               fireEvent.blur(textarea)

               await waitFor(() => {
                    expect(handleSave).toHaveBeenCalledWith('Updated content')
               })
          })

          it('should not call onSave if content has not changed', () => {
               const handleSave = jest.fn()
               render(<DetailPane content="Initial content" onSave={handleSave} />)

               const textarea = screen.getByRole('textbox')
               fireEvent.blur(textarea)

               expect(handleSave).not.toHaveBeenCalled()
          })
     })

     describe('Utility Actions', () => {
          it('should copy content to clipboard', async () => {
               // Mock clipboard API
               Object.assign(navigator, {
                    clipboard: {
                         writeText: jest.fn().mockResolvedValue(undefined)
                    }
               })

               render(<DetailPane content="Test content" />)

               const copyButton = screen.getByLabelText(/copy content to clipboard/i)
               fireEvent.click(copyButton)

               await waitFor(() => {
                    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test content')
               })

               expect(screen.getByText('Copied')).toBeInTheDocument()
          })

          it('should call onExport when export button is clicked', () => {
               const handleExport = jest.fn()
               render(<DetailPane content="Test content" onExport={handleExport} />)

               const exportButton = screen.getByLabelText(/export content/i)
               fireEvent.click(exportButton)

               expect(handleExport).toHaveBeenCalled()
          })

          it('should call onRegenerate when regenerate button is clicked', () => {
               const handleRegenerate = jest.fn()
               render(<DetailPane content="Test content" onRegenerate={handleRegenerate} />)

               const regenerateButton = screen.getByLabelText(/regenerate content/i)
               fireEvent.click(regenerateButton)

               expect(handleRegenerate).toHaveBeenCalled()
          })

          it('should disable utility buttons when content is empty', () => {
               render(<DetailPane content="" onExport={jest.fn()} />)

               const copyButton = screen.getByLabelText(/copy content to clipboard/i)
               const exportButton = screen.getByLabelText(/export content/i)

               expect(copyButton).toBeDisabled()
               expect(exportButton).toBeDisabled()
          })
     })

     describe('Font Styling', () => {
          it('should use monospace font for code-derived content', () => {
               render(<DetailPane content="const x = 1;" isCodeDerived readOnly />)

               const content = screen.getByRole('article')
               expect(content).toHaveClass('font-mono')
          })

          it('should use primary font for non-code content', () => {
               render(<DetailPane content="Regular text" readOnly />)

               const content = screen.getByRole('article')
               expect(content).toHaveClass('font-primary')
          })
     })

     describe('Accessibility', () => {
          it('should have proper ARIA labels', () => {
               render(<DetailPane content="Test content" title="Test Title" />)

               expect(screen.getByRole('region', { name: 'Test Title' })).toBeInTheDocument()
               expect(screen.getByRole('textbox', { name: /editable content area/i })).toBeInTheDocument()
          })

          it('should announce unsaved changes to screen readers', async () => {
               render(<DetailPane content="Initial content" onSave={jest.fn()} />)

               const textarea = screen.getByRole('textbox')
               fireEvent.change(textarea, { target: { value: 'Updated content' } })

               await waitFor(() => {
                    expect(screen.getByRole('status')).toHaveTextContent(/unsaved changes/i)
               })
          })
     })
})
