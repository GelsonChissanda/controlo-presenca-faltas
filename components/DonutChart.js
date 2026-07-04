import { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function DonutChart({ percentagem, tamanho = 128, espessura = 12, cor = "#22D3EE", legenda }) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [valorAnimado, setValorAnimado] = useState(0);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => setValorAnimado(value));
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: percentagem,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    return () => progressAnim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentagem]);

  const raio = (tamanho - espessura) / 2;
  const perimetro = 2 * Math.PI * raio;
  const offset = perimetro - (valorAnimado / 100) * perimetro;
  const centro = tamanho / 2;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={tamanho} height={tamanho}>
        <Circle cx={centro} cy={centro} r={raio} stroke="#1E293B" strokeWidth={espessura} fill="none" />
        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeDasharray={`${perimetro} ${perimetro}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          originX={centro}
          originY={centro}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text className="text-white text-2xl font-bold">{Math.round(valorAnimado)}%</Text>
        {legenda && <Text className="text-gray-400 text-xs mt-1">{legenda}</Text>}
      </View>
    </View>
  );
}