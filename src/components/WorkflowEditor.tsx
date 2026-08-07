import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './WorkflowNode';
import { intentMapToWorkflow, workflowToIntentMap, createDefaultWorkflow } from '../lib/workflow-engine';
import type { IntentMap } from '../types';
import { Sparkles, RotateCcw, Download, ArrowLeft } from 'lucide-react';

interface WorkflowEditorProps {
  intentMap: IntentMap | null;
  onChange?: (intentMap: IntentMap) => void;
  onClose?: () => void;
}

export default function WorkflowEditor({ intentMap, onChange, onClose }: WorkflowEditorProps) {
  const initial = useMemo(() => {
    if (intentMap?.screens?.length) {
      return intentMapToWorkflow(intentMap);
    }
    return createDefaultWorkflow();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes as unknown as Node[]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges as unknown as Edge[]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  const handleReset = useCallback(() => {
    const fresh = intentMap?.screens?.length
      ? intentMapToWorkflow(intentMap)
      : createDefaultWorkflow();
    setNodes(fresh.nodes as unknown as Node[]);
    setEdges(fresh.edges as unknown as Edge[]);
  }, [intentMap, setNodes, setEdges]);

  const handleSave = useCallback(() => {
    if (!onChange) return;
    const workflow = {
      nodes: nodes as unknown as Parameters<typeof workflowToIntentMap>[0]['nodes'],
      edges: edges as unknown as Parameters<typeof workflowToIntentMap>[0]['edges'],
    };
    const updated = workflowToIntentMap(workflow, intentMap || { screens: [], dataModels: [], actions: [], auth: false, pushNotifications: false, fileUploads: false, offlineFirst: false });
    onChange(updated);
  }, [nodes, edges, onChange, intentMap]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'echo-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const nodeCounts = useMemo(() => {
    const counts = { screens: 0, actions: 0, models: 0, decisions: 0 };
    nodes.forEach((n: Node) => {
      if (n.type === 'screen') counts.screens++;
      else if (n.type === 'action') counts.actions++;
      else if (n.type === 'dataModel') counts.models++;
      else if (n.type === 'decision') counts.decisions++;
    });
    return counts;
  }, [nodes]);

  return (
    <div className="h-full w-full relative" style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        deleteKeyCode="Backspace"
        multiSelectionKeyCode="Shift"
        className="rounded-xl bg-gray-50/50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls className="!rounded-lg !shadow-md !border !border-gray-200" />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case 'screen': return '#3b82f6';
              case 'action': return '#f59e0b';
              case 'dataModel': return '#10b981';
              case 'decision': return '#8b5cf6';
              default: return '#94a3b8';
            }
          }}
          className="!rounded-lg !shadow-md !border !border-gray-200"
          maskColor="rgba(0,0,0,0.1)"
        />

        <Panel position="top-left" className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">
              <b className="text-blue-600">{nodeCounts.screens}</b> screens
            </span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-500">
              <b className="text-amber-600">{nodeCounts.actions}</b> actions
            </span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-500">
              <b className="text-emerald-600">{nodeCounts.models}</b> models
            </span>
          </div>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Changes
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
