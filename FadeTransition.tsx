import { useEffect, useState, ReactNode } from 'react';

interface FadeTransitionProps {
  children: ReactNode;
  show: boolean;
  duration?: number;
}

export default function FadeTransition({ children, show, duration = 300 }: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {children}
    </div>
  );
}