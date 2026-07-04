import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

// Easing suave (ease-out)
function easeOutQuad(t) {
  return t * (2 - t);
}

export default function AnimatedNumber({ value, duration = 900, style, className }) {
  const [display, setDisplay] = useState(0);
  const startValue = useRef(0);
  const startTime = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    startValue.current = display;
    startTime.current = null;

    function tick(timestamp) {
      if (startTime.current === null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const current = Math.round(startValue.current + (value - startValue.current) * eased);
      setDisplay(current);

      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => frame.current && cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Text style={style} className={className}>
      {display}
    </Text>
  );
}