## React Flow 노드/패널 구현 계획

### 디렉토리 구조 (제안 및 적용)

```
src/app/doc/[doc]/_components/
  types.ts                  # Graph, Node data 타입
  FlowActions.tsx           # 우상단 Add/Remove 패널
  InspectorPanel.tsx        # 우측 Inspector 패널
  nodes/
    index.ts                # nodeTypes export
    StartNode.tsx
    TextNode.tsx
    NumberNode.tsx
    EndNode.tsx
```

### 요구사항 요약

- **text / number 노드 추가**: `data.value`로 상태 보관
- **start 노드 추가**: 출력 핸들만 존재, 값 없음
- **end 노드 추가**: 입력 핸들만 존재, 유입되는 입력의 값을 리스트로 표시
- **데이터 편집 UI**: 우측 `Panel` 기반 Inspector(단일 선택 노드의 값 편집)

참고: React Flow API와 예시는 아래 문서를 기준으로 합니다.

- API Reference: https://reactflow.dev/api-reference
- Computing Flows Example: https://reactflow.dev/examples/interaction/computing-flows

---

### 전체 설계 개요

1. **커스텀 노드 4종**을 정의하고 `nodeTypes`로 등록
   - `start`, `text`, `number`, `end`
   - 각 노드에서 `Handle`과 `Position`을 사용해 입출력 핸들을 구성
2. **추가 UI(FlowActions)**: 우상단 `Panel`에 4개 버튼(Start/Text/Number/End)으로 분리
3. **연결 제약**: `onConnect`에서 `start` 입력 금지, `end` 출력 금지
4. **Inspector 패널**: 선택된 노드의 타입에 따라 `data.value`를 편집(`text`/`number`만). `start`/`end`는 읽기 전용
5. **end 노드 값 표시**: 유입 간선 목록을 바탕으로 소스 노드의 `data.value`를 리스트로 렌더링

데이터 소스는 기존과 동일하게 Yorkie(`useDocument<Graph>`)의 `nodes`/`edges`를 사용하며, 모든 변경은 `update` 클로저 내에서 수행합니다.

---

### 노드 타입 정의

- 파일: `src/app/doc/[doc]/_components/flow-editor.tsx`
- 추가/변경 사항
  - `StartNode`, `TextNode`, `NumberNode`, `EndNode` 컴포넌트 추가
  - `const nodeTypes = { start: StartNode, text: TextNode, number: NumberNode, end: EndNode }` 등록 후 `<ReactFlow nodeTypes={nodeTypes} />` 지정
  - 파일 분리: 위 4개 노드는 `src/app/doc/[doc]/_components/nodes/`에 두고, `nodes/index.ts`에서 `nodeTypes`를 export
  - 공용 타입은 `src/app/doc/[doc]/_components/types.ts`에 정의

간단한 형태(스타일 생략):

```tsx
import {
  Handle,
  Position,
  NodeProps,
  useNodeId,
  useNodes,
  useEdges,
} from "@xyflow/react";

function StartNode() {
  return (
    <div>
      Start
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function TextNode({ data }: NodeProps<{ value?: string }>) {
  return (
    <div>
      <div>Text</div>
      <div>{data?.value ?? ""}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function NumberNode({ data }: NodeProps<{ value?: number }>) {
  return (
    <div>
      <div>Number</div>
      <div>{data?.value ?? 0}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function EndNode() {
  const nodeId = useNodeId();
  const nodes = useNodes();
  const edges = useEdges();
  const incoming = edges.filter((e) => e.target === nodeId);
  const values = incoming
    .map((e) => nodes.find((n) => n.id === e.source))
    .map((n) => (n?.data as NodeData)?.value)
    .filter((v) => v !== undefined);

  return (
    <div>
      <div>End</div>
      <ul>
        {values.map((v, i) => (
          <li key={i}>{String(v)}</li>
        ))}
      </ul>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
```

