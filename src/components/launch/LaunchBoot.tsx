import { useCallback, useEffect, useRef, useState } from "react";
import appMark from "../../../nova-diff-icon.png";
import {
  LAUNCH_EXIT_FADE_MS,
  LAUNCH_HOLD_MS,
  LAUNCH_HOLD_SKIP_AFTER_MS,
} from "../../app/launchSequence";
import { usePrefersReducedMotion } from "../../app/usePrefersReducedMotion";
import { TypewriterText } from "./TypewriterText";

type WriteStep = "intro" | "title" | "tagline" | "subtitle" | "continue" | "hold" | "exit";

export interface LaunchBootProps {
  onExitComplete: () => void;
}

export function LaunchBoot({ onExitComplete }: LaunchBootProps) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState<WriteStep>(reduced ? "hold" : "intro");
  const [progress, setProgress] = useState(reduced ? 100 : 8);
  const [canSkip, setCanSkip] = useState(reduced);
  const exitCalledRef = useRef(false);
  const onExitRef = useRef(onExitComplete);
  onExitRef.current = onExitComplete;

  const beginExit = useCallback(() => {
    setProgress(100);
    setStep("exit");
  }, []);

  const onTitleDone = useCallback(() => {
    setProgress(40);
    setStep("tagline");
  }, []);

  const onTaglineDone = useCallback(() => {
    setProgress(62);
    setStep("subtitle");
  }, []);

  const onSubtitleDone = useCallback(() => {
    setProgress(82);
    setStep("continue");
  }, []);

  const onContinueDone = useCallback(() => {
    setProgress(100);
    setStep("hold");
  }, []);

  useEffect(() => {
    if (!reduced) {
      return;
    }
    const id = window.setTimeout(beginExit, 320);
    return () => window.clearTimeout(id);
  }, [beginExit, reduced]);

  useEffect(() => {
    if (reduced || step !== "intro") {
      return;
    }
    const id = window.setTimeout(() => {
      setProgress(18);
      setStep("title");
    }, 360);
    return () => window.clearTimeout(id);
  }, [reduced, step]);

  useEffect(() => {
    if (step !== "hold") {
      return;
    }
    const skipTimer = window.setTimeout(() => setCanSkip(true), LAUNCH_HOLD_SKIP_AFTER_MS);
    const exitTimer = window.setTimeout(beginExit, LAUNCH_HOLD_MS);
    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(exitTimer);
    };
  }, [beginExit, step]);

  useEffect(() => {
    if (step !== "exit" || exitCalledRef.current) {
      return;
    }
    const id = window.setTimeout(() => {
      if (!exitCalledRef.current) {
        exitCalledRef.current = true;
        onExitRef.current();
      }
    }, LAUNCH_EXIT_FADE_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  useEffect(() => {
    if (!canSkip || step !== "hold") {
      return;
    }
    const skip = () => beginExit();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginExit, canSkip, step]);

  const handleBackdropClick = () => {
    if (canSkip && step === "hold") {
      beginExit();
    }
  };

  const stepRank = (s: WriteStep) =>
    ["intro", "title", "tagline", "subtitle", "continue", "hold", "exit"].indexOf(s);

  const showContinue = stepRank(step) >= stepRank("continue");

  return (
    <div
      className={`launch-boot${step === "exit" ? " is-exiting" : ""}${step === "hold" ? " is-hold" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="NovaDiff startup"
      onMouseDown={handleBackdropClick}
    >
      <div className="launch-boot-grid" />
      <div className="launch-boot-scan" />
      <div className="launch-boot-frame">
        <div className="launch-boot-logo-ring">
          <img className="launch-boot-logo" src={appMark} alt="" width={72} height={72} />
        </div>
        <div className="launch-boot-copy">
          <h1 className="launch-boot-title launch-boot-line">
            {reduced ? (
              "NovaDiff"
            ) : (
              <TypewriterText
                text="NovaDiff"
                active={step === "title"}
                speed={42}
                showCursor={step === "title"}
                onComplete={onTitleDone}
              />
            )}
          </h1>
          <p className="launch-boot-tagline launch-boot-line">
            {reduced ? (
              "Smarter Diffs. Better Reviews."
            ) : (
              <TypewriterText
                text="Smarter Diffs. Better Reviews."
                active={step === "tagline"}
                speed={20}
                delay={50}
                showCursor={step === "tagline"}
                onComplete={onTaglineDone}
              />
            )}
          </p>
          <p className="launch-boot-sub launch-boot-line">
            {reduced ? (
              "AI-powered folder compare"
            ) : (
              <TypewriterText
                text="AI-powered folder compare"
                active={step === "subtitle"}
                speed={18}
                delay={50}
                showCursor={step === "subtitle"}
                onComplete={onSubtitleDone}
              />
            )}
          </p>
          <p
            className={`launch-boot-continue launch-boot-line${showContinue ? " is-visible" : ""}`}
            aria-live="polite"
          >
            {reduced ? (
              "Press Enter to continue"
            ) : showContinue ? (
              <TypewriterText
                text="Press Enter to continue"
                active={step === "continue"}
                speed={22}
                delay={120}
                showCursor={step === "continue"}
                onComplete={onContinueDone}
              />
            ) : (
              <span className="launch-boot-line-placeholder" aria-hidden>
                &nbsp;
              </span>
            )}
          </p>
        </div>
        <div className="launch-boot-progress" aria-hidden>
          <div className="launch-boot-progress-track">
            <div
              className="launch-boot-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="launch-boot-corners" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
