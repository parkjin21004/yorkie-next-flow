"use client";

import { Panel, useOnSelectionChange, type Node } from "@xyflow/react";
import { useRef, useState } from "react";
import { useDocument } from "@yorkie-js/react";
import type { Graph, NodeData } from "./types";
import {
  useStableTextareaCaret,
  computeSingleSplice,
} from "../_hook/use-stable-textarea-caret";

export default function InspectorPanel() {
  const selectionRef = useRef<{ nodeId?: string }>({});
  const [selected, setSelected] = useState<Node<NodeData> | null>(null);
  const { update } = useDocument<Graph>();

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const node = nodes[0] as Node<NodeData> | undefined;
      selectionRef.current.nodeId = node?.id;
      setSelected(node ?? null);
    },
  });

  const selectedId = selected?.id;
  const selectedType = selected?.type;
  const selectedValue = selected?.data?.value as string | number | undefined;

  const isText = selectedType === "text";
  const isNumber = selectedType === "number";

  const textValue = typeof selectedValue === "string" ? selectedValue : "";
  const numberRaw =
    typeof selectedValue === "number"
      ? String(selectedValue)
      : typeof selectedValue === "string"
      ? selectedValue
      : "";

  const textCaret = useStableTextareaCaret(textValue, (next) => {
    if (!selectedId) return;
    update((r) => {
      const idx = r.nodes.findIndex((n) => n.id === selectedId);
      if (idx === -1) return;
      const node = r.nodes[idx] as unknown as { data?: NodeData };
      const prevStr = String(
        (node.data?.value as string | number | undefined) ?? ""
      );
      const s = computeSingleSplice(prevStr, next);
      if (!s) return;
      const nextStr =
        prevStr.slice(0, s.start) + s.insert + prevStr.slice(s.end);
      (r.nodes[idx] as unknown as { data: NodeData }).data = {
        ...(node.data ?? {}),
        value: nextStr,
      };
    });
  });

  const numberCaret = useStableTextareaCaret(numberRaw, (next) => {
    if (!selectedId) return;
    update((r) => {
      const idx = r.nodes.findIndex((n) => n.id === selectedId);
      if (idx === -1) return;
      const node = r.nodes[idx] as unknown as { data?: NodeData };
      const prevStr = String(
        (node.data?.value as string | number | undefined) ?? ""
      );
      const s = computeSingleSplice(prevStr, next);
      if (!s) return;
      const nextStr =
        prevStr.slice(0, s.start) + s.insert + prevStr.slice(s.end);
      (r.nodes[idx] as unknown as { data: NodeData }).data = {
        ...(node.data ?? {}),
        value: nextStr,
      };
    });
  });

  if (!selected) return null;

  return (
    <Panel position="top-right">
      <div className="w-80 h-80 rounded border bg-white p-3 shadow overflow-auto text-xs">
        <div className="font-semibold mb-2">Inspector</div>
        <div className="text-slate-500 mb-2">
          id: {selected.id} / type: {selected.type}
        </div>

        {isText && (
          <textarea
            ref={textCaret.ref as React.RefObject<HTMLTextAreaElement>}
            className="w-full border rounded px-2 py-1 resize-y min-h-24 text-xs"
            rows={6}
            value={textValue}
            {...textCaret.props}
          />
        )}

        {isNumber && (
          <input
            ref={numberCaret.ref as React.RefObject<HTMLInputElement>}
            type="text"
            inputMode="numeric"
            className="w-full border rounded px-2 py-1 text-xs"
            value={numberRaw}
            {...numberCaret.props}
          />
        )}

        {!isText && !isNumber && (
          <div className="text-sm text-slate-500">
            편집할 데이터가 없습니다.
          </div>
        )}
      </div>
    </Panel>
  );
}
