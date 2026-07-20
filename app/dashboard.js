import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AnimatedNumber from "../components/AnimatedNumber";
import AreaChart from "../components/AreaChart";
import DonutChart from "../components/DonutChart";
import ThemeToggle from "../components/ThemeToggle";
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
  LayoutDashboard,
  Users,
  BookOpen,
  UserCog,
} from "lucide-react-native";

const ROLE_LABEL = {
  admin: "Administrador",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

// A partir desta largura (em pontos), o admin passa a ver o layout "desktop" com sidebar.
// Ajusta este número se quiseres que o novo visual apareça mais cedo/tarde.
const LARGURA_DESKTOP = 900;

const PALETA = {
  dark: {
    fundo: "#0B1120",
    cartao: "#111827",
    borda: "#1F2937",
    texto: "#F8FAFC",
    textoSecundario: "#64748B",
    destaqueBg: "#22D3EE",
    destaqueTexto: "#0B1120",
  },
  light: {
    fundo: "#F8FAFC",
    cartao: "#FFFFFF",
    borda: "#E2E8F0",
    texto: "#0F172A",
    textoSecundario: "#64748B",
    destaqueBg: "#0F172A",
    destaqueTexto: "#FFFFFF",
  },
};

// Mesmas cores de sempre da app — só com uma variante "escura" para os cartões
// sólidos do layout desktop (mantém a identidade de cor, muda só o estilo do bloco).
const CORES_KPI = {
  turmas: { base: "#22D3EE", escuro: "#0E7490" },
  alunos: { base: "#818CF8", escuro: "#3730A3" },
  faltas: { base: "#F87171", escuro: "#991B1B" },
  chamadas: { base: "#FBBF24", escuro: "#92400E" },
};

function seteDiasAtras() {
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
    const diaSemana = cursor.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) dias.unshift(new Date(cursor));
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

function iniciaisDoNome(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function corAssiduidade(percentagem) {
  if (percentagem >= 85) return "#34D399";
  if (percentagem >= 60) return "#FBBF24";
  return "#F87171";
}

function KpiCard({ Icon, label, valor, cor, atraso = 0, onPress, cores }) {
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
        <View style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 16 }}>
          <View className="flex-row items-center justify-between mb-2">
            <View style={{ backgroundColor: `${cor}22`, borderRadius: 10, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Icon size={17} color={cor} strokeWidth={2.2} />
            </View>
            {onPress && <ChevronRight size={16} color={cores.textoSecundario} />}
          </View>
          <AnimatedNumber value={valor} style={{ color: cores.texto, fontSize: 26, fontWeight: "800" }} />
          <Text style={{ color: cores.textoSecundario, fontSize: 12, marginTop: 4 }}>{label}</Text>
          <View style={{ height: 3, borderRadius: 3, backgroundColor: cor, marginTop: 8, opacity: 0.7 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Cartão de KPI "sólido", usado só no layout desktop do admin (estilo do painel de referência).
function KpiCardDesktop({ Icon, label, valor, corFundo, atraso = 0, onPress }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }),
      Animated.timing(deslocamento, { toValue: 0, duration: 500, delay: atraso, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: opacidade, transform: [{ translateY: deslocamento }] }}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
        <View style={{ backgroundColor: corFundo, borderRadius: 16, padding: 20, minHeight: 118, justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ color: "#FFFFFFCC", fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", flex: 1 }}>
              {label}
            </Text>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFFFFF26", alignItems: "center", justifyContent: "center" }}>
              <Icon size={17} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </View>
          <AnimatedNumber value={valor} style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginTop: 12 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Item de navegação da sidebar (layout desktop do admin).
function ItemSidebar({ Icon, label, ativo = false, badge, onPress, cores }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: ativo ? `${cores.destaqueBg}1A` : "transparent",
        marginBottom: 2,
      }}
    >
      <Icon size={17} color={ativo ? cores.destaqueBg : cores.textoSecundario} strokeWidth={2.2} />
      <Text style={{ flex: 1, color: ativo ? cores.texto : cores.textoSecundario, fontSize: 13.5, fontWeight: ativo ? "700" : "500" }}>
        {label}
      </Text>
      {!!badge && badge > 0 && (
        <View style={{ backgroundColor: "#F87171", borderRadius: 999, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Título de secção da sidebar (ex: "GERAL", "OPERAÇÕES").
function SecaoSidebar({ titulo, children, cores }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          color: cores.textoSecundario,
          fontSize: 10.5,
          fontWeight: "700",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom: 8,
          paddingHorizontal: 10,
        }}
      >
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function CartaoEducando({ educando, atraso = 0, onPress, cores }) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }),
      Animated.timing(deslocamento, { toValue: 0, duration: 500, delay: atraso, useNativeDriver: true }),
    ]).start();
  }, []);

  const cor = corAssiduidade(educando.assiduidade);

  return (
    <Animated.View style={{ opacity: opacidade, transform: [{ translateY: deslocamento }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <View style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 20, marginBottom: 12 }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: cores.borda,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5, borderColor: cor,
                }}
              >
                <Text style={{ color: cor, fontWeight: "800", fontSize: 14 }}>{iniciaisDoNome(educando.nome)}</Text>
              </View>
              <View className="flex-1">
                <Text style={{ color: cores.texto, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{educando.nome}</Text>
                <Text style={{ color: cores.textoSecundario, fontSize: 12, marginTop: 2 }}>{educando.turmaNome}</Text>
              </View>
            </View>
            <DonutChart percentagem={educando.assiduidade} tamanho={62} espessura={7} cor={cor} legenda={null} />
          </View>

          <AreaChart data={educando.grafico} color="#F87171" height={90} />

          <View className="flex-row items-center justify-between mt-3 mb-3">
            <Text style={{ color: cores.textoSecundario, fontSize: 12 }}>Assiduidade nos últimos dias úteis</Text>
            <View style={{ backgroundColor: cores.borda, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: educando.faltasMes > 0 ? "#F87171" : cores.textoSecundario, fontSize: 11, fontWeight: "600" }}>
                {educando.faltasMes} {educando.faltasMes === 1 ? "falta" : "faltas"} este mês
              </Text>
            </View>
          </View>

          {educando.ultimaChamada && (
            <View style={{ backgroundColor: "#1E1B2E", borderWidth: 1, borderColor: "#3730A3", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <View className="flex-row items-center justify-between mb-1">
                <Text style={{ color: "#A78BFA", fontSize: 11, fontWeight: "700" }}>Última chamada de atenção</Text>
                <Text style={{ color: cores.textoSecundario, fontSize: 11 }}>{educando.ultimaChamada.data}</Text>
              </View>
              <Text style={{ color: "#E2E8F0", fontSize: 12 }} numberOfLines={1}>{educando.ultimaChamada.motivo}</Text>
            </View>
          )}

          <View className="flex-row items-center justify-end">
            <Text style={{ color: "#22D3EE", fontSize: 12, fontWeight: "600" }}>Ver histórico completo</Text>
            <ChevronRight size={14} color="#22D3EE" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AcessoRapidoItem({ label, Icon, destaque, onPress, cores }) {
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
          backgroundColor: destaque ? cores.destaqueBg : cores.cartao,
          borderWidth: destaque ? 0 : 1,
          borderColor: cores.borda,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Icon size={18} color={destaque ? cores.destaqueTexto : cores.textoSecundario} strokeWidth={2.2} />
          <Text style={{ color: destaque ? cores.destaqueTexto : cores.texto, fontWeight: "600", fontSize: 15 }}>{label}</Text>
        </View>
        <ChevronRight size={18} color={destaque ? cores.destaqueTexto : cores.textoSecundario} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const { theme } = useTheme();
  const cores = PALETA[theme] || PALETA.dark;
  const { width } = useWindowDimensions();
  const ehDesktop = width >= LARGURA_DESKTOP;

  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [chamadasMes, setChamadasMes] = useState(0);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [assiduidade, setAssiduidade] = useState(0);
  const [graficoFaltas, setGraficoFaltas] = useState([]);
  const [educandosDetalhados, setEducandosDetalhados] = useState([]);
  const [carregandoEducandos, setCarregandoEducandos] = useState(true);

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
    const unsubscribe = onSnapshot(qEducandos, async (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (lista.length === 0) {
        setEducandosDetalhados([]);
        setCarregandoEducandos(false);
        return;
      }

      let turmasMap = {};
      try {
        const turmasSnap = await getDocs(collection(db, "turmas"));
        turmasSnap.docs.forEach((t) => (turmasMap[t.id] = t.data().nome));
      } catch (erro) {
        console.log("Erro ao carregar turmas:", erro.message);
      }

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const detalhados = await Promise.all(
        lista.map(async (educando) => {
          try {
            const qPresencas = query(
              collection(db, "presencas"),
              where("aluno_id", "==", educando.id),
              where("data", ">=", seteDiasAtras())
            );
            const presSnap = await getDocs(qPresencas);
            const presencas = presSnap.docs.map((d) => d.data());
            const grafico = agruparUltimosDiasUteis(presencas, "falta");
            const totalPresente = presencas.filter((p) => p.estado === "presente").length;
            const totalGeral = presencas.length || 1;
            const assid = Math.round((totalPresente / totalGeral) * 100);

            const qFaltasMes = query(
              collection(db, "presencas"),
              where("aluno_id", "==", educando.id),
              where("data", ">=", inicioMes)
            );
            const faltasMesSnap = await getDocs(qFaltasMes);
            const faltasMes = faltasMesSnap.docs.filter((d) => d.data().estado === "falta").length;

            let ultimaChamada = null;
            try {
              const qChamada = query(
                collection(db, "chamadas_atencao"),
                where("aluno_id", "==", educando.id),
                orderBy("data", "desc"),
                limit(1)
              );
              const chamadaSnap = await getDocs(qChamada);
              if (!chamadaSnap.empty) {
                const c = chamadaSnap.docs[0].data();
                ultimaChamada = {
                  motivo: c.motivo,
                  gravidade: c.gravidade,
                  data: c.data?.toDate ? c.data.toDate().toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "",
                };
              }
            } catch (e) {
              console.log("Aviso: não foi possível carregar a última chamada de atenção:", e.message);
            }

            return {
              id: educando.id,
              nome: educando.nome,
              turmaNome: turmasMap[educando.turma_id] || "Sem turma",
              assiduidade: assid,
              grafico,
              faltasMes,
              ultimaChamada,
            };
          } catch (erro) {
            console.log("Erro ao carregar dados do educando", educando.id, ":", erro.message);
            return {
              id: educando.id,
              nome: educando.nome,
              turmaNome: turmasMap[educando.turma_id] || "Sem turma",
              assiduidade: 0,
              grafico: agruparUltimosDiasUteis([], "falta"),
              faltasMes: 0,
              ultimaChamada: null,
            };
          }
        })
      );

      setEducandosDetalhados(detalhados);
      setCarregandoEducandos(false);
    });

    return unsubscribe;
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
      <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  const role = userData?.role;
  const mostrarLayoutDesktopAdmin = ehDesktop && role === "admin";

  // ---------- LAYOUT DESKTOP (só admin + ecrã grande) ----------
  if (mostrarLayoutDesktopAdmin) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: cores.fundo }}>
        {/* Sidebar */}
        <View style={{ width: 260, backgroundColor: cores.cartao, borderRightWidth: 1, borderRightColor: cores.borda, paddingTop: 24 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, marginBottom: 28 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: cores.destaqueBg, alignItems: "center", justifyContent: "center" }}>
                <School size={19} color={cores.destaqueTexto} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={{ color: cores.texto, fontWeight: "800", fontSize: 14 }}>Controlo Presença</Text>
                <Text style={{ color: cores.textoSecundario, fontSize: 11 }}>Painel de Administração</Text>
              </View>
            </View>

            <SecaoSidebar titulo="Geral" cores={cores}>
              <ItemSidebar Icon={LayoutDashboard} label="Dashboard" ativo cores={cores} onPress={() => {}} />
              <ItemSidebar Icon={Bell} label="Notificações" badge={notificacoesNaoLidas} cores={cores} onPress={() => router.push("/notificacoes")} />
            </SecaoSidebar>

            <SecaoSidebar titulo="Operações" cores={cores}>
              <ItemSidebar Icon={School} label="Turmas e Alunos" cores={cores} onPress={() => router.push("/turmas")} />
              <ItemSidebar Icon={CheckCircle2} label="Registar Presença" cores={cores} onPress={() => router.push("/registar-presenca")} />
              <ItemSidebar Icon={AlertTriangle} label="Chamadas de Atenção" cores={cores} onPress={() => router.push("/chamadas-atencao")} />
              <ItemSidebar Icon={CalendarDays} label="Reuniões" cores={cores} onPress={() => router.push("/reunioes")} />
            </SecaoSidebar>

            <SecaoSidebar titulo="Administração" cores={cores}>
              <ItemSidebar Icon={Settings} label="Painel Admin" cores={cores} onPress={() => router.push("/admin")} />
              <ItemSidebar Icon={Users} label="Alunos" cores={cores} onPress={() => router.push("/admin/alunos")} />
              <ItemSidebar Icon={BookOpen} label="Professores" cores={cores} onPress={() => router.push("/admin/professores")} />
              <ItemSidebar Icon={UserCog} label="Utilizadores" cores={cores} onPress={() => router.push("/admin/utilizadores")} />
            </SecaoSidebar>
          </ScrollView>

          {/* Rodapé da sidebar: utilizador autenticado */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: cores.borda }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: cores.borda, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: cores.texto, fontWeight: "800", fontSize: 12 }}>{iniciaisDoNome(userData?.nome || user.email)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: cores.texto, fontWeight: "700", fontSize: 13 }}>{userData?.nome || user.email}</Text>
                <Text style={{ color: cores.textoSecundario, fontSize: 11 }}>{ROLE_LABEL[role]}</Text>
              </View>
              <ThemeToggle />
            </View>
            <TouchableOpacity onPress={terminarSessao} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }}>
              <LogOut size={15} color={cores.textoSecundario} />
              <Text style={{ color: cores.textoSecundario, fontSize: 13 }}>Terminar sessão</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conteúdo principal */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 32, maxWidth: 1280, width: "100%", alignSelf: "center" }}>
          <View style={{ marginBottom: 28 }}>
            <Text style={{ color: cores.textoSecundario, fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </Text>
            <Text style={{ color: cores.texto, fontSize: 26, fontWeight: "800" }}>Painel de Gestão Escolar</Text>
            <Text style={{ color: cores.textoSecundario, fontSize: 13, marginTop: 4 }}>
              Monitorização em tempo real de turmas, presenças e chamadas de atenção.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
            <KpiCardDesktop Icon={School} label="Turmas" valor={totalTurmas} corFundo={CORES_KPI.turmas.escuro} atraso={0} onPress={() => router.push("/turmas")} />
            <KpiCardDesktop Icon={GraduationCap} label="Alunos" valor={totalAlunos} corFundo={CORES_KPI.alunos.escuro} atraso={80} onPress={() => router.push("/turmas")} />
            <KpiCardDesktop Icon={ClipboardList} label="Faltas hoje" valor={faltasHoje} corFundo={CORES_KPI.faltas.escuro} atraso={160} onPress={() => router.push("/registar-presenca")} />
            <KpiCardDesktop Icon={AlertTriangle} label="Chamadas (mês)" valor={chamadasMes} corFundo={CORES_KPI.chamadas.escuro} atraso={240} onPress={() => router.push("/chamadas-atencao")} />
          </View>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 2, backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ClipboardList size={16} color="#F87171" />
                  <Text style={{ color: cores.texto, fontWeight: "700", fontSize: 15 }}>Faltas nos últimos dias</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/chamadas-atencao")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: cores.textoSecundario, fontSize: 12 }}>5 dias úteis</Text>
                  <ChevronRight size={16} color={cores.textoSecundario} />
                </TouchableOpacity>
              </View>
              <AreaChart data={graficoFaltas} color="#F87171" height={220} />
            </View>

            <View style={{ flex: 1, backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 20, alignItems: "center", justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 20 }}>
                <PieChart size={16} color="#34D399" />
                <Text style={{ color: cores.texto, fontWeight: "700", fontSize: 15 }}>Assiduidade Geral</Text>
              </View>
              <DonutChart percentagem={assiduidade} cor="#34D399" legenda="Presença" tamanho={160} espessura={16} />
              <Text style={{ color: cores.textoSecundario, fontSize: 12, textAlign: "center", marginTop: 16 }}>
                Percentagem de presenças confirmadas em todas as turmas, nos últimos dias úteis.
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ---------- LAYOUT ATUAL (telemóvel, ou professor/encarregado em qualquer largura) ----------
  return (
    <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View className="pt-14 pb-6 px-6">
        <View className="flex-row justify-between items-start gap-3">
          <View className="flex-1">
            <Text style={{ color: cores.textoSecundario, fontSize: 11, marginBottom: 4 }}>
              {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}
            </Text>
            <Text style={{ color: cores.texto, fontSize: 20, fontWeight: "700" }} numberOfLines={1}>
              Olá, {userData?.nome || user.email}
            </Text>
            <View className="flex-row items-center mt-1">
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22D3EE", marginRight: 6 }} />
              <Text style={{ color: cores.textoSecundario, fontSize: 13 }}>{ROLE_LABEL[role] || "Utilizador"}</Text>
            </View>
          </View>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <ThemeToggle />
            <TouchableOpacity onPress={terminarSessao} className="flex-row items-center" style={{ gap: 4 }}>
              <LogOut size={15} color={cores.textoSecundario} />
              <Text style={{ color: cores.textoSecundario, fontSize: 13 }}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {role === "encarregado" ? (
        <>
          <View className="px-6 mb-4">
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/notificacoes")}>
              <View
                className="rounded-2xl p-4 flex-row items-center justify-between"
                style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda }}
              >
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <View style={{ backgroundColor: "#A78BFA22", borderRadius: 10, width: 34, height: 34, alignItems: "center", justifyContent: "center" }}>
                    <Bell size={17} color="#A78BFA" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text style={{ color: cores.texto, fontWeight: "600" }}>Notificações</Text>
                    <Text style={{ color: cores.textoSecundario, fontSize: 12 }}>
                      {notificacoesNaoLidas > 0 ? `${notificacoesNaoLidas} por ler` : "Tudo em dia"}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={cores.textoSecundario} />
              </View>
            </TouchableOpacity>
          </View>

          <View className="px-6">
            <Text style={{ color: cores.texto, fontWeight: "600", marginBottom: 16 }}>
              Meu{educandosDetalhados.length > 1 ? "s" : ""} educando{educandosDetalhados.length > 1 ? "s" : ""}
            </Text>

            {carregandoEducandos && <ActivityIndicator size="large" color="#22D3EE" className="mb-4" />}

            {!carregandoEducandos && educandosDetalhados.length === 0 && (
              <View
                className="rounded-2xl p-6 mb-4 items-center"
                style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda }}
              >
                <GraduationCap size={28} color={cores.textoSecundario} />
                <Text style={{ color: cores.textoSecundario, fontSize: 13, textAlign: "center", marginTop: 12 }}>
                  Ainda não há nenhum educando associado à tua conta.{"\n"}Fala com a administração da escola para ligarem o teu perfil ao aluno certo.
                </Text>
              </View>
            )}

            {educandosDetalhados.map((educando, i) => (
              <CartaoEducando
                key={educando.id}
                educando={educando}
                atraso={i * 100}
                onPress={() => router.push(`/aluno/${educando.id}`)}
                cores={cores}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <View className="px-6">
            <View className="flex-row gap-3 mb-3">
              <KpiCard Icon={School} label="Turmas" valor={totalTurmas} cor="#22D3EE" atraso={0} onPress={() => router.push("/turmas")} cores={cores} />
              <KpiCard Icon={GraduationCap} label="Alunos" valor={totalAlunos} cor="#818CF8" atraso={80} onPress={() => router.push("/turmas")} cores={cores} />
            </View>
            <View className="flex-row gap-3 mb-3">
              <KpiCard Icon={ClipboardList} label="Faltas hoje" valor={faltasHoje} cor="#F87171" atraso={160} onPress={() => router.push("/registar-presenca")} cores={cores} />
              <KpiCard Icon={AlertTriangle} label="Chamadas (mês)" valor={chamadasMes} cor="#FBBF24" atraso={240} onPress={() => router.push("/chamadas-atencao")} cores={cores} />
            </View>
          </View>

          <View className="px-6 mb-3">
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/chamadas-atencao")}>
              <View style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 16 }}>
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <ClipboardList size={16} color="#F87171" />
                    <Text style={{ color: cores.texto, fontWeight: "600" }}>Faltas nos últimos dias</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <View style={{ backgroundColor: cores.borda, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: cores.textoSecundario, fontSize: 11 }}>5 dias úteis</Text>
                    </View>
                    <ChevronRight size={16} color={cores.textoSecundario} />
                  </View>
                </View>
                <AreaChart data={graficoFaltas} color="#F87171" height={150} />
              </View>
            </TouchableOpacity>
          </View>

          <View className="px-6 mb-3">
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/turmas")}>
              <View
                className="rounded-2xl p-5 flex-row items-center justify-between"
                style={{ backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda }}
              >
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-1" style={{ gap: 8 }}>
                    <PieChart size={16} color="#34D399" />
                    <Text style={{ color: cores.texto, fontWeight: "600" }}>Assiduidade geral</Text>
                  </View>
                  <Text style={{ color: cores.textoSecundario, fontSize: 12 }}>
                    Percentagem de presenças confirmadas nos últimos dias úteis, em todas as turmas. Toca para ver o detalhe.
                  </Text>
                </View>
                <DonutChart percentagem={assiduidade} cor="#34D399" legenda="Presença" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View className="px-6 pt-4">
        <Text style={{ color: cores.texto, fontWeight: "600", marginBottom: 16 }}>Acesso rápido</Text>

        <View className="gap-3 pb-10">
          {role === "admin" && (
            <AcessoRapidoItem Icon={Settings} label="Painel de Administração" destaque onPress={() => router.push("/admin")} cores={cores} />
          )}

          {role !== "admin" && (
            <AcessoRapidoItem Icon={Bell} label="Notificações" onPress={() => router.push("/notificacoes")} cores={cores} />
          )}

          {role !== "encarregado" && (
            <>
              <AcessoRapidoItem Icon={School} label="Turmas e Alunos" onPress={() => router.push("/turmas")} cores={cores} />
              <AcessoRapidoItem Icon={CheckCircle2} label="Registar Presença" onPress={() => router.push("/registar-presenca")} cores={cores} />
              <AcessoRapidoItem Icon={AlertTriangle} label="Chamadas de Atenção" onPress={() => router.push("/chamadas-atencao")} cores={cores} />
            </>
          )}

          <AcessoRapidoItem Icon={CalendarDays} label="Reuniões" onPress={() => router.push("/reunioes")} cores={cores} />
        </View>
      </View>
    </ScrollView>
  );
}