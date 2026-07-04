import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AnimatedNumber from "../components/AnimatedNumber";
import AreaChart from "../components/AreaChart";
import DonutChart from "../components/DonutChart";

const ROLE_LABEL = {
  admin: "Administrador",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

function seteDiasAtras() {
  // Volta 9 dias corridos para garantir que cobre 5 dias úteis mesmo com fins de semana pelo meio
  const d = new Date();
  d.setDate(d.getDate() - 9);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ultimosDiasUteis(quantidade) {
  const dias = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dias.length < quantidade) {
    const diaSemana = cursor.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias.unshift(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return dias;
}

function agruparUltimos7Dias(presencas, estadoAlvo) {
  const dias = ultimosDiasUteis(5);
  return dias.map((dia) => {
    const proximo = new Date(dia);
    proximo.setDate(dia.getDate() + 1);
    const label = dia.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").slice(0, 3);
    const total = presencas.filter((p) => {
      const dataP = p.data?.toDate ? p.data.toDate() : null;
      const bate = estadoAlvo ? p.estado === estadoAlvo : true;
      return dataP && dataP >= dia && dataP < proximo && bate;
    }).length;
    return { label, value: total };
  });
}

// Cartão KPI escuro, tipo trading
function KpiCard({ icone, label, valor, cor, sufixo = "", atraso = 0 }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }),
      Animated.timing(deslocamento, { toValue: 0, duration: 500, delay: atraso, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: opacidade, transform: [{ translateY: deslocamento }], flex: 1 }}>
      <View
        className="rounded-2xl p-4"
        style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
      >
        <Text className="text-lg mb-1">{icone}</Text>
        <View className="flex-row items-baseline">
          <AnimatedNumber value={valor} style={{ color: "#F8FAFC", fontSize: 26, fontWeight: "800" }} />
          {sufixo ? <Text style={{ color: cor, fontSize: 14, fontWeight: "700", marginLeft: 2 }}>{sufixo}</Text> : null}
        </View>
        <Text className="text-gray-500 text-xs mt-1">{label}</Text>
        <View style={{ height: 3, borderRadius: 3, backgroundColor: cor, marginTop: 8, opacity: 0.7 }} />
      </View>
    </Animated.View>
  );
}

