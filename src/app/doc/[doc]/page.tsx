"use client";

import type { Node, Edge } from "@xyflow/react";
import { DocumentProvider, YorkieProvider, JSONArray } from "@yorkie-js/react";
import FlowEditor, {
  type Graph,
} from "@/app/doc/[doc]/_components/flow-editor";
import { useParams } from "next/navigation";

const initialRoot: Graph = {
  nodes: [] as unknown as JSONArray<Node>,
  edges: [] as unknown as JSONArray<Edge>,
};

export default function DocPage() {
  const params = useParams();
  const apiKey = process.env.NEXT_PUBLIC_YORKIE_API_KEY;
  const rpcAddr = process.env.NEXT_PUBLIC_YORKIE_API_ADDR;

  if (!apiKey || !rpcAddr) {
    return (
      <div className="p-6 text-sm">
        <p className="mb-2 font-medium">환경 변수가 필요합니다.</p>
        <p>
          NEXT_PUBLIC_YORKIE_API_KEY, NEXT_PUBLIC_YORKIE_API_ADDR 를 설정한 뒤
          다시 시도하세요.
        </p>
      </div>
    );
  }

  return (
    <YorkieProvider apiKey={apiKey} rpcAddr={rpcAddr}>
      <DocumentProvider docKey={params.doc as string} initialRoot={initialRoot}>
        <FlowEditor />
      </DocumentProvider>
    </YorkieProvider>
  );
}
