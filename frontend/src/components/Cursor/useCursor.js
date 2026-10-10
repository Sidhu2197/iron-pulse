import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom spring-physics cursor hook.
 * 
 * Two-part system: a "dot" that tracks the mouse instantly,
 * and a "ring" that follows with spring physics + position delay.
 * 
 * Features:
 * - Position history buffer (TARGET_DELAY = 80ms) so ring lags behind dot
 * - Spring physics (stiffness 0.045, damping 0.82) for fluid catch-up
 * - Hover detection for interactive elements (enlarges + glows cyan)
 * - Magnetic pull toward interactive element centers (15% strength, 80px radius)
 * - Pressed state: ring compresses, glow intensifies
 * - Idle breathing glow when stationary > 800ms
 */

const TARGET_DELAY = 80;       // ms of position history for the ring target
const SPRING_STIFFNESS = 0.045;
const SPRING_DAMPING = 0.82;
const MAGNETIC_RADIUS = 80;
const MAGNETIC_STRENGTH = 0.15;
const IDLE_THRESHOLD = 800;    // ms before idle glow activates

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, select, textarea, label[for], [data-cursor-hover]';

export default function useCursor() {
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const ringVel = useRef({ x: 0, y: 0 });
  const positionHistory = useRef([]);
  const lastMoveTime = useRef(Date.now());
  const rafId = useRef(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);

  // Check if device supports hover (not touch-only)
  const isTouchDevice = useRef(
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  const getDelayedTarget = useCallback(() => {
    const now = Date.now();
    const history = positionHistory.current;

    // Find the position from TARGET_DELAY ms ago
    const targetTime = now - TARGET_DELAY;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].t <= targetTime) {
        return { x: history[i].x, y: history[i].y };
      }
    }

    // If no history old enough, use oldest available or dot position
    if (history.length > 0) {
      return { x: history[0].x, y: history[0].y };
    }
    return { x: dotPos.current.x, y: dotPos.current.y };
  }, []);

  const findNearestInteractive = useCallback((x, y) => {
    const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);
    let nearest = null;
    let nearestDist = Infinity;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < MAGNETIC_RADIUS && dist < nearestDist) {
        nearest = { cx, cy, el };
        nearestDist = dist;
      }
    }

    return nearest;
  }, []);

  const animate = useCallback(() => {
    const now = Date.now();
    const dot = dotPos.current;

    // Check idle state
    const timeSinceMove = now - lastMoveTime.current;
    const shouldBeIdle = timeSinceMove > IDLE_THRESHOLD;

    // Get delayed target for ring
    let target = getDelayedTarget();

    // Apply magnetic pull if near interactive element
    const magnetic = findNearestInteractive(dot.x, dot.y);
    if (magnetic) {
      target = {
        x: target.x + (magnetic.cx - target.x) * MAGNETIC_STRENGTH,
        y: target.y + (magnetic.cy - target.y) * MAGNETIC_STRENGTH,
      };
    }

    // Spring physics for ring
    const dx = target.x - ringPos.current.x;
    const dy = target.y - ringPos.current.y;

    ringVel.current.x += dx * SPRING_STIFFNESS;
    ringVel.current.y += dy * SPRING_STIFFNESS;

    ringVel.current.x *= SPRING_DAMPING;
    ringVel.current.y *= SPRING_DAMPING;

    ringPos.current.x += ringVel.current.x;
    ringPos.current.y += ringVel.current.y;

    // Apply transforms via refs for max perf (no React re-render)
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
    }
    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
    }

    // Idle state update (batched)
    if (shouldBeIdle !== isIdle) {
      setIsIdle(shouldBeIdle);
    }

    // Prune old history (keep last 200ms)
    const cutoff = now - 200;
    while (positionHistory.current.length > 0 && positionHistory.current[0].t < cutoff) {
      positionHistory.current.shift();
    }

    rafId.current = requestAnimationFrame(animate);
  }, [getDelayedTarget, findNearestInteractive, isIdle]);

  useEffect(() => {
    if (isTouchDevice.current) return;

    const handleMouseMove = (e) => {
      const now = Date.now();
      dotPos.current.x = e.clientX;
      dotPos.current.y = e.clientY;
      lastMoveTime.current = now;

      positionHistory.current.push({ x: e.clientX, y: e.clientY, t: now });

      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = (e) => {
      const target = e.target;
      if (target && target.closest && target.closest(INTERACTIVE_SELECTOR)) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (e) => {
      const target = e.target;
      if (target && target.closest && target.closest(INTERACTIVE_SELECTOR)) {
        setIsHovering(false);
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    const handleMouseLeaveWindow = () => {
      setIsVisible(false);
    };

    const handleMouseEnterWindow = () => {
      setIsVisible(true);
    };

    // Hide default cursor
    document.body.style.cursor = 'none';

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseEnter, { passive: true });
    document.addEventListener('mouseout', handleMouseLeave, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.documentElement.addEventListener('mouseenter', handleMouseEnterWindow);

    // Start animation loop
    rafId.current = requestAnimationFrame(animate);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnterWindow);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [animate, isVisible]);

  return {
    dotRef,
    ringRef,
    isHovering,
    isPressed,
    isIdle,
    isVisible,
    isTouchDevice: isTouchDevice.current,
  };
}
