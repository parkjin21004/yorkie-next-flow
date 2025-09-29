import type { Node, Edge } from "@xyflow/react";
import type { JSONArray } from "@yorkie-js/react";

export type TextNodeData = {
  value?: string;
};

export type NumberNodeData = {
  value?: number;
};

export type NodeData = (
  | TextNodeData
  | NumberNodeData
  | Record<string, unknown>
) & {
  value?: string | number;
};

export type FlowNode = Node<NodeData>;

export type Graph = {
  nodes: JSONArray<FlowNode>;
  edges: JSONArray<Edge>;
};

export type YorkieUpdate = (updater: (root: Graph) => void) => void;
