"use client";

import { Handle, Position } from "@xyflow/react";

export default function StartNode() {
  return (
    <div className="rounded-full border px-3 py-2 bg-emerald-50 text-emerald-700">
      Start
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
