"use client";

import { Panel, useReactFlow, useOnSelectionChange } from "@xyflow/react";
import { useRef, useState } from "react";
import type { Graph, FlowNode } from "./types";
import { useDocument } from "@yorkie-js/react";

export default function FlowActions() {
  const reactFlow = useReactFlow();
  const { update } = useDocument<Graph>();
  const selectionRef = useRef<{ nodeIds: string[]; edgeIds: string[] }>({
    nodeIds: [],
    edgeIds: [],
  });
  const [hasSelection, setHasSelection] = useState(false);

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      selectionRef.current = {
        nodeIds: nodes.map((n) => n.id),
        edgeIds: edges.map((e) => e.id),
      };
      setHasSelection(nodes.length > 0 || edges.length > 0);
    },
  });

  const handleRemove = () => {
    const { nodeIds, edgeIds } = selectionRef.current;
    if (!nodeIds.length && !edgeIds.length) return;
    reactFlow.deleteElements({
      nodes: nodeIds.map((id) => ({ id })),
      edges: edgeIds.map((id) => ({ id })),
    });
  };

  const baseBtn =
    "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-primary)_35%,transparent)] disabled:opacity-50 disabled:pointer-events-none";
  const btnPrimary =
    baseBtn +
    " bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] border border-[color-mix(in_oklab,var(--color-primary)_60%,black_10%)] hover:bg-[color-mix(in_oklab,var(--color-primary)_92%,white_8%)]";
  const btnSubtle =
    baseBtn +
    " bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[color-mix(in_oklab,var(--color-surface)_92%,white_8%)]";

  const addStart = () => {
    update((r) => {
      const id = crypto.randomUUID();
      r.nodes.push({
        id,
        type: "start",
        data: {},
        position: { x: 60, y: 100 },
      } as FlowNode);
    });
  };
  const addText = () => {
    update((r) => {
      const id = crypto.randomUUID();
      r.nodes.push({
        id,
        type: "text",
        data: { value: "" },
        position: { x: 140, y: 100 },
      } as FlowNode);
    });
  };
  const addNumber = () => {
    update((r) => {
      const id = crypto.randomUUID();
      r.nodes.push({
        id,
        type: "number",
        data: { value: 0 },
        position: { x: 140, y: 160 },
      } as FlowNode);
    });
  };
  const addEnd = () => {
    update((r) => {
      const id = crypto.randomUUID();
      r.nodes.push({
        id,
        type: "end",
        data: {},
        position: { x: 360, y: 120 },
      } as FlowNode);
    });
  };

  return (
    <Panel position="top-left">
      <div className="flex gap-2">
        <button className={`${btnPrimary} px-3 py-2`} onClick={addStart}>
          Add Start
        </button>
        <button className={`${btnPrimary} px-3 py-2`} onClick={addText}>
          Add Text
        </button>
        <button className={`${btnPrimary} px-3 py-2`} onClick={addNumber}>
          Add Number
        </button>
        <button className={`${btnPrimary} px-3 py-2`} onClick={addEnd}>
          Add End
        </button>
        <button
          className={`${btnSubtle} px-3 py-2`}
          onClick={handleRemove}
          disabled={!hasSelection}
        >
          Remove
        </button>
      </div>
    </Panel>
  );
}
