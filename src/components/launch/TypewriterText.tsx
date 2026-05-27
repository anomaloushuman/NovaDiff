import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";

export type TypewriterDirection = "forward" | "reverse";

export interface TypewriterTextProps {
  text: string;
  active?: boolean;
  /** Keep full text visible after forward typing finishes (default true). */
  persist?: boolean;
  direction?: TypewriterDirection;
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
  direction = "forward",
  speed = 22,
  delay = 0,
  className,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(direction === "reverse" ? text.length : 0);
  const onCompleteRef = useRef(onComplete);
  const runIdRef = useRef(0);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      if (direction === "forward" && persist) {
        return;
      }
      setVisible(direction === "reverse" ? 0 : 0);
      return;
    }

    const runId = ++runIdRef.current;
    let intervalId = 0;
    let timeoutId = 0;
    let cancelled = false;

    const finish = (count: number) => {
      if (cancelled || runId !== runIdRef.current) {
        return;
      }
      setVisible(count);
      onCompleteRef.current?.();
    };

    if (reduced) {
      finish(direction === "forward" ? text.length : 0);
      return;
    }

    if (direction === "forward") {
      setVisible(0);
      timeoutId = window.setTimeout(() => {
        let i = 0;
        intervalId = window.setInterval(() => {
          if (cancelled || runId !== runIdRef.current) {
            return;
          }
          i += 1;
          setVisible(i);
          if (i >= text.length) {
            window.clearInterval(intervalId);
            onCompleteRef.current?.();
          }
        }, speed);
      }, delay);
    } else {
      setVisible(text.length);
      timeoutId = window.setTimeout(() => {
        let i = text.length;
        intervalId = window.setInterval(() => {
          if (cancelled || runId !== runIdRef.current) {
            return;
          }
          i -= 1;
          setVisible(Math.max(0, i));
          if (i <= 0) {
            window.clearInterval(intervalId);
            onCompleteRef.current?.();
          }
        }, speed);
      }, delay);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [active, delay, direction, persist, reduced, speed, text]);

  const len = text.length;
  const done =
    direction === "forward" ? visible >= len : visible <= 0;

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, visible)}</span>
      {showCursor && active && !done && !reduced ? (
        <span className="typewriter-cursor" aria-hidden />
      ) : null}
    </span>
  );
}
