import { useAtomValue } from 'jotai';
import { selectedNodeAtom, selectedNodeIdAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { PlainInput } from '../core/PlainInput';
import { Button } from '../core/Button';
import { useState, useEffect } from 'react';
import { patchModel } from '@yaakapp-internal/models';

export function PropertiesPanel() {
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const selectedNode = useAtomValue(selectedNodeAtom);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.name);
      setDescription(selectedNode.description || '');
      setConfig(selectedNode.config || {});
      setHasChanges(false);
    }
  }, [selectedNode]);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="w-80 bg-surface border-l border-border flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="font-semibold mb-2">No Node Selected</h3>
        <p className="text-sm text-text-subtle">
          Select a node to configure its parameters
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    await patchModel(selectedNodeId, {
      name,
      description: description || null,
      config,
    });
    setHasChanges(false);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const getNodeIcon = (subtype: string) => {
    const icons: Record<string, string> = {
      manual_trigger: '⚡',
      webhook_trigger: '🌐',
      timer_trigger: '⏰',
      http_request: '🌐',
      grpc_request: '⚡',
      email: '✉️',
      database: '🗄️',
      websocket: '🔌',
      conditional: '❓',
      loop: '🔁',
      parallel: '⚡',
    };
    return icons[subtype] || '📦';
  };

  const renderConfigFields = () => {
    switch (selectedNode.nodeSubtype) {
      case 'http_request':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <PlainInput
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-sm"
                rows={6}
              />
            </div>
          </>
        );

      case 'conditional':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <textarea
              value={config.condition || ''}
              onChange={(e) => updateConfig('condition', e.target.value)}
              placeholder='{{step[0].response.status}} == 200'
              className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-text-subtle mt-1">
              Use template syntax to reference previous steps
            </p>
          </div>
        );

      case 'loop':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Loop Type</label>
              <select
                value={config.loop_type || 'count'}
                onChange={(e) => updateConfig('loop_type', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded"
              >
                <option value="count">Fixed Count</option>
                <option value="array">Iterate Array</option>
              </select>
            </div>
            {config.loop_type === 'count' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Count</label>
                <PlainInput
                  type="number"
                  value={config.count || 5}
                  onChange={(e) => updateConfig('count', parseInt(e.target.value))}
                  min={1}
                  max={1000}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Array Variable</label>
                <PlainInput
                  value={config.array_variable || ''}
                  onChange={(e) => updateConfig('array_variable', e.target.value)}
                  placeholder='{{step[0].response.body.items}}'
                />
              </div>
            )}
          </>
        );

      case 'parallel':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Branch Count</label>
              <PlainInput
                type="number"
                value={config.branch_count || 2}
                onChange={(e) => updateConfig('branch_count', parseInt(e.target.value))}
                min={2}
                max={10}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.fail_fast ?? true}
                  onChange={(e) => updateConfig('fail_fast', e.target.checked)}
                />
                <span className="text-sm">Fail-fast mode</span>
              </label>
              <p className="text-xs text-text-subtle mt-1">
                Stop execution if any branch fails
              </p>
            </div>
          </>
        );

      case 'email':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <PlainInput
                value={config.to || ''}
                onChange={(e) => updateConfig('to', e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <PlainInput
                value={config.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                placeholder="Email body"
                className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
                rows={6}
              />
            </div>
          </>
        );

      case 'database':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Connection String</label>
              <PlainInput
                value={config.connection_string || ''}
                onChange={(e) => updateConfig('connection_string', e.target.value)}
                placeholder='{{env.DATABASE_URL}}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SQL Query</label>
              <textarea
                value={config.query || ''}
                onChange={(e) => updateConfig('query', e.target.value)}
                placeholder="SELECT * FROM users WHERE id = ?"
                className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-sm"
                rows={6}
              />
            </div>
          </>
        );

      case 'websocket':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">WebSocket URL</label>
              <PlainInput
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="wss://example.com/ws"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Messages to Send</label>
              <textarea
                value={config.messages || ''}
                onChange={(e) => updateConfig('messages', e.target.value)}
                placeholder='["message1", "message2"]'
                className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-sm"
                rows={4}
              />
            </div>
          </>
        );

      case 'webhook_trigger':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Webhook URL</label>
              <PlainInput
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="Auto-generated"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allowed Methods</label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>
          </>
        );

      case 'timer_trigger':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule Type</label>
              <select
                value={config.schedule_type || 'interval'}
                onChange={(e) => updateConfig('schedule_type', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded"
              >
                <option value="interval">Interval</option>
                <option value="cron">Cron Expression</option>
              </select>
            </div>
            {config.schedule_type === 'interval' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Interval (minutes)</label>
                <PlainInput
                  type="number"
                  value={config.interval_minutes || 60}
                  onChange={(e) => updateConfig('interval_minutes', parseInt(e.target.value))}
                  min={1}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Cron Expression</label>
                <PlainInput
                  value={config.cron_expression || ''}
                  onChange={(e) => updateConfig('cron_expression', e.target.value)}
                  placeholder="0 0 * * *"
                />
              </div>
            )}
          </>
        );

      default:
        return (
          <div className="text-sm text-text-subtle">
            No configuration needed for this node type
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">{getNodeIcon(selectedNode.nodeSubtype)}</div>
          <div>
            <h3 className="font-semibold text-sm">{selectedNode.nodeSubtype.replace(/_/g, ' ')}</h3>
            <p className="text-xs text-text-subtle">Configure parameters</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Node Name</label>
          <PlainInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Node name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Optional description"
            className="w-full px-3 py-2 bg-surface border border-border rounded text-sm"
            rows={2}
          />
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-sm mb-3">Configuration</h4>
          <div className="space-y-4">
            {renderConfigFields()}
          </div>
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-4 border-t border-border">
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