> 참고: 유입 노드 계산은 `getIncomers` 유틸로 대체할 수도 있습니다. 자세한 사용법은 API Reference의 Utils 섹션과 Computing Flows 예시를 참고하세요.

---

### 노드 추가 UI (FlowActions)

- 기존 `Add` 단일 버튼을 `Add Start / Add Text / Add Number / Add End` 4개로 분리
- 예시 생성 로직:

```tsx
// Start
update((r) => {
  const id = crypto.randomUUID();
  r.nodes.push({
    id,
    type: "start",
    data: {},
    position: { x: 60, y: 100 },
  } as any);
});

// Text
update((r) => {
  const id = crypto.randomUUID();
  r.nodes.push({
    id,
    type: "text",
    data: { value: "" },
    position: { x: 140, y: 100 },
  } as any);
});

// Number
update((r) => {
  const id = crypto.randomUUID();
  r.nodes.push({
    id,
    type: "number",
    data: { value: 0 },
    position: { x: 140, y: 160 },
  } as any);
});

// End
update((r) => {
  const id = crypto.randomUUID();
  r.nodes.push({
    id,
    type: "end",
    data: {},
    position: { x: 360, y: 120 },
  } as any);
});
```

---

### 연결 제약

- `onConnect`에서 소스/타겟 노드 타입 검사
  - `end` → 출력 금지(소스가 `end`면 거절)
  - `start` → 입력 금지(타겟이 `start`면 거절)
- 중복 간선은 기존 로직처럼 차단

간단 로직:

```tsx
const onConnect = useCallback(
  (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const src = nodes.find((n) => n.id === connection.source);
    const tgt = nodes.find((n) => n.id === connection.target);
    if (!src || !tgt) return;
    if (src.type === "end") return; // end는 source 불가
    if (tgt.type === "start") return; // start는 target 불가
    // ...이후 기존 edge 추가 로직 실행
  },
  [nodes, update]
);
```

> 더 강한 제약이 필요하면 `Handle`의 `isValidConnection` 프로퍼티로 핸들 단위 차단을 적용할 수 있습니다. (API Reference 참고)

---

### Inspector 패널 (데이터 편집)

- 위치: `<ReactFlow>` 내부 우측 상단 `Panel position="top-right"`
- 동작: 단일 선택 노드에 대해 타입별 입력폼 렌더링
  - `text` → 텍스트 입력으로 `data.value` 갱신
  - `number` → 숫자 입력으로 `data.value` 갱신
  - `start`/`end` → 편집 불가 메시지 표시
- 상태 반영: Yorkie `update`로 `nodes[idx].data.value` 갱신
- 파일: `src/app/doc/[doc]/_components/InspectorPanel.tsx`

핵심 처리:

```tsx
// 선택 변경 감지: useOnSelectionChange -> selected 노드 보관
// 입력 onChange 시 update((r) => r.nodes[idx].data = { ...prev, value: next })
```

---

### 스타일 및 UX

- 기존 버튼 스타일 유지를 위해 `FlowActions` 클래스 재사용
- 노드 박스는 테마와 일관되게 `border`, `rounded`, `bg-*` 사용
- `EndNode` 리스트는 스크롤이 필요할 경우 최소 높이와 `overflow-auto` 지정 고려

---

### 구현 체크리스트

- [ ] `StartNode`, `TextNode`, `NumberNode`, `EndNode` 추가 및 `nodeTypes` 등록
- [ ] `FlowActions`에서 4개 Add 버튼 제공
- [ ] `onConnect`에 타입 기반 연결 제약 적용
- [ ] `InspectorPanel` 추가 및 값 편집 반영(`text`/`number`)
- [ ] `EndNode`에서 유입 값 리스트 표시

---

### 참고 문서

- React Flow API Reference: https://reactflow.dev/api-reference
- Computing Flows 예시: https://reactflow.dev/examples/interaction/computing-flows
