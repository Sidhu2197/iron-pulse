import useCursor from './useCursor';
import './Cursor.css';

/**
 * Custom two-part spring cursor.
 * 
 * - Dot: small white circle, tracks mouse instantly
 * - Ring: larger translucent circle, follows with spring physics
 * 
 * Auto-disables on touch devices.
 */
export default function Cursor() {
  const {
    dotRef,
    ringRef,
    isHovering,
    isPressed,
    isIdle,
    isVisible,
    isTouchDevice,
  } = useCursor();

  // Don't render on touch devices
  if (isTouchDevice) return null;

  const ringClasses = [
    'cursor-ring',
    isHovering ? 'cursor-ring--hover' : '',
    isPressed ? 'cursor-ring--pressed' : '',
    isIdle ? 'cursor-ring--idle' : '',
    !isVisible ? 'cursor-ring--hidden' : '',
  ].filter(Boolean).join(' ');

  const dotClasses = [
    'cursor-dot',
    isHovering ? 'cursor-dot--hover' : '',
    !isVisible ? 'cursor-dot--hidden' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div ref={ringRef} className={ringClasses} />
      <div ref={dotRef} className={dotClasses} />
    </>
  );
}
