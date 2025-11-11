import { createWorkspaceModel } from '@yaakapp-internal/models';
import { useState } from 'react';
import { Button } from '../core/Button';
import { PlainInput } from '../core/PlainInput';
import { Textarea } from '../core/Textarea';

interface Props {
  onCreate: (id: string) => void;
  hide: () => void;
  workspaceId: string;
}

export function CreateWorkflowDialog({ workspaceId, hide, onCreate }: Props) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  return (
    <form
      className="pb-3 flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const id = await createWorkspaceModel({
          model: 'workflow',
          name,
          description: description || null,
          workspaceId,
          environmentId: null,
          sortPriority: Date.now(),
          parentModel: 'workflow',
        });
        hide();
        onCreate(id);
      }}
    >
      <PlainInput
        label="Name"
        required
        defaultValue={name}
        onChange={setName}
        placeholder="My Test Workflow"
      />
      <Textarea
        label="Description"
        placeholder="Optional description of what this workflow does"
        value={description}
        onChange={setDescription}
        rows={3}
      />
      <Button type="submit" color="secondary" className="mt-3">
        Create Workflow
      </Button>
    </form>
  );
}
