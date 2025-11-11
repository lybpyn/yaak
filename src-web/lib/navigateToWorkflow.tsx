import { router } from './router';

export async function navigateToWorkflow({ workspaceId }: { workspaceId: string }) {
  await router.navigate({
    to: '/workspaces/$workspaceId/workflows',
    params: { workspaceId },
  });
}