function AcessoRapidoItem({ label, icone, destaque, onPress }) {
  const escala = useRef(new Animated.Value(1)).current;
  const aoPressionar = () => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        onPress={aoPressionar}
        activeOpacity={0.85}
        className="rounded-xl p-4 flex-row justify-between items-center"
        style={{
          backgroundColor: destaque ? "#22D3EE" : "#111827",
          borderWidth: destaque ? 0 : 1,
          borderColor: "#1F2937",
        }}
      >
        <Text style={{ color: destaque ? "#0B1120" : "#E2E8F0", fontWeight: "600", fontSize: 15 }}>
          {icone}  {label}
        </Text>
        <Text style={{ color: destaque ? "#0B1120" : "#64748B" }}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [chamadasMes, setChamadasMes] = useState(0);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [meusEducandos, setMeusEducandos] = useState(0);
  const [assiduidade, setAssiduidade] = useState(0);
  const [graficoFaltas, setGraficoFaltas] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user]);

  // Estatísticas gerais (admin / professor)
  useEffect(() => {
    if (!user || userData?.role === "encarregado") return;

    const unsubTurmas = onSnapshot(collection(db, "turmas"), (s) => setTotalTurmas(s.size));
    const unsubAlunos = onSnapshot(collection(db, "alunos"), (s) => setTotalAlunos(s.size));

    const qSemana = query(collection(db, "presencas"), where("data", ">=", seteDiasAtras()));
    const unsubSemana = onSnapshot(qSemana, (snap) => {
      const presencas = snap.docs.map((d) => d.data());
      setGraficoFaltas(agruparUltimos7Dias(presencas, "falta"));

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const doDiaDeHoje = presencas.filter((p) => {
        const d = p.data?.toDate ? p.data.toDate() : null;
        return d && d >= hoje;
      });
      setFaltasHoje(doDiaDeHoje.filter((p) => p.estado === "falta" || p.estado === "atraso").length);

      const totalPresente = presencas.filter((p) => p.estado === "presente").length;
      const totalGeral = presencas.length || 1;
      setAssiduidade(Math.round((totalPresente / totalGeral) * 100));
    });

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const qChamadas = query(collection(db, "chamadas_atencao"), where("data", ">=", inicioMes));
    const unsubChamadas = onSnapshot(qChamadas, (s) => setChamadasMes(s.size));

    return () => {
      unsubTurmas();
      unsubAlunos();
      unsubSemana();
      unsubChamadas();
    };
  }, [user, userData]);

  // Estatísticas do encarregado
  useEffect(() => {
    if (!user || userData?.role !== "encarregado") return;

    const qEducandos = query(collection(db, "alunos"), where("encarregados_ids", "array-contains", user.uid));
    const unsubEducandos = onSnapshot(qEducandos, async (snap) => {
      const educandos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMeusEducandos(educandos.length);

      if (educandos.length === 0) {
        setGraficoFaltas(agruparUltimos7Dias([], "falta"));
        return;
      }

      const idsEducandos = educandos.map((e) => e.id);
      const qPresencas = query(
        collection(db, "presencas"),
        where("aluno_id", "in", idsEducandos.slice(0, 10)),
        where("data", ">=", seteDiasAtras())
      );
      const presSnap = await getDocs(qPresencas);
      const presencas = presSnap.docs.map((d) => d.data());
      setGraficoFaltas(agruparUltimos7Dias(presencas, "falta"));

      const totalPresente = presencas.filter((p) => p.estado === "presente").length;
      const totalGeral = presencas.length || 1;
      setAssiduidade(Math.round((totalPresente / totalGeral) * 100));
    });

    return unsubEducandos;
  }, [user, userData]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notificacoes"), where("destinatario_id", "==", user.uid), where("lida", "==", false));
    const unsubscribe = onSnapshot(q, (s) => setNotificacoesNaoLidas(s.size));
    return unsubscribe;
  }, [user]);

  const terminarSessao = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1120", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  const role = userData?.role;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0B1120" }}>
      {/* Cabeçalho */}
      <View className="pt-14 pb-6 px-6">
        <View className="flex-row justify-between items-start gap-3">
          <View className="flex-1">
            <Text className="text-gray-500 text-xs mb-1">
              {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}
            </Text>
            <Text style={{ color: "#F8FAFC" }} className="text-xl font-bold" numberOfLines={1}>
              Olá, {userData?.nome || user.email}
            </Text>
            <View className="flex-row items-center mt-1">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22D3EE", marginRight: 6 }} />
              <Text className="text-gray-500 text-sm">{ROLE_LABEL[role] || "Utilizador"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={terminarSessao}>
            <Text className="text-gray-500 text-sm">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View className="px-6">
        {role === "encarregado" ? (
          <View className="flex-row gap-3 mb-3">
            <KpiCard icone="🎓" label="Meus educandos" valor={meusEducandos} cor="#22D3EE" atraso={0} />
            <KpiCard icone="🔔" label="Notificações novas" valor={notificacoesNaoLidas} cor="#A78BFA" atraso={100} />
          </View>
        ) : (
          <>
            <View className="flex-row gap-3 mb-3">
              <KpiCard icone="🏫" label="Turmas" valor={totalTurmas} cor="#22D3EE" atraso={0} />
              <KpiCard icone="🧑‍🎓" label="Alunos" valor={totalAlunos} cor="#818CF8" atraso={80} />
            </View>
            <View className="flex-row gap-3 mb-3">
              <KpiCard icone="📋" label="Faltas hoje" valor={faltasHoje} cor="#F87171" atraso={160} />
              <KpiCard icone="⚠️" label="Chamadas (mês)" valor={chamadasMes} cor="#FBBF24" atraso={240} />
            </View>
          </>
        )}
      </View>

      {/* Gráfico de área — Faltas nos últimos 7 dias */}
      <View className="px-6 mb-3">
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: "#F8FAFC" }} className="font-semibold">
              {role === "encarregado" ? "Faltas dos educandos" : "Faltas nos últimos 7 dias"}
            </Text>
            <View style={{ backgroundColor: "#1F2937", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text className="text-gray-400 text-xs">7 dias</Text>
            </View>
          </View>
          <AreaChart data={graficoFaltas} color="#F87171" height={150} />
        </View>
      </View>

      {/* Donut de assiduidade */}
      {role !== "encarregado" && (
        <View className="px-6 mb-3">
          <View
            className="rounded-2xl p-5 flex-row items-center justify-between"
            style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
          >
            <View className="flex-1 pr-4">
              <Text style={{ color: "#F8FAFC" }} className="font-semibold mb-1">
                Assiduidade geral
              </Text>
              <Text className="text-gray-500 text-xs">
                Percentagem de presenças confirmadas nos últimos 7 dias, considerando todas as turmas.
              </Text>
            </View>
            <DonutChart percentagem={assiduidade} cor="#34D399" legenda="Presença" />
          </View>
        </View>
      )}

      {/* Acesso rápido */}
      <View className="px-6 pt-4">
        <Text style={{ color: "#F8FAFC" }} className="font-semibold mb-4">
          Acesso rápido
        </Text>

        <View className="gap-3 pb-10">
          {role === "admin" && (
            <AcessoRapidoItem icone="⚙️" label="Painel de Administração" destaque onPress={() => router.push("/admin")} />
          )}

          <AcessoRapidoItem icone="🔔" label="Notificações" onPress={() => router.push("/notificacoes")} />
          <AcessoRapidoItem icone="🏫" label="Turmas e Alunos" onPress={() => router.push("/turmas")} />

          {role !== "encarregado" && (
            <>
              <AcessoRapidoItem icone="✅" label="Registar Presença" onPress={() => router.push("/registar-presenca")} />
              <AcessoRapidoItem icone="⚠️" label="Chamadas de Atenção" onPress={() => router.push("/chamadas-atencao")} />
            </>
          )}

          <AcessoRapidoItem icone="📅" label="Reuniões" onPress={() => router.push("/reunioes")} />
        </View>
      </View>
    </ScrollView>
  );
}