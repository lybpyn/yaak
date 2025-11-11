import type { Workflow } from '@yaakapp-internal/models';
import { patchModel } from '@yaakapp-internal/models';
import { useCallback, useState } from 'react';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { Button } from '../core/Button';
import { Dialog } from '../core/Dialog';
import { PlainInput } from '../core/PlainInput';
import { Textarea } from '../core/Textarea';
import { AddStepDialog } from './AddStepDialog';
import { WorkflowStepCard } from './WorkflowStepCard';
import { WorkflowExecutionButton } from './WorkflowExecutionButton';

interface Props {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow }: Props) {
  const steps = useWorkflowSteps(workflow.id);
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description ?? '');
  const [showAddStep, setShowAddStep] = useState(false);

  const handleNameChange = useCallback(
    async (newName: string) => {
      setName(newName);
      await patchModel(workflow.id, { name: newName });
    },
    [workflow.id],
  );

  const handleDescriptionChange = useCallback(
    async (newDescription: string) => {
      setDescription(newDescription);
      await patchModel(workflow.id, { description: newDescription || null });
    },
    [workflow.id],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <PlainInput
          label="Workflow Name"
          defaultValue={name}
          onChange={handleNameChange}
          placeholder="My Test Workflow"
          className="mb-3"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Steps</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddStep(true)}>
              Add Step
            </Button>
            <WorkflowExecutionButton workflow={workflow} />
          </div>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 text-text-subtle">
            <p className="mb-4">No steps yet</p>
            <Button onClick={() => setShowAddStep(true)}>Add First Step</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <WorkflowStepCard
                key={step.id}
                step={step}
                stepNumber={index + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Step Dialog */}
      <Dialog
        open={showAddStep}
        onClose={() => setShowAddStep(false)}
        title="Add Step"
        size="md"
      >
        <AddStepDialog
          workflowId={workflow.id}
          workspaceId={workflow.workspaceId}
          onCreate={() => setShowAddStep(false)}
          hide={() => setShowAddStep(false)}
        />
      </Dialog>
    </div>
  );
}
