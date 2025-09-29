"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { TextNodeData } from "../types";

type TextNodeType = Node<TextNodeData, "text">;

export default function TextNode({ data }: NodeProps<TextNodeType>) {
  return (
    <div className="rounded border px-3 py-2 bg-white text-xs">
      <div className="font-medium mb-1">Text</div>
      <div className="whitespace-pre-wrap break-words">{data?.value ?? ""}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
