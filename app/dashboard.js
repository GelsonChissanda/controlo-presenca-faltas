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
import {
  School,
  GraduationCap,
  ClipboardList,
  AlertTriangle,
  Bell,
  CalendarDays,
  Settings,
  LogOut,
  CheckCircle2,
  ChevronRight,
  PieChart,
} from "lucide-react-native";

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

function agruparUltimosDiasUteis(presencas, estadoAlvo) {
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

// Cartão KPI escuro, clicável, com pequena animação de entrada + de toque
function KpiCard({ Icon, label, valor, cor, atraso = 0, onPress }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(14)).current;
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }),
      Animated.timing(deslocamento, { toValue: 0, duration: 500, delay: atraso, useNativeDriver: true }),
    ]).start();
  }, []);

  const aoPressionar = () => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.96, duration: 90, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    onPress && onPress();
  };

  return (
    <Animated.View style={{ opacity: opacidade, transform: [{ translateY: deslocamento }, { scale: escala }], flex: 1 }}>
      <TouchableOpacity activeOpacity={0.85} onPress={aoPressionar} disabled={!onPress}>
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View
              style={{
                backgroundColor: `${cor}22`,
                borderRadius: 10,
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={17} color={cor} strokeWidth={2.2} />
            </View>
            {onPress && <ChevronRight size={16} color="#374151" />}
          </View>
          <AnimatedNumber value={valor} style={{ color: "#F8FAFC", fontSize: 26, fontWeight: "800" }} />
          <Text className="text-gray-500 text-xs mt-1">{label}</Text>
          <View style={{ height: 3, borderRadius: 3, backgroundColor: cor, marginTop: 8, opacity: 0.7 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AcessoRapidoItem({ label, Icon, destaque, onPress }) {
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
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Icon size={18} color={destaque ? "#0B1120" : "#94A3B8"} strokeWidth={2.2} />
          <Text style={{ color: destaque ? "#0B1120" : "#E2E8F0", fontWeight: "600", fontSize: 15 }}>
            {label}
          </Text>
        </View>
        <ChevronRight size={18} color={destaque ? "#0B1120" : "#4B5563"} />
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

  useEffect(() => {
    if (!user || userData?.role === "encarregado") return;

    const unsubTurmas = onSnapshot(collection(db, "turmas"), (s) => setTotalTurmas(s.size));
    const unsubAlunos = onSnapshot(collection(db, "alunos"), (s) => setTotalAlunos(s.size));

    const qSemana = query(collection(db, "presencas"), where("data", ">=", seteDiasAtras()));
    const unsubSemana = onSnapshot(qSemana, (snap) => {
      const presencas = snap.docs.map((d) => d.data());
      setGraficoFaltas(agruparUltimosDiasUteis(presencas, "falta"));

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

  useEffect(() => {
    if (!user || userData?.role !== "encarregado") return;

    const qEducandos = query(collection(db, "alunos"), where("encarregados_ids", "array-contains", user.uid));
    const unsubEducandos = onSnapshot(qEducandos, async (snap) => {
      const educandos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMeusEducandos(educandos.length);

      if (educandos.length === 0) {
        setGraficoFaltas(agruparUltimosDiasUteis([], "falta"));
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
      setGraficoFaltas(agruparUltimosDiasUteis(presencas, "falta"));

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
          <TouchableOpacity onPress={terminarSessao} className="flex-row items-center" style={{ gap: 4 }}>
            <LogOut size={15} color="#64748B" />
            <Text className="text-gray-500 text-sm">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View className="px-6">
        {role === "encarregado" ? (
          <View className="flex-row gap-3 mb-3">
            <KpiCard
              Icon={GraduationCap}
              label="Meus educandos"
              valor={meusEducandos}
              cor="#22D3EE"
              atraso={0}
              onPress={() => router.push("/turmas")}
            />
            <KpiCard
              Icon={Bell}
              label="Notificações novas"
              valor={notificacoesNaoLidas}
              cor="#A78BFA"
              atraso={100}
              onPress={() => router.push("/notificacoes")}
            />
          </View>
        ) : (
          <>
            <View className="flex-row gap-3 mb-3">
              <KpiCard Icon={School} label="Turmas" valor={totalTurmas} cor="#22D3EE" atraso={0} onPress={() => router.push("/turmas")} />
              <KpiCard Icon={GraduationCap} label="Alunos" valor={totalAlunos} cor="#818CF8" atraso={80} onPress={() => router.push("/turmas")} />
            </View>
            <View className="flex-row gap-3 mb-3">
              <KpiCard Icon={ClipboardList} label="Faltas hoje" valor={faltasHoje} cor="#F87171" atraso={160} onPress={() => router.push("/registar-presenca")} />
              <KpiCard Icon={AlertTriangle} label="Chamadas (mês)" valor={chamadasMes} cor="#FBBF24" atraso={240} onPress={() => router.push("/chamadas-atencao")} />
            </View>
          </>
        )}
      </View>

      {/* Gráfico de área — clicável */}
      <View className="px-6 mb-3">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(role === "encarregado" ? "/turmas" : "/chamadas-atencao")}
        >
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <ClipboardList size={16} color="#F87171" />
                <Text style={{ color: "#F8FAFC" }} className="font-semibold">
                  {role === "encarregado" ? "Faltas dos educandos" : "Faltas nos últimos dias"}
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <View style={{ backgroundColor: "#1F2937", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text className="text-gray-400 text-xs">5 dias úteis</Text>
                </View>
                <ChevronRight size={16} color="#4B5563" />
              </View>
            </View>
            <AreaChart data={graficoFaltas} color="#F87171" height={150} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Donut de assiduidade — clicável */}
      {role !== "encarregado" && (
        <View className="px-6 mb-3">
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/turmas")}>
            <View
              className="rounded-2xl p-5 flex-row items-center justify-between"
              style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" }}
            >
              <View className="flex-1 pr-4">
                <View className="flex-row items-center mb-1" style={{ gap: 8 }}>
                  <PieChart size={16} color="#34D399" />
                  <Text style={{ color: "#F8FAFC" }} className="font-semibold">
                    Assiduidade geral
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs">
                  Percentagem de presenças confirmadas nos últimos dias úteis, em todas as turmas. Toca para ver o detalhe.
                </Text>
              </View>
              <DonutChart percentagem={assiduidade} cor="#34D399" legenda="Presença" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Acesso rápido */}
      <View className="px-6 pt-4">
        <Text style={{ color: "#F8FAFC" }} className="font-semibold mb-4">
          Acesso rápido
        </Text>

        <View className="gap-3 pb-10">
          {role === "admin" && (
            <AcessoRapidoItem Icon={Settings} label="Painel de Administração" destaque onPress={() => router.push("/admin")} />
          )}

          {role !== "admin" && (
  <AcessoRapidoItem Icon={Bell} label="Notificações" onPress={() => router.push("/notificacoes")} />
)}
          <AcessoRapidoItem Icon={School} label="Turmas e Alunos" onPress={() => router.push("/turmas")} />

          {role !== "encarregado" && (
            <>
              <AcessoRapidoItem Icon={CheckCircle2} label="Registar Presença" onPress={() => router.push("/registar-presenca")} />
              <AcessoRapidoItem Icon={AlertTriangle} label="Chamadas de Atenção" onPress={() => router.push("/chamadas-atencao")} />
            </>
          )}

          <AcessoRapidoItem Icon={CalendarDays} label="Reuniões" onPress={() => router.push("/reunioes")} />
        </View>
      </View>
    </ScrollView>
  );
}