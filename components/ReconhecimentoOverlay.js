import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing } from "react-native";

/**
 * Cartão central de confirmação do reconhecimento facial.
 * Suporta dois tipos:
 *
 * - tipo="sucesso": mostra foto do aluno + nome + selo verde ✓
 * - tipo="erro":    mostra ícone X vermelho + mensagem (sem foto, aluno desconhecido)
 *
 * Props:
 * - tipo: "sucesso" | "erro"
 * - aluno: { nome, foto_url } — só usado quando tipo === "sucesso"
 * - confianca: number (opcional)
 * - mensagemErro: string (opcional, usado quando tipo === "erro")
 * - onFim: () => void  (chamado quando a animação termina, para fechar o cartão)
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

  const ehErro = tipo === "erro";
  const corSelo = ehErro ? "#dc2626" : "#10b981"; // vermelho / verde
  const corTexto = ehErro ? "#f87171" : "#10b981";
  const duracaoVisivel = ehErro ? 1400 : 1800;

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

    // selo (✓ ou X) aparece logo a seguir, com "pop"
    Animated.sequence([
      Animated.delay(120),
      Animated.spring(escalaSelo, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    // fecha sozinho depois de mostrar por um tempo
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
        {ehErro ? (
          // --- estado de erro: círculo vermelho grande com X, sem foto ---
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
          {ehErro ? "Rosto não reconhecido" : aluno?.nome}
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
          {ehErro ? (mensagemErro || "Tenta novamente com boa luz") : "Presença confirmada"}
        </Text>

        {!ehErro && typeof confianca === "number" && (
          <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
            {confianca.toFixed(1)}% de confiança
          </Text>
        )}
      </Animated.View>
    </View>
  );
}