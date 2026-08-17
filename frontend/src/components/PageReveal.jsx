import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// Pure on-mount reveal, no scroll dependency required.

const PageReveal = ({ children, className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ctx = gsap.context(() => {
      const childrenElements = el.children;

      gsap.fromTo(
        childrenElements,
        { 
          opacity: 0, 
          y: 30, 
          rotationX: 2,
          filter: 'blur(3px)'
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          delay: 0.1 
        }
      );
    }, el);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className={`page-reveal ${className}`}>
      {children}
    </div>
  );
};

export default PageReveal;
