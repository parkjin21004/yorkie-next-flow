```tsx
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

/** 최소 스플라이스 계산: newVal을 oldVal로부터 만드는 단일 치환 범위를 찾음 */
function computeSingleSplice(oldVal: string, newVal: string) {
  if (oldVal === newVal) return null;
  let start = 0;
  let endOld = oldVal.length;
  let endNew = newVal.length;

  // 공통 prefix
  while (start < endOld && start < endNew && oldVal[start] === newVal[start])
    start++;

  // 공통 suffix
  while (
    endOld > start &&
    endNew > start &&
    oldVal[endOld - 1] === newVal[endNew - 1]
  ) {
    endOld--;
    endNew--;
  }

  return {
    start, // old에서 치환 시작 인덱스
    end: endOld, // old에서 치환 끝 인덱스
    insert: newVal.slice(start, endNew), // 삽입할 문자열
  };
}

type Options = {
  /** IME 조합 입력 중 외부 업데이트 무시 여부 (기본 true) */
  ignoreDuringComposition?: boolean;
  /** 외부 업데이트 우선 적용 트리거 (ex: 원격 편집 버전 넘버) */
  externalVersion?: number | string;
};

/**
 * textarea에 붙여서 caret jump를 막는 훅
 * - value: 소스 오브 트루스(그래프 state에서 온 문자열)
 * - onChange: 로컬 입력을 상위(그래프)로 반영
 */
export function useStableTextareaCaret(
  value: string,
  onChange: (next: string) => void,
  opts: Options = {}
) {
  const { ignoreDuringComposition = true, externalVersion } = opts;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // 내부 미러를 둬서 "현재 DOM에 표시된 값"을 기억 (외부 value와 다를 수 있음)
  const domValueRef = useRef<string>(value);
  const extVersionRef = useRef(externalVersion);

  // 로컬 타이핑 핸들러: 상위로만 올리고 DOM은 브라우저가 유지
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      domValueRef.current = next; // DOM과 동기화
      onChange(next);
    },
    [onChange]
  );

  // 조합 입력 플래그
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      setIsComposing(false);
      // 조합 종료 시점 값 반영
      const next = (e.target as HTMLTextAreaElement).value;
      domValueRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  // 외부 value가 바뀌면 textarea DOM에 "패치"로만 반영
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 외부 버전이 바뀌었는지 기록 (필수는 아님)
    extVersionRef.current = externalVersion;

    const domVal = domValueRef.current;
    const extVal = value;

    if (domVal === extVal) return;

    const isFocused = document.activeElement === el;

    // IME 중엔 바꾸지 않고 넘기는 옵션
    if (ignoreDuringComposition && isComposing && isFocused) {
      // 조합 중 외부 업데이트는 일단 보류: 다음 렌더에서 다시 비교됨
      return;
    }

    // 포커스 상태라면 setRangeText로 부분 치환 (selection 보정)
    if (isFocused) {
      const splice = computeSingleSplice(domVal, extVal);
      if (!splice) return;

      const { selectionStart, selectionEnd, selectionDirection } = el;
      const before = splice.start;
      const removedLen = splice.end - splice.start;
      const insertedLen = splice.insert.length;
      const delta = insertedLen - removedLen;

      // 기존 selection이 치환 이후 어디로 이동해야 하는지 계산
      let newStart = selectionStart ?? 0;
      let newEnd = selectionEnd ?? 0;

      // selection이 치환 지점 뒤에 있으면 delta만큼 민다
      if (newStart > splice.end) newStart += delta;
      else if (newStart > before)
        newStart = before + Math.max(0, newStart - splice.end) + insertedLen;

      if (newEnd > splice.end) newEnd += delta;
      else if (newEnd > before)
        newEnd = before + Math.max(0, newEnd - splice.end) + insertedLen;

      // 실제 DOM에 부분 치환 적용 (리렌더 없이)
      el.setRangeText(splice.insert, splice.start, splice.end, "preserve");
      // selection 복원
      el.setSelectionRange(newStart, newEnd, selectionDirection ?? "none");

      // 내부 미러 업데이트
      domValueRef.current = el.value;
    } else {
      // 포커스가 없으면 그냥 통째로 교체해도 무방
      // (controlled이므로 다음 렌더에서 value가 반영될 때 DOM과 합쳐짐)
      if (el.value !== extVal) {
        el.value = extVal;
        domValueRef.current = extVal;
      }
    }
  }, [value, externalVersion, ignoreDuringComposition, isComposing]);

  // mount 시 DOM 초기값 통일
  useEffect(() => {
    if (ref.current) {
      ref.current.value = value;
      domValueRef.current = value;
    }
  }, []);

  return {
    ref,
    props: {
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    } as const,
  };
}
```
