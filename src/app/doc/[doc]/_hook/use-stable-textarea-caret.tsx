"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

export function computeSingleSplice(oldVal: string, newVal: string) {
  if (oldVal === newVal) return null;
  let start = 0;
  let endOld = oldVal.length;
  let endNew = newVal.length;

  while (start < endOld && start < endNew && oldVal[start] === newVal[start])
    start++;

  while (
    endOld > start &&
    endNew > start &&
    oldVal[endOld - 1] === newVal[endNew - 1]
  ) {
    endOld--;
    endNew--;
  }

  return {
    start,
    end: endOld,
    insert: newVal.slice(start, endNew),
  } as const;
}

type Options = {
  ignoreDuringComposition?: boolean;
  externalVersion?: number | string;
};

export function useStableTextareaCaret(
  value: string,
  onChange: (next: string) => void,
  opts: Options = {}
) {
  const { ignoreDuringComposition = true, externalVersion } = opts;
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const domValueRef = useRef<string>(value);
  const extVersionRef = useRef(externalVersion);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const next = e.target.value;
      domValueRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setIsComposing(false);
      const next = (e.target as HTMLTextAreaElement).value;
      domValueRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    extVersionRef.current = externalVersion;

    const domVal = domValueRef.current;
    const extVal = value;
    if (domVal === extVal) return;

    const isFocused = document.activeElement === el;

    if (ignoreDuringComposition && isComposing && isFocused) {
      return;
    }

    if (isFocused) {
      const splice = computeSingleSplice(domVal, extVal);
      if (!splice) return;

      const { selectionStart, selectionEnd, selectionDirection } = el;
      const before = splice.start;
      const removedLen = splice.end - splice.start;
      const insertedLen = splice.insert.length;
      const delta = insertedLen - removedLen;

      let newStart = selectionStart ?? 0;
      let newEnd = selectionEnd ?? 0;

      if (newStart > splice.end) newStart += delta;
      else if (newStart > before)
        newStart = before + Math.max(0, newStart - splice.end) + insertedLen;

      if (newEnd > splice.end) newEnd += delta;
      else if (newEnd > before)
        newEnd = before + Math.max(0, newEnd - splice.end) + insertedLen;

      el.setRangeText(splice.insert, splice.start, splice.end, "preserve");
      el.setSelectionRange(newStart, newEnd, selectionDirection ?? "none");
      domValueRef.current = el.value;
    } else {
      if (el.value !== extVal) {
        el.value = extVal;
        domValueRef.current = extVal;
      }
    }
  }, [value, externalVersion, ignoreDuringComposition, isComposing]);

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
