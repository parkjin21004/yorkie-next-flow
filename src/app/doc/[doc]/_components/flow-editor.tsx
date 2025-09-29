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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDocument } from "@yorkie-js/react";
import { useCallback, useMemo } from "react";
import { nodeTypes } from "./nodes";
import FlowActions from "./flow-action";
import InspectorPanel from "./inspector-panel";
import type { Graph } from "./types";

export default function FlowEditor() {
  const { root, update, loading, error } = useDocument<Graph>();

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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="fixed inset-0 h-screen">
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
    </div>
  );
}
