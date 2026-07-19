import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Cartão central de confirmação do reconhecimento facial.
 * Suporta três tipos:
 *
 * - tipo="sucesso":    foto do aluno + nome + selo verde ✓
 * - tipo="erro":       ícone X vermelho + mensagem (rosto não reconhecido)
 * - tipo="ja_marcado": prancheta com ✓ "desenhado" à mão + dedo de fixe 👍
 *                      (aluno já tinha sido marcado presente nesta chamada)
 *
 * Props:
 * - tipo: "sucesso" | "erro" | "ja_marcado"
 * - aluno: { nome, foto_url }
 * - confianca: number (opcional, só usado em "sucesso")
 * - mensagemErro: string (opcional, só usado em "erro")
 * - onFim: () => void
 */
export default function ReconhecimentoOverlay({
  tipo = "sucesso",
  aluno,
  confianca,
  mensagemErro,
  onFim,
}) {
  const escalaCartao = useRef(new Animated.Value(0.7)).current;
  const opacidadeCartao = useRef(new Animated.Value(0)).current;
  const escalaSelo = useRef(new Animated.Value(0)).current;

  // específico do modo "ja_marcado"
  const traçoCheck = useRef(new Animated.Value(0)).current; // 0 = não desenhado, 1 = desenhado
  const escalaPrancheta = useRef(new Animated.Value(0.6)).current;
  const escalaPolegar = useRef(new Animated.Value(0)).current;

  const ehErro = tipo === "erro";
  const ehJaMarcado = tipo === "ja_marcado";
  const ehSucesso = tipo === "sucesso";

  const corSelo = ehErro ? "#dc2626" : "#10b981";
  const corTexto = ehErro ? "#f87171" : ehJaMarcado ? "#3b82f6" : "#10b981";
  const duracaoVisivel = ehErro ? 1400 : ehJaMarcado ? 2000 : 1800;

  useEffect(() => {
    // entrada do cartão
    Animated.parallel([
      Animated.timing(opacidadeCartao, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(escalaCartao, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    if (ehJaMarcado) {
      // prancheta "cai" para o centro, depois o ✓ é desenhado, depois o polegar aparece
      Animated.sequence([
        Animated.spring(escalaPrancheta, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(traçoCheck, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false, // strokeDashoffset não suporta native driver
        }),
        Animated.spring(escalaPolegar, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // selo (✓ ou X) aparece com "pop"
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(escalaSelo, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacidadeCartao, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(escalaCartao, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFim) onFim();
      });
    }, duracaoVisivel);

    return () => clearTimeout(timer);
  }, []);

  // comprimento aproximado do traço do ✓ (para animar o "desenhar")
  const COMPRIMENTO_TRACO = 46;
  const strokeDashoffset = traçoCheck.interpolate({
    inputRange: [0, 1],
    outputRange: [COMPRIMENTO_TRACO, 0],
  });

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    >
      <Animated.View
        style={{
          opacity: opacidadeCartao,
          transform: [{ scale: escalaCartao }],
          backgroundColor: "#111827",
          borderRadius: 24,
          paddingVertical: 28,
          paddingHorizontal: 32,
          alignItems: "center",
          width: 260,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        {ehJaMarcado ? (
          // --- estado "já marcado": prancheta com ✓ desenhado + polegar 👍 ---
          <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
            <Animated.View
              style={{
                width: 84,
                height: 96,
                backgroundColor: "#f3f4f6",
                borderRadius: 10,
                borderWidth: 2,
                borderColor: "#9ca3af",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: escalaPrancheta }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }}
            >
              {/* pequena "argola" da prancheta no topo */}
              <View
                style={{
                  position: "absolute",
                  top: -6,
                  width: 24,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#6b7280",
                }}
              />
              {/* linhas de "texto" da lista */}
              <View style={{ width: "70%", marginTop: 6 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      height: 3,
                      backgroundColor: "#d1d5db",
                      borderRadius: 2,
                      marginBottom: 8,
                      width: i === 2 ? "60%" : "100%",
                    }}
                  />
                ))}
              </View>
              {/* ✓ desenhado com traço animado */}
              <Svg width={40} height={30} viewBox="0 0 40 30" style={{ marginTop: 4 }}>
                <AnimatedPath
                  d="M6 15 L16 24 L34 4"
                  stroke="#10b981"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={COMPRIMENTO_TRACO}
                  strokeDashoffset={strokeDashoffset}
                />
              </Svg>
            </Animated.View>

            {/* polegar de "fixe" no canto, aparece por último */}
            <Animated.View
              style={{
                position: "absolute",
                bottom: -6,
                right: -14,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#3b82f6",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#111827",
                transform: [{ scale: escalaPolegar }],
              }}
            >
              <Text style={{ fontSize: 18 }}>👍</Text>
            </Animated.View>
          </View>
        ) : ehErro ? (
          // --- estado de erro: círculo vermelho com X ---
          <Animated.View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#7f1d1d",
              borderWidth: 3,
              borderColor: corSelo,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: escalaSelo }],
            }}
          >
            <Text style={{ color: "#fff", fontSize: 40, fontWeight: "900" }}>✕</Text>
          </Animated.View>
        ) : (
          // --- estado de sucesso: foto + selo verde ✓ ---
          <View style={{ width: 96, height: 96 }}>
            {aluno?.foto_url ? (
              <Image
                source={{ uri: aluno.foto_url }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 3,
                  borderColor: corSelo,
                }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 3,
                  borderColor: corSelo,
                  backgroundColor: "#374151",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#9ca3af", fontSize: 32, fontWeight: "700" }}>
                  {aluno?.nome?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}

            <Animated.View
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: corSelo,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#111827",
                transform: [{ scale: escalaSelo }],
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>✓</Text>
            </Animated.View>
          </View>
        )}

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          {ehErro ? "Rosto não reconhecido" : ehJaMarcado ? aluno?.nome : aluno?.nome}
        </Text>

        <Text
          style={{
            color: corTexto,
            fontSize: 13,
            fontWeight: "600",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {ehErro
            ? mensagemErro || "Tenta novamente com boa luz"
            : ehJaMarcado
            ? "Já registado nesta chamada ✓"
            : "Presença confirmada"}
        </Text>

        {ehSucesso && typeof confianca === "number" && (
          <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
            {confianca.toFixed(1)}% de confiança
          </Text>
        )}
      </Animated.View>
    </View>
  );
}