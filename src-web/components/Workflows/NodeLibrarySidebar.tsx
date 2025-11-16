import { useState, useMemo, useEffect } from 'react';
import { NodeLibraryCard } from './NodeLibraryCard';
import { PlainInput } from '../core/PlainInput';
import { cn } from '../../lib/cn';

interface NodeTypeDefinition {
  category: 'trigger' | 'action' | 'logic';
  subtype: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const NODE_TYPE_DEFINITIONS: NodeTypeDefinition[] = [
  // Triggers
  {
    category: 'trigger',
    subtype: 'manual_trigger',
    name: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: '⚡',
    color: '#10b981',
  },
  {
    category: 'trigger',
    subtype: 'webhook_trigger',
    name: 'Webhook Trigger',
    description: 'Trigger on HTTP webhook',
    icon: '🌐',
    color: '#10b981',
  },
  {
    category: 'trigger',
    subtype: 'timer_trigger',
    name: 'Timer Trigger',
    description: 'Execute on schedule',
    icon: '⏰',
    color: '#3b82f6',
  },

  // Actions
  {
    category: 'action',
    subtype: 'http_request',
    name: 'HTTP Request',
    description: 'Send HTTP API request',
    icon: '🌐',
    color: '#8b5cf6',
  },
  {
    category: 'action',
    subtype: 'grpc_request',
    name: 'gRPC Request',
    description: 'Send gRPC request',
    icon: '⚡',
    color: '#8b5cf6',
  },
  {
    category: 'action',
    subtype: 'email',
    name: 'Email',
    description: 'Send email',
    icon: '✉️',
    color: '#f97316',
  },
  {
    category: 'action',
    subtype: 'database',
    name: 'Database Query',
    description: 'Execute database query',
    icon: '🗄️',
    color: '#06b6d4',
  },
  {
    category: 'action',
    subtype: 'websocket',
    name: 'WebSocket',
    description: 'WebSocket connection',
    icon: '🔌',
    color: '#06b6d4',
  },

  // Logic Control
  {
    category: 'logic',
    subtype: 'conditional',
    name: 'Conditional (IF/ELSE)',
    description: 'Branch based on condition',
    icon: '❓',
    color: '#f59e0b',
  },
  {
    category: 'logic',
    subtype: 'loop',
    name: 'Loop',
    description: 'Iterate over items',
    icon: '🔁',
    color: '#ef4444',
  },
  {
    category: 'logic',
    subtype: 'parallel',
    name: 'Parallel Execution',
    description: 'Execute branches concurrently',
    icon: '⚡',
    color: '#06b6d4',
  },
];

interface CategoryState {
  triggers: boolean;
  actions: boolean;
  logic: boolean;
}

const STORAGE_KEY = 'yaak-workflow-node-library-collapsed';

export function NodeLibrarySidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nodes' | 'my-nodes'>('nodes');

  // Load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState<CategoryState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load collapsed state:', error);
    }
    return { triggers: false, actions: false, logic: false };
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
    } catch (error) {
      console.error('Failed to save collapsed state:', error);
    }
  }, [collapsed]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return NODE_TYPE_DEFINITIONS;

    const query = searchQuery.toLowerCase();
    return NODE_TYPE_DEFINITIONS.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.subtype.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const triggerNodes = filteredNodes.filter((n) => n.category === 'trigger');
  const actionNodes = filteredNodes.filter((n) => n.category === 'action');
  const logicNodes = filteredNodes.filter((n) => n.category === 'logic');

  const toggleCategory = (category: keyof CategoryState) => {
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="w-[280px] bg-[#f0f4f9] border-r border-border flex flex-col h-full">
      {/* Tabs */}
      <div className="border-b border-border flex">
        <button
          onClick={() => setActiveTab('nodes')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'nodes' && 'text-primary',
            activeTab !== 'nodes' && 'text-text-subtle hover:text-text'
          )}
        >
          Nodes
          {activeTab === 'nodes' && (
            <div className="absolute bottom-0 left-[20%] w-[60%] h-[3px] bg-primary rounded-t transition-all duration-200" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('my-nodes')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'my-nodes' && 'text-primary',
            activeTab !== 'my-nodes' && 'text-text-subtle hover:text-text'
          )}
        >
          My Nodes
          {activeTab === 'my-nodes' && (
            <div className="absolute bottom-0 left-[20%] w-[60%] h-[3px] bg-primary rounded-t transition-all duration-200" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <PlainInput
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary'
          )}
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Triggers */}
        {triggerNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleCategory('triggers')}
              className={cn(
                'flex items-center justify-between w-full mb-3',
                'text-sm font-semibold text-text hover:text-primary',
                'transition-colors'
              )}
            >
              <span>Triggers ({triggerNodes.length})</span>
              <span
                className={cn('transition-transform duration-200', {
                  'rotate-180': !collapsed.triggers,
                })}
              >
                ▼
              </span>
            </button>
            {!collapsed.triggers && (
              <div className="space-y-2">
                {triggerNodes.map((node) => (
                  <NodeLibraryCard
                    key={node.subtype}
                    nodeType={node.category}
                    nodeSubtype={node.subtype}
                    name={node.name}
                    description={node.description}
                    icon={node.icon}
                    color={node.color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {actionNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleCategory('actions')}
              className={cn(
                'flex items-center justify-between w-full mb-3',
                'text-sm font-semibold text-text hover:text-primary',
                'transition-colors'
              )}
            >
              <span>Actions ({actionNodes.length})</span>
              <span
                className={cn('transition-transform duration-200', {
                  'rotate-180': !collapsed.actions,
                })}
              >
                ▼
              </span>
            </button>
            {!collapsed.actions && (
              <div className="space-y-2">
                {actionNodes.map((node) => (
                  <NodeLibraryCard
                    key={node.subtype}
                    nodeType={node.category}
                    nodeSubtype={node.subtype}
                    name={node.name}
                    description={node.description}
                    icon={node.icon}
                    color={node.color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logic Control */}
        {logicNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleCategory('logic')}
              className={cn(
                'flex items-center justify-between w-full mb-3',
                'text-sm font-semibold text-text hover:text-primary',
                'transition-colors'
              )}
            >
              <span>Logic Control ({logicNodes.length})</span>
              <span
                className={cn('transition-transform duration-200', {
                  'rotate-180': !collapsed.logic,
                })}
              >
                ▼
              </span>
            </button>
            {!collapsed.logic && (
              <div className="space-y-2">
                {logicNodes.map((node) => (
                  <NodeLibraryCard
                    key={node.subtype}
                    nodeType={node.category}
                    nodeSubtype={node.subtype}
                    name={node.name}
                    description={node.description}
                    icon={node.icon}
                    color={node.color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {filteredNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center text-text-subtle py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium">No nodes found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
