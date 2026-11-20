"use client";

import { useRef, useState, type FocusEvent, type MouseEvent, type TouchEvent } from "react";

// The playback button controls rotation. Other interactive content holds it while being read.
export function usePreviewPlayback() {
  const control = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);

  function onControl(target: EventTarget | null) {
    return target instanceof Node && !!control.current?.contains(target);
  }

  function toggle() {
    if (paused) {
      setHovering(false);
      setFocused(false);
      setTouching(false);
    }
    setPaused(!paused);
  }

  return {
    paused,
    suspended: paused || hovering || focused || touching,
    controlProps: { ref: control, "aria-pressed": paused, onClick: toggle },
    regionProps: {
      onMouseOver: (event: MouseEvent) => setHovering(!onControl(event.target)),
      onMouseLeave: () => setHovering(false),
      onFocusCapture: (event: FocusEvent) => setFocused(!onControl(event.target)),
      onBlurCapture: () => setFocused(false),
      onTouchStart: (event: TouchEvent) => setTouching(!onControl(event.target)),
      onTouchEnd: () => setTouching(false),
      onTouchCancel: () => setTouching(false),
    },
  };
}
