"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDocument, usePresences } from "@yorkie-js/react";
import { useCallback, useMemo } from "react";
import { nodeTypes } from "./nodes";
import FlowActions from "./flow-action";
import InspectorPanel from "./inspector-panel";
import type { Graph } from "./types";

type PresenceData = { username?: string; cursor?: { x: number; y: number } };

export default function FlowEditor() {
  const { doc, root, update, loading, error } = useDocument<
    Graph,
    PresenceData
  >();
  const presences = usePresences<PresenceData>();

  const nodes = useMemo(
    () => [...root.nodes].filter(Boolean) as Node[],
    [root.nodes]
  );
  const edges = useMemo(
    () => [...root.edges].filter(Boolean) as Edge[],
    [root.edges]
  );

  const onNodesChange = useCallback(
    (changes: Array<NodeChange>) => {
      update((r) => {
        for (const c of changes) {
          switch (c.type) {
            case "add":
              r.nodes.push(c.item);
              break;
            case "replace": {
              const idx = r.nodes.findIndex((n) => n.id === c.id);
              if (idx !== -1) r.nodes[idx] = c.item;
              break;
            }
            case "remove": {
              const idx = r.nodes.findIndex((n) => n.id === c.id);
              if (idx !== -1) r.nodes.delete?.(idx);
              break;
            }
            case "position": {
              const idx = r.nodes.findIndex((n) => n.id === c.id);
              if (idx !== -1 && c.position) r.nodes[idx].position = c.position;
              break;
            }
            case "select": {
              const idx = r.nodes.findIndex((n) => n.id === c.id);
              if (idx !== -1) r.nodes[idx].selected = c.selected;
              break;
            }
            default:
              break;
          }
        }
      });
    },
    [update]
  );

  const onEdgesChange = useCallback(
    (changes: Array<EdgeChange>) => {
      update((r) => {
        for (const c of changes) {
          switch (c.type) {
            case "add":
              r.edges.push(c.item);
              break;
            case "replace": {
              const idx = r.edges.findIndex((e) => e.id === c.id);
              if (idx !== -1) r.edges[idx] = c.item;
              break;
            }
            case "remove": {
              const idx = r.edges.findIndex((e) => e.id === c.id);
              if (idx !== -1) r.edges.delete?.(idx);
              break;
            }
            case "select": {
              const idx = r.edges.findIndex((e) => e.id === c.id);
              if (idx !== -1) r.edges[idx].selected = c.selected;
              break;
            }
            default:
              break;
          }
        }
      });
    },
    [update]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const src = nodes.find((n) => n.id === connection.source);
      const tgt = nodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return;
      // 연결 제약: end는 source 불가, start는 target 불가
      if (src.type === "end") return;
      if (tgt.type === "start") return;
      update((r) => {
        const already = r.edges.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle &&
            e.targetHandle === connection.targetHandle
        );
        if (already) return;
        const id = crypto.randomUUID();
        r.edges.push({
          id,
          type: "bezier",
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        });
      });
    },
    [nodes, update]
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      update((r) => {
        const idx = r.nodes.findIndex((n) => n.id === node.id);
        if (idx !== -1) r.nodes[idx].position = node.position;
      });
    },
    [update]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      if (!connection.source || !connection.target) return;
      update((r) => {
        const idx = r.edges.findIndex((e) => e.id === oldEdge.id);
        if (idx === -1) return;
        r.edges[idx].source = connection.source;
        r.edges[idx].target = connection.target;
        r.edges[idx].sourceHandle = connection.sourceHandle;
        r.edges[idx].targetHandle = connection.targetHandle;
      });
    },
    [update]
  );

  const onCursor = useCallback(
    (pos: { x: number; y: number }) => {
      update((_, presence) => {
        presence.set({ cursor: pos });
      });
    },
    [update]
  );

  if (loading) return <div className="p-4">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <ReactFlowProvider>
      <FlowInner
        doc={doc}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onNodeDragStop={onNodeDragStop}
        onCursor={onCursor}
        presences={presences}
      />
    </ReactFlowProvider>
  );
}

function FlowInner({
  doc,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onNodeDragStop,
  onCursor,
  presences,
}: {
  doc: unknown;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (c: Array<NodeChange>) => void;
  onEdgesChange: (c: Array<EdgeChange>) => void;
  onConnect: (c: Connection) => void;
  onReconnect: (e: Edge, c: Connection) => void;
  onNodeDragStop: (_: unknown, n: Node) => void;
  onCursor: (p: { x: number; y: number }) => void;
  presences: ReturnType<typeof usePresences<PresenceData>>;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onCursor({ x: point.x, y: point.y });
    },
    [onCursor, screenToFlowPosition]
  );

  return (
    <div onMouseMove={onMouseMove} className="fixed inset-0 h-screen">
      <ReactFlow
        defaultEdgeOptions={{
          type: "bezier",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onNodeDragStop={onNodeDragStop}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={10} size={1} color="silver" />
        <Controls />
        <MiniMap />
        <FlowActions />
        <InspectorPanel />
      </ReactFlow>
      {/* Remote cursors overlay */}
      {presences
        .filter(({ clientID }) => {
          type ClientLike =
            | { getClientID?: () => string }
            | { getClient?: () => { getID?: () => string } }
            | undefined;
          const d = doc as ClientLike;
          const selfId =
            (d && "getClientID" in d && typeof d.getClientID === "function"
              ? d.getClientID()
              : undefined) ??
            (d && "getClient" in d && typeof d.getClient === "function"
              ? d.getClient()?.getID?.()
              : undefined);
          return selfId ? clientID !== selfId : true;
        })
        .map(({ clientID, presence }) => {
          const fx = presence?.cursor?.x;
          const fy = presence?.cursor?.y;
          if (typeof fx !== "number" || typeof fy !== "number") return null;
          const sx = viewportX + fx * zoom;
          const sy = viewportY + fy * zoom;
          const name = presence?.username ?? "익명";
          return (
            <div
              key={clientID}
              className="pointer-events-none absolute"
              style={{ left: sx, top: sy, transform: "translate(-50%, -100%)" }}
            >
              <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-[var(--shadow-soft)]" />
              <div className="mt-1 px-2 py-0.5 text-xs rounded bg-[color-mix(in_oklab,var(--color-primary)_10%,white_90%)] border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap">
                {name}
              </div>
            </div>
          );
        })}
    </div>
  );
}
