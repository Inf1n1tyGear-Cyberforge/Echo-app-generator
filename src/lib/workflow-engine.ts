import type { IntentMap, Screen, Action, DataModel } from '../types';

export interface WorkflowNode {
  id: string;
  type: 'screen' | 'action' | 'dataModel' | 'decision';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

let nodeCounter = 0;

function nextId(prefix: string): string {
  nodeCounter++;
  return `${prefix}-${nodeCounter}`;
}

export function intentMapToWorkflow(intent: IntentMap): WorkflowDefinition {
  if (!intent?.screens?.length) {
    return { nodes: [], edges: [] };
  }

  nodeCounter = 0;
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  const spacing = { x: 300, y: 180 };

  intent.screens.forEach((screen: Screen, si: number) => {
    const screenId = nextId('screen');
    nodes.push({
      id: screenId,
      type: 'screen',
      position: { x: spacing.x, y: si * spacing.y },
      data: {
        label: screen.name || `Screen ${si + 1}`,
        description: screen.description || '',
        components: screen.components || [],
        screen,
      },
    });

    (screen.components || []).forEach((comp: string, ci: number) => {
      const actionId = nextId('action');
      nodes.push({
        id: actionId,
        type: 'action',
        position: { x: spacing.x * 2 + 50, y: si * spacing.y + ci * 100 },
        data: {
          label: `Action: ${comp}`,
          component: comp,
          event: screen.events?.[ci]?.name || `interact-${comp}`,
        },
      });
      edges.push({
        id: `${screenId}->${actionId}`,
        source: screenId,
        target: actionId,
        label: comp,
        animated: true,
      });
    });
  });

  const dataModels = intent.dataModels || [];
  dataModels.forEach((model: DataModel, mi: number) => {
    const modelId = nextId('model');
    nodes.push({
      id: modelId,
      type: 'dataModel',
      position: { x: spacing.x * 3 + 100, y: mi * spacing.y },
      data: {
        label: model.name || `Model ${mi + 1}`,
        fields: model.fields || [],
      },
    });
    if (intent.screens[mi]) {
      const screenNode = nodes.find((n) => n.data.label === intent.screens[mi].name);
      if (screenNode) {
        edges.push({
          id: `${screenNode.id}->${modelId}`,
          source: screenNode.id,
          target: modelId,
          label: 'data',
          animated: true,
        });
      }
    }
  });

  return { nodes, edges };
}

export function workflowToIntentMap(
  workflow: WorkflowDefinition,
  original: IntentMap
): IntentMap {
  const screenNodes = workflow.nodes.filter((n) => n.type === 'screen');
  const actionNodes = workflow.nodes.filter((n) => n.type === 'action');
  const modelNodes = workflow.nodes.filter((n) => n.type === 'dataModel');

  // Sort by position for consistent ordering
  const sortedScreens = [...screenNodes].sort((a, b) => a.position.y - b.position.y);

  const newScreens: Screen[] = sortedScreens.map((sn) => {
    const incomingEdges = workflow.edges.filter((e) => e.target === sn.id);
    const outgoingEdges = workflow.edges.filter((e) => e.source === sn.id);

    const screenComponents: string[] = [];
    const events: Action[] = [];

    outgoingEdges.forEach((edge) => {
      const targetNode = actionNodes.find((n) => n.id === edge.target);
      if (targetNode) {
        screenComponents.push((targetNode.data.component as string) || edge.label || 'component');
        events.push({
          name: (targetNode.data.event as string) || 'interact',
          trigger: 'user',
          target: (edge.label as string) || '',
        });
      }
    });

    return {
      name: (sn.data.label as string) || 'Screen',
      description: (sn.data.description as string) || '',
      components: screenComponents,
      events,
    };
  });

  const newDataModels: DataModel[] = modelNodes.map((mn) => ({
    name: (mn.data.label as string) || 'Model',
    fields: (mn.data.fields as Array<{ name: string; type: string }>) || [],
  }));

  return {
    ...original,
    screens: newScreens,
    dataModels: newDataModels.length > 0 ? newDataModels : original.dataModels,
  };
}

export function createDefaultWorkflow(): WorkflowDefinition {
  nodeCounter = 0;
  return {
    nodes: [
      {
        id: nextId('screen'),
        type: 'screen',
        position: { x: 0, y: 0 },
        data: { label: 'Home Screen', description: 'Main entry point', components: ['Header', 'Button'] },
      },
      {
        id: nextId('action'),
        type: 'action',
        position: { x: 350, y: 0 },
        data: { label: 'Navigate', component: 'Button', event: 'onPress' },
      },
      {
        id: nextId('model'),
        type: 'dataModel',
        position: { x: 700, y: 0 },
        data: { label: 'User', fields: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }] },
      },
    ],
    edges: [
      { id: 'screen-1->action-1', source: 'screen-1', target: 'action-1', label: 'Button', animated: true },
      { id: 'action-1->model-1', source: 'action-1', target: 'model-1', label: 'data', animated: true },
    ],
  };
}
