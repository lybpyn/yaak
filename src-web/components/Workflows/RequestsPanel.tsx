import type { GrpcRequest, HttpRequest, WebsocketRequest } from '@yaakapp-internal/models';
import { useAllRequests } from '../../hooks/useAllRequests';
import { useMemo, useState } from 'react';
import classNames from 'classnames';
import { PlainInput } from '../core/PlainInput';

interface Props {
  workspaceId: string;
}

type AnyRequest = HttpRequest | GrpcRequest | WebsocketRequest;

export function RequestsPanel({ workspaceId }: Props) {
  const allRequests = useAllRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [clickStatus, setClickStatus] = useState('');

  const workspaceRequests = useMemo(() => {
    if (!allRequests || !workspaceId) return [];
    return allRequests.filter((r) => r.workspaceId === workspaceId);
  }, [allRequests, workspaceId]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return workspaceRequests;
    const query = searchQuery.toLowerCase();
    return workspaceRequests.filter((r) =>
      r.name.toLowerCase().includes(query) ||
      r.url.toLowerCase().includes(query)
    );
  }, [workspaceRequests, searchQuery]);


  const getRequestIcon = (request: AnyRequest) => {
    if (request.model === 'http_request') {
      const method = (request as HttpRequest).method;
      return (
        <span className={classNames(
          'text-xs font-semibold px-1.5 py-0.5 rounded',
          {
            'bg-green-500/20 text-green-400': method === 'GET',
            'bg-blue-500/20 text-blue-400': method === 'POST',
            'bg-yellow-500/20 text-yellow-400': method === 'PUT',
            'bg-orange-500/20 text-orange-400': method === 'PATCH',
            'bg-red-500/20 text-red-400': method === 'DELETE',
            'bg-gray-500/20 text-gray-400': !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method),
          }
        )}>
          {method}
        </span>
      );
    } else if (request.model === 'grpc_request') {
      return <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">gRPC</span>;
    } else {
      return <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">WS</span>;
    }
  };

  return (
    <div className="h-full flex flex-col border-r border-border bg-surface">
      {/* Click Status */}
      {clickStatus && (
        <div className="px-4 py-2 bg-green-500/20 text-green-300 text-xs border-b border-green-500/30">
          {clickStatus}
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold mb-2">API Requests</h3>
        <PlainInput
          placeholder="Search requests..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="text-sm"
        />
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRequests.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-subtle text-sm">
            {searchQuery ? 'No requests found' : 'No requests in workspace'}
          </div>
        ) : (
          <div className="p-2">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  // Emit a custom event that WorkflowCanvas can listen to
                  window.dispatchEvent(new CustomEvent('addWorkflowStep', {
                    detail: {
                      requestId: request.id,
                      requestModel: request.model,
                      name: request.name,
                    }
                  }));
                  setClickStatus(`✓ Added to workflow`);
                  setTimeout(() => setClickStatus(''), 2000);
                }}
                className={classNames(
                  'flex items-center gap-2 px-3 py-2 mb-1 rounded cursor-pointer',
                  'hover:bg-surface-highlight transition-colors'
                )}
                title={`Click to add ${request.name} to workflow`}
              >
                {getRequestIcon(request)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{request.name}</div>
                  <div className="text-xs text-text-subtle truncate">{request.url}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-text-subtle">
          Click on a request to add it to the workflow
        </p>
      </div>
    </div>
  );
}
