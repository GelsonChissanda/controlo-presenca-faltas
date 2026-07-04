import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from "react-native-svg";
import { Animated } from "react-native";

export default function AreaChart({ data, height = 150, color = "#22D3EE" }) {
  const [width, setWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => setProgress(value));
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    return () => progressAnim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  const padding = 8;

  if (width === 0) {
    return <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  const baseY = height - padding - 14;

  const pontos = data.map((d, i) => {
    const x = padding + i * stepX;
    const alvoY = padding + (1 - d.value / max) * (baseY - padding);
    const y = baseY + (alvoY - baseY) * progress;
    return { x, y };
  });

  const linhaPath = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linhaPath} L ${pontos[pontos.length - 1].x.toFixed(2)} ${baseY} L ${pontos[0].x.toFixed(2)} ${baseY} Z`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.45} />
            <Stop offset="1" stopColor={color} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* linhas guia horizontais */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <Line
            key={i}
            x1={padding}
            x2={width - padding}
            y1={padding + f * (baseY - padding)}
            y2={padding + f * (baseY - padding)}
            stroke="#1E293B"
            strokeWidth={1}
          />
        ))}

        <Path d={areaPath} fill="url(#gradArea)" />
        <Path d={linhaPath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {pontos.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#0B1120" stroke={color} strokeWidth={2} />
        ))}
      </Svg>

      <View className="flex-row justify-between mt-1">
        {data.map((d, i) => (
          <Text key={i} className="text-[10px] text-gray-500" style={{ width: `${100 / data.length}%`, textAlign: "center" }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}