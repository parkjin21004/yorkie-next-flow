import type { NodeTypes } from "@xyflow/react";
import StartNode from "./start-node";
import TextNode from "./text-node";
import NumberNode from "./number-node";
import EndNode from "./end-node";

export const nodeTypes: NodeTypes = {
  start: StartNode,
  text: TextNode,
  number: NumberNode,
  end: EndNode,
};

export { StartNode, TextNode, NumberNode, EndNode };
