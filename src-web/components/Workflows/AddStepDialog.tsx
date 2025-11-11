import { createWorkspaceModel } from '@yaakapp-internal/models';
import { useState } from 'react';
import { useAllRequests } from '../../hooks/useAllRequests';
import { Button } from '../core/Button';
import { PlainInput } from '../core/PlainInput';
import { Select } from '../core/Select';

interface Props {
  workflowId: string;
  workspaceId: string;
  onCreate: (id: string) => void;
  hide: () => void;
}

export function AddStepDialog({ workflowId, workspaceId, onCreate, hide }: Props) {
  const allRequests = useAllRequests();
  const [name, setName] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  const selectedRequest = allRequests.find((r) => r.id === requestId);
  const requestModel = selectedRequest?.model ?? 'http_request';

  return (
    <form
      className="pb-3 flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!requestId) return;

        const id = await createWorkspaceModel({
          model: 'workflow_step',
          workflowId,
          workspaceId,
          name,
          requestId,
          requestModel,
          enabled: true,
          sortPriority: Date.now(),
          parentModel: 'workflow_step',
        });
        hide();
        onCreate(id);
      }}
    >
      <PlainInput
        label="Step Name"
        required
        defaultValue={name}
        onChange={setName}
        placeholder="Login and get token"
      />

      <Select
        label="Request"
        defaultValue={requestId}
        onChange={setRequestId}
        options={[
          { value: '', label: 'Select a request...' },
          ...allRequests.map((req) => ({
            value: req.id,
            label: `${req.name} (${req.model === 'http_request' ? req.method : 'gRPC'})`,
          })),
        ]}
      />

      <Button type="submit" color="secondary" className="mt-3" disabled={!requestId}>
        Add Step
      </Button>
    </form>
  );
}
