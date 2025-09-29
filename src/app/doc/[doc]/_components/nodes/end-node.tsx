"use client";

import {
  Handle,
  Position,
  useNodeId,
  useNodes,
  useEdges,
  type Node,
} from "@xyflow/react";
import type { NodeData } from "../types";

export default function EndNode() {
  const nodeId = useNodeId();
  const nodes = useNodes();
  const edges = useEdges();

  const incoming = edges.filter((e) => e.target === nodeId);
  const values = incoming
    .map(
      (e) => nodes.find((n) => n.id === e.source) as Node<NodeData> | undefined
    )
    .map((n) => (n?.data as NodeData)?.value)
    .filter((v) => v !== undefined);

  return (
    <div className="rounded border px-3 py-2 bg-slate-50 text-xs">
      <div className="font-medium mb-1">End</div>
      <ul className="list-disc pl-4">
        {values.map((v, i) => (
          <li key={i} className="whitespace-pre-wrap break-words">
            {String(v)}
          </li>
        ))}
      </ul>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
