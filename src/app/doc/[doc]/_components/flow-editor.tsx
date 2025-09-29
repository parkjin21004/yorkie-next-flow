"use client";

import {
  ReactFlow,
  Background,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { JSONArray, useDocument } from "@yorkie-js/react";
import { useCallback, useMemo, useRef } from "react";
import Toolbar from "@/app/doc/[doc]/_components/toolbar";

export type Graph = {
  nodes: JSONArray<Node>;
  edges: JSONArray<Edge>;
};

export default function FlowEditor() {
  const { root, update, loading, error } = useDocument<Graph>();
  const edgeIdRef = useRef(0);

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
      update((r) => {
        const already = r.edges.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle &&
            e.targetHandle === connection.targetHandle
        );
        if (already) return;
        const id = `e-${connection.source}-${
          connection.target
        }-${edgeIdRef.current++}`;
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
    [update]
  );

  if (loading) return <div className="p-4">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="fixed inset-0 h-screen">
      <Toolbar
        onAdd={() => {
          update((r) => {
            const id = `n-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`;
            r.nodes.push({
              id,
              data: { label: "Node" },
              position: { x: 100, y: 100 },
            } as Node);
          });
        }}
      />
      <ReactFlow
        defaultEdgeOptions={{
          type: "bezier",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background gap={10} size={1} color="silver" />
      </ReactFlow>
    </div>
  );
}
