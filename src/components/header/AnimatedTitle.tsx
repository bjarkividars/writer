"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedTitleProps = {
  title: string | null;
  isEditing: boolean;
  fallback?: string;
  speedMs?: number;
};

export default function AnimatedTitle({
  title,
  isEditing,
  fallback = "Untitled",
  speedMs = 40,
}: AnimatedTitleProps) {
  const [displayText, setDisplayText] = useState(title ?? fallback);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (isEditing) {
      setDisplayText(title ?? fallback);
      previousTitleRef.current = title;
      return;
    }

    if (!title) {
      setDisplayText(fallback);
      previousTitleRef.current = null;
      return;
    }

    if (previousTitleRef.current === title) {
      setDisplayText(title);
      return;
    }

    let index = 0;
    setDisplayText("");
    typingTimerRef.current = setInterval(() => {
      index += 1;
      setDisplayText(title.slice(0, index));
      if (index >= title.length && typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }, speedMs);
    previousTitleRef.current = title;

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [title, isEditing, fallback, speedMs]);

  return <>{displayText}</>;
}
