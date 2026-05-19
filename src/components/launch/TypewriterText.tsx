import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";

export interface TypewriterTextProps {
  text: string;
  active?: boolean;
  /** Keep full text visible after typing finishes (default true). */
  persist?: boolean;
  /** Milliseconds per character. */
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  active = true,
  persist = true,
  speed = 22,
  delay = 0,
  className,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const wasActiveRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      if (persist && completedRef.current) {
        return;
      }
      completedRef.current = false;
      setVisible(0);
      return;
    }

    if (wasActiveRef.current) {
      return;
    }
    wasActiveRef.current = true;
    completedRef.current = false;

    if (reduced) {
      setVisible(text.length);
      completedRef.current = true;
      onCompleteRef.current?.();
      return;
    }

    setVisible(0);
    let intervalId = 0;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      let i = 0;
      intervalId = window.setInterval(() => {
        if (cancelled) {
          return;
        }
        i += 1;
        setVisible(i);
        if (i >= text.length) {
          window.clearInterval(intervalId);
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current?.();
          }
        }
      }, speed);
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      wasActiveRef.current = false;
    };
  }, [active, delay, persist, reduced, speed, text]);

  const done = visible >= text.length;

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, visible)}</span>
      {showCursor && active && !done && !reduced ? (
        <span className="typewriter-cursor" aria-hidden />
      ) : null}
    </span>
  );
}
