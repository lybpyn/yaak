import { useAtomValue } from 'jotai';
import { selectedNodeAtom, selectedNodeIdAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { Button } from '../core/Button';
import { useState, useEffect, useMemo } from 'react';
import { patchModel } from '@yaakapp-internal/models';
import { TextField } from './FormFields/TextField';
import { TextAreaField } from './FormFields/TextAreaField';
import { SelectField } from './FormFields/SelectField';
import { NumberField } from './FormFields/NumberField';
import { CheckboxField } from './FormFields/CheckboxField';
import { CodeField } from './FormFields/CodeField';
import { validateNodeConfig, type ValidationError } from '../../lib/workflow-validation';

export function PropertiesPanel() {
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const selectedNode = useAtomValue(selectedNodeAtom);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.name);
      setDescription(selectedNode.description || '');
      setConfig(selectedNode.config || {});
      setHasChanges(false);
      setValidationErrors([]);
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
    const validation = validateNodeConfig(selectedNode.nodeSubtype, name, config);
    setValidationErrors(validation.errors);

    if (!validation.valid) {
      return; // Don't save if validation fails
    }

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
    // Clear validation error for this field when user edits it
    setValidationErrors((prev) => prev.filter((e) => e.field !== key));
  };

  // Helper to get validation error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find((e) => e.field === fieldName);
    return error?.message;
  };

  // Check if form is valid (for disabling save button)
  const isFormValid = useMemo(() => {
    const validation = validateNodeConfig(selectedNode.nodeSubtype, name, config);
    return validation.valid;
  }, [selectedNode.nodeSubtype, name, config]);

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
            <SelectField
              label="Method"
              value={config.method || 'GET'}
              onChange={(value) => updateConfig('method', value)}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'HEAD', label: 'HEAD' },
                { value: 'OPTIONS', label: 'OPTIONS' },
              ]}
            />
            <TextField
              label="URL"
              value={config.url || ''}
              onChange={(value) => updateConfig('url', value)}
              placeholder="https://api.example.com/endpoint"
              required
              error={getFieldError('URL')}
            />
            <CodeField
              label="Body"
              value={config.body || ''}
              onChange={(value) => updateConfig('body', value)}
              language="json"
              hint="Request body in JSON format"
              error={getFieldError('Body')}
            />
          </>
        );

      case 'conditional':
        return (
          <CodeField
            label="Condition"
            value={config.condition || ''}
            onChange={(value) => updateConfig('condition', value)}
            language="javascript"
            hint="Use template syntax to reference previous steps (e.g., {{step[0].response.status}} == 200)"
            height="120px"
          />
        );

      case 'loop':
        return (
          <>
            <SelectField
              label="Loop Type"
              value={config.loop_type || 'count'}
              onChange={(value) => updateConfig('loop_type', value)}
              options={[
                { value: 'count', label: 'Fixed Count' },
                { value: 'array', label: 'Iterate Array' },
              ]}
            />
            {config.loop_type === 'count' || !config.loop_type ? (
              <NumberField
                label="Count"
                value={config.count || 5}
                onChange={(value) => updateConfig('count', value === '' ? 1 : value)}
                min={1}
                max={1000}
                hint="Number of iterations"
              />
            ) : (
              <TextField
                label="Array Variable"
                value={config.array_variable || ''}
                onChange={(value) => updateConfig('array_variable', value)}
                placeholder="{{step[0].response.body.items}}"
                hint="Template variable containing array to iterate"
              />
            )}
          </>
        );

      case 'parallel':
        return (
          <>
            <NumberField
              label="Branch Count"
              value={config.branch_count || 2}
              onChange={(value) => updateConfig('branch_count', value === '' ? 2 : value)}
              min={2}
              max={10}
              hint="Number of parallel execution branches"
            />
            <CheckboxField
              label="Fail-fast mode"
              checked={config.fail_fast ?? true}
              onChange={(checked) => updateConfig('fail_fast', checked)}
              hint="Stop execution if any branch fails"
            />
          </>
        );

      case 'email':
        return (
          <>
            <TextField
              label="To"
              value={config.to || ''}
              onChange={(value) => updateConfig('to', value)}
              placeholder="recipient@example.com"
              required
              error={getFieldError('To')}
            />
            <TextField
              label="Subject"
              value={config.subject || ''}
              onChange={(value) => updateConfig('subject', value)}
              placeholder="Email subject"
              required
              error={getFieldError('Subject')}
            />
            <TextAreaField
              label="Body"
              value={config.body || ''}
              onChange={(value) => updateConfig('body', value)}
              placeholder="Email body"
              rows={6}
            />
          </>
        );

      case 'database':
        return (
          <>
            <TextField
              label="Connection String"
              value={config.connection_string || ''}
              onChange={(value) => updateConfig('connection_string', value)}
              placeholder="{{env.DATABASE_URL}}"
              hint="Database connection string or template variable"
              required
              error={getFieldError('Connection String')}
            />
            <CodeField
              label="SQL Query"
              value={config.query || ''}
              onChange={(value) => updateConfig('query', value)}
              language="text"
              hint="SQL query to execute"
            />
          </>
        );

      case 'websocket':
        return (
          <>
            <TextField
              label="WebSocket URL"
              value={config.url || ''}
              onChange={(value) => updateConfig('url', value)}
              placeholder="wss://example.com/ws"
              required
              error={getFieldError('WebSocket URL')}
            />
            <CodeField
              label="Messages to Send"
              value={config.messages || ''}
              onChange={(value) => updateConfig('messages', value)}
              language="json"
              hint="JSON array of messages to send"
              height="120px"
              error={getFieldError('Messages')}
            />
          </>
        );

      case 'webhook_trigger':
        return (
          <>
            <TextField
              label="Webhook URL"
              value={config.url || ''}
              onChange={(value) => updateConfig('url', value)}
              placeholder="Auto-generated"
              disabled
              hint="This URL is auto-generated when webhook is active"
            />
            <SelectField
              label="Allowed Methods"
              value={config.method || 'POST'}
              onChange={(value) => updateConfig('method', value)}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
              ]}
            />
          </>
        );

      case 'timer_trigger':
        return (
          <>
            <SelectField
              label="Schedule Type"
              value={config.schedule_type || 'interval'}
              onChange={(value) => updateConfig('schedule_type', value)}
              options={[
                { value: 'interval', label: 'Interval' },
                { value: 'cron', label: 'Cron Expression' },
              ]}
            />
            {config.schedule_type === 'interval' || !config.schedule_type ? (
              <NumberField
                label="Interval (minutes)"
                value={config.interval_minutes || 60}
                onChange={(value) => updateConfig('interval_minutes', value === '' ? 1 : value)}
                min={1}
                hint="Run workflow every N minutes"
              />
            ) : (
              <TextField
                label="Cron Expression"
                value={config.cron_expression || ''}
                onChange={(value) => updateConfig('cron_expression', value)}
                placeholder="0 0 * * *"
                hint="Standard cron syntax (minute hour day month weekday)"
              />
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
        <TextField
          label="Node Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setHasChanges(true);
            setValidationErrors((prev) => prev.filter((e) => e.field !== 'Node Name'));
          }}
          placeholder="Node name"
          required
          error={getFieldError('Node Name')}
        />

        <TextAreaField
          label="Description"
          value={description}
          onChange={(value) => {
            setDescription(value);
            setHasChanges(true);
          }}
          placeholder="Optional description"
          rows={2}
        />

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
