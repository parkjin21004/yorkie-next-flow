"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { NumberNodeData } from "../types";

type NumberNodeType = Node<NumberNodeData, "number">;

export default function NumberNode({ data }: NodeProps<NumberNodeType>) {
  return (
    <div className="rounded border px-3 py-2 bg-white text-xs">
      <div className="font-medium mb-1">Number</div>
      <div>{data?.value ?? 0}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
