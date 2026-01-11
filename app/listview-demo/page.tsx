'use client';

import React, { useState } from 'react';
import { ListView, ListViewItem } from '@/components/ui/ListView';

export default function ListViewDemo() {
     const [selectedId, setSelectedId] = useState<string>('2');
     const [actionLog, setActionLog] = useState<string[]>([]);

     const items: ListViewItem[] = [
          { id: '1', content: <div><strong>Repository 1</strong><br /><span className="text-text-muted text-xs">Last updated: 2 days ago</span></div> },
          { id: '2', content: <div><strong>Repository 2</strong><br /><span className="text-text-muted text-xs">Last updated: 5 days ago</span></div> },
          { id: '3', content: <div><strong>Repository 3</strong><br /><span className="text-text-muted text-xs">Last updated: 1 week ago</span></div> },
          { id: '4', content: <div><strong>Repository 4</strong><br /><span className="text-text-muted text-xs">Last updated: 2 weeks ago</span></div>, disabled: true },
          { id: '5', content: <div><strong>Repository 5</strong><br /><span className="text-text-muted text-xs">Last updated: 1 month ago</span></div> },
     ];

     const handleSelect = (id: string) => {
          setSelectedId(id);
          setActionLog(prev => [...prev, `Selected: ${id}`]);
     };

     const handleAction = (id: string) => {
          setActionLog(prev => [...prev, `Action on: ${id}`]);
     };

     return (
          <div className="min-h-screen bg-bg-app p-xl">
               <div className="max-w-4xl mx-auto">
                    <h1 className="text-lg font-semibold text-text-primary mb-xl">
                         ListView Component Demo
                    </h1>

                    <div className="grid grid-cols-2 gap-xl">
                         {/* Basic ListView */}
                         <div className="bg-bg-panel p-lg rounded-panel border border-border-subtle">
                              <h2 className="text-md font-medium text-text-primary mb-md">
                                   Basic ListView
                              </h2>
                              <p className="text-sm text-text-muted mb-lg">
                                   Click items or use arrow keys to navigate. Press Enter to select.
                              </p>
                              <ListView
                                   items={items}
                                   selectedId={selectedId}
                                   onSelect={handleSelect}
                                   aria-label="Repository list"
                              />
                         </div>

                         {/* ListView with Actions */}
                         <div className="bg-bg-panel p-lg rounded-panel border border-border-subtle">
                              <h2 className="text-md font-medium text-text-primary mb-md">
                                   ListView with Actions
                              </h2>
                              <p className="text-sm text-text-muted mb-lg">
                                   Uses onItemAction instead of onSelect
                              </p>
                              <ListView
                                   items={items.slice(0, 3)}
                                   onItemAction={handleAction}
                                   aria-label="Action list"
                              />
                         </div>

                         {/* Empty ListView */}
                         <div className="bg-bg-panel p-lg rounded-panel border border-border-subtle">
                              <h2 className="text-md font-medium text-text-primary mb-md">
                                   Empty ListView
                              </h2>
                              <p className="text-sm text-text-muted mb-lg">
                                   Shows empty state message
                              </p>
                              <ListView
                                   items={[]}
                                   emptyMessage="No repositories found"
                                   aria-label="Empty list"
                              />
                         </div>

                         {/* Action Log */}
                         <div className="bg-bg-panel p-lg rounded-panel border border-border-subtle">
                              <h2 className="text-md font-medium text-text-primary mb-md">
                                   Action Log
                              </h2>
                              <div className="space-y-xs">
                                   {actionLog.length === 0 ? (
                                        <p className="text-sm text-text-muted">No actions yet</p>
                                   ) : (
                                        actionLog.slice(-10).reverse().map((log, index) => (
                                             <div key={index} className="text-sm text-text-secondary font-mono">
                                                  {log}
                                             </div>
                                        ))
                                   )}
                              </div>
                              <button
                                   onClick={() => setActionLog([])}
                                   className="mt-md py-sm px-md bg-accent-neutral text-text-primary text-sm rounded-button hover:bg-accent-hover"
                              >
                                   Clear Log
                              </button>
                         </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="mt-xl bg-bg-panel p-lg rounded-panel border border-border-subtle">
                         <h2 className="text-md font-medium text-text-primary mb-md">
                              Requirements Checklist
                         </h2>
                         <ul className="space-y-sm text-sm text-text-secondary">
                              <li>✓ Dense list layout with 8px gap between items (Requirements 2.5)</li>
                              <li>✓ 8px vertical, 12px horizontal padding on list items (Requirements 2.5)</li>
                              <li>✓ Subtle hover highlight (Requirements 9.2)</li>
                              <li>✓ Clear selected state styling (Requirements 9.3)</li>
                              <li>✓ Keyboard navigation with arrow keys (Requirements 9.4, 14.5)</li>
                              <li>✓ Enter key to select/action (Requirements 9.4)</li>
                              <li>✓ Home/End keys for first/last item</li>
                              <li>✓ Visible focus indicators (Requirements 14.5)</li>
                              <li>✓ Proper ARIA attributes for accessibility</li>
                              <li>✓ Disabled items are skipped during navigation</li>
                              <li>✓ Wraps around at list boundaries</li>
                         </ul>
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="mt-xl bg-bg-panel p-lg rounded-panel border border-border-subtle">
                         <h2 className="text-md font-medium text-text-primary mb-md">
                              Keyboard Shortcuts
                         </h2>
                         <div className="grid grid-cols-2 gap-md text-sm">
                              <div>
                                   <span className="font-mono text-text-muted">↑ / ↓</span>
                                   <span className="text-text-secondary ml-md">Navigate items</span>
                              </div>
                              <div>
                                   <span className="font-mono text-text-muted">Enter / Space</span>
                                   <span className="text-text-secondary ml-md">Select/Action</span>
                              </div>
                              <div>
                                   <span className="font-mono text-text-muted">Home</span>
                                   <span className="text-text-secondary ml-md">First item</span>
                              </div>
                              <div>
                                   <span className="font-mono text-text-muted">End</span>
                                   <span className="text-text-secondary ml-md">Last item</span>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
