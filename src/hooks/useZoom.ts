// ============================================================
// useZoom — Pinch-to-zoom & digital zoom for rear camera
// ============================================================

import { useState, useRef, useCallback } from 'react';

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 5.0;

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function getDistance(touches: React.TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export interface UseZoomReturn {
  zoom: number;
  setZoom: (val: number) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Whether user is actively pinching */
  isPinching: boolean;
}

export function useZoom(
  onZoomChange?: (zoom: number) => void
): UseZoomReturn {
  const [zoom, setZoomState] = useState(1.0);
  const [isPinching, setIsPinching] = useState(false);

  const lastPinchDist = useRef<number | null>(null);
  const zoomAtPinchStart = useRef(1.0);

  const applyZoom = useCallback(
    (val: number) => {
      const clamped = clamp(val, MIN_ZOOM, MAX_ZOOM);
      setZoomState(clamped);
      onZoomChange?.(clamped);
    },
    [onZoomChange]
  );

  const setZoom = useCallback(
    (val: number) => {
      applyZoom(val);
    },
    [applyZoom]
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      lastPinchDist.current = getDistance(e.touches);
      zoomAtPinchStart.current = zoom;
      // Prevent page scroll during pinch
      e.preventDefault();
    }
  }, [zoom]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault();
        const currentDist = getDistance(e.touches);
        const scale = currentDist / lastPinchDist.current;
        const newZoom = zoomAtPinchStart.current * scale;
        applyZoom(newZoom);
      }
    },
    [applyZoom]
  );

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      lastPinchDist.current = null;
    }
  }, []);

  return {
    zoom,
    setZoom,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPinching,
  };
}
