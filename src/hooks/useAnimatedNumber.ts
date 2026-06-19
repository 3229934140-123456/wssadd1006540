import { useState, useEffect, useRef } from 'react';

interface UseAnimatedNumberOptions {
  duration?: number;
  easing?: 'easeOut' | 'easeIn' | 'linear';
  decimals?: number;
}

const easingFunctions = {
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  linear: (t: number) => t,
};

export const useAnimatedNumber = (
  targetValue: number,
  options: UseAnimatedNumberOptions = {}
) => {
  const { duration = 1000, easing = 'easeOut', decimals = 0 } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunctions[easing](progress);

      const currentValue =
        startValueRef.current + (targetValue - startValueRef.current) * easedProgress;
      
      setDisplayValue(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing, decimals]);

  return displayValue;
};
