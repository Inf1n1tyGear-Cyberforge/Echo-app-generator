import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Smartphone, Zap, Database, GitFork } from 'lucide-react';

type WorkflowNodeData = {
  label: string;
  description?: string;
  components?: string[];
  fields?: Array<{ name: string; type: string }>;
  screen?: Record<string, unknown>;
  component?: string;
  event?: string;
};

function ScreenNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={`min-w-[200px] rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-200 ${
        selected ? 'border-primary shadow-primary/20 scale-105' : 'border-gray-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-blue-100 p-1.5">
          <Smartphone className="w-4 h-4 text-blue-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">{d.label}</span>
      </div>
      {d.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{d.description}</p>
      )}
      {d.components && d.components.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {d.components.slice(0, 4).map((c, i) => (
            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {c}
            </span>
          ))}
          {d.components.length > 4 && (
            <span className="text-[10px] text-gray-400">+{d.components.length - 4}</span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  );
}

function ActionNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={`min-w-[180px] rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-200 ${
        selected ? 'border-amber-500 shadow-amber-500/20 scale-105' : 'border-amber-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-amber-100 p-1.5">
          <Zap className="w-4 h-4 text-amber-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">{d.label}</span>
      </div>
      {d.event && (
        <p className="text-xs text-gray-500">
          Trigger: <code className="text-amber-600 bg-amber-50 px-1 rounded">{d.event}</code>
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3" />
    </div>
  );
}

function DataModelNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={`min-w-[200px] rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-200 ${
        selected ? 'border-emerald-500 shadow-emerald-500/20 scale-105' : 'border-emerald-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-emerald-100 p-1.5">
          <Database className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">{d.label}</span>
      </div>
      {d.fields && d.fields.length > 0 && (
        <div className="space-y-1">
          {d.fields.map((f, i) => (
            <div key={i} className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded">
              <span className="text-gray-700 font-mono">{f.name}</span>
              <span className="text-gray-400">{f.type}</span>
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}

function DecisionNode({ data, selected }: NodeProps) {
  const d = data as unknown as WorkflowNodeData;
  return (
    <div
      className={`min-w-[160px] -rotate-12 rounded-xl border-2 bg-white p-4 shadow-lg transition-all duration-200 ${
        selected ? 'border-purple-500 shadow-purple-500/20 scale-105' : 'border-purple-200'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2 rotate-12">
        <div className="rounded-lg bg-purple-100 p-1.5">
          <GitFork className="w-4 h-4 text-purple-600" />
        </div>
        <span className="font-semibold text-sm text-gray-900">{d.label || 'Decision'}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}

export const nodeTypes = {
  screen: memo(ScreenNode),
  action: memo(ActionNode),
  dataModel: memo(DataModelNode),
  decision: memo(DecisionNode),
};

export type NodeType = keyof typeof nodeTypes;
