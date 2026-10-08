import { useEffect, useRef, useState } from "react";

export function CountUp({ value = 0, duration = 1100, format }) {
  const [n, setN] = useState(0);
  const raf = useRef();
  useEffect(() => {
    let start;
    const to = Number(value) || 0;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(to * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{format ? format(n) : Math.round(n).toLocaleString()}</>;
}
