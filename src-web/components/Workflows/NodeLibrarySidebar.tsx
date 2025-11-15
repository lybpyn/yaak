import { useState, useMemo } from 'react';
import { NodeLibraryCard } from './NodeLibraryCard';
import { PlainInput } from '../core/PlainInput';
import classNames from 'classnames';

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

export function NodeLibrarySidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<CategoryState>({
    triggers: false,
    actions: false,
    logic: false,
  });

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
    <div className="w-64 bg-surface border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm mb-3">Node Library</h3>
        <PlainInput
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Triggers */}
        {triggerNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleCategory('triggers')}
              className="flex items-center justify-between w-full mb-2 text-sm font-semibold hover:text-text"
            >
              <span>Triggers</span>
              <span className={classNames('transition-transform', {
                'rotate-180': !collapsed.triggers,
              })}>
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
              className="flex items-center justify-between w-full mb-2 text-sm font-semibold hover:text-text"
            >
              <span>Actions</span>
              <span className={classNames('transition-transform', {
                'rotate-180': !collapsed.actions,
              })}>
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
              className="flex items-center justify-between w-full mb-2 text-sm font-semibold hover:text-text"
            >
              <span>Logic Control</span>
              <span className={classNames('transition-transform', {
                'rotate-180': !collapsed.logic,
              })}>
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
          <div className="text-center text-text-subtle text-sm py-8">
            No nodes match your search
          </div>
        )}
      </div>
    </div>
  );
}
