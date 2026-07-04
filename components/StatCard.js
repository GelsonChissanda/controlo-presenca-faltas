import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import AnimatedNumber from "./AnimatedNumber";

const CORES = {
  slate: { bg: "bg-slate-900", texto: "text-white", sub: "text-gray-300" },
  blue: { bg: "bg-blue-600", texto: "text-white", sub: "text-blue-100" },
  emerald: { bg: "bg-emerald-600", texto: "text-white", sub: "text-emerald-100" },
  red: { bg: "bg-red-600", texto: "text-white", sub: "text-red-100" },
  amber: { bg: "bg-amber-500", texto: "text-white", sub: "text-amber-50" },
  white: { bg: "bg-white border border-gray-200", texto: "text-slate-900", sub: "text-gray-500" },
};

export default function StatCard({ icone, label, valor, cor = "white", atraso = 0 }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 450,
        delay: atraso,
        useNativeDriver: true,
      }),
      Animated.timing(deslocamento, {
        toValue: 0,
        duration: 450,
        delay: atraso,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const paleta = CORES[cor] || CORES.white;

  return (
    <Animated.View
      style={{
        opacity: opacidade,
        transform: [{ translateY: deslocamento }],
        flex: 1,
      }}
    >
      <View className={`${paleta.bg} rounded-2xl p-4`}>
        <Text className="text-2xl mb-2">{icone}</Text>
        <AnimatedNumber
          value={valor}
          className={`${paleta.texto} text-3xl font-bold`}
        />
        <Text className={`${paleta.sub} text-xs mt-1`}>{label}</Text>
      </View>
    </Animated.View>
  );
}