import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ClipboardList, GraduationCap, School, ShieldCheck, ChevronRight, Sparkles } from "lucide-react-native";
import { criarFaceSetDaEscola } from "../../utils/criarFaceSet";

const opcoes = [
  { label: "Gerir Turmas", rota: "/admin/turmas", descricao: "Organizar turmas, horários e salas", Icon: School },
  { label: "Gerir Alunos", rota: "/admin/alunos", descricao: "Visualizar e editar alunos", Icon: GraduationCap },
  { label: "Gerir Professores", rota: "/admin/professores", descricao: "Gerir equipa pedagógica", Icon: ClipboardList },
  { label: "Gerir Utilizadores", rota: "/admin/utilizadores", descricao: "Atribuir permissões e acessos", Icon: ShieldCheck },
];

export default function AdminHomeScreen() {
  const router = useRouter();

  const inicializarFaceSet = async () => {
    try {
      const resultado = await criarFaceSetDaEscola();
      Alert.alert("Resultado", JSON.stringify(resultado));
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-6 pt-8 pb-6 lg:px-10 lg:pt-10">
        <View className="flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <View className="max-w-2xl">
            <Text className="text-slate-500 uppercase tracking-[0.35em] text-xs font-semibold mb-3">Painel de Gestão</Text>
            <Text className="text-slate-950 text-3xl font-bold leading-tight sm:text-4xl">Painel de Administração Estratégica</Text>
            <Text className="mt-4 text-slate-600 text-sm leading-6 sm:text-base">
              Monitorize turmas, professores, alunos e utilizadores com um painel claro, desktop-friendly e exatamente alinhado ao estilo do dashboard desejado.
            </Text>
          </View>

          <View className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <Text className="text-slate-700 font-semibold">Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={inicializarFaceSet}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-sm"
            >
              <Text className="font-semibold">Inicializar FaceSet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="px-6 pb-10 lg:px-10">
        <View className="flex flex-col gap-6 lg:flex-row">
          <View className="w-full rounded-[32px] bg-[#491A2A] p-6 shadow-xl lg:w-[320px]">
            <Text className="text-slate-200 uppercase tracking-[0.35em] text-xs font-semibold mb-6">Menu Admin</Text>
            {opcoes.map((opcao) => (
              <TouchableOpacity
                key={opcao.rota}
                onPress={() => router.push(opcao.rota)}
                className="mb-3 rounded-[28px] bg-[#381422] px-5 py-4"
              >
                <View className="flex-row items-start gap-3">
                  <View className="rounded-2xl bg-[#5B2037] p-3">
                    <opcao.Icon size={18} color="#F8FAFC" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{opcao.label}</Text>
                    <Text className="text-slate-400 text-xs mt-1">{opcao.descricao}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-1 space-y-6">
            <View className="flex flex-col gap-4 sm:flex-row">
              <View className="flex-1 rounded-[32px] bg-[#7C1E32] p-6 shadow-sm">
                <Text className="text-slate-100 uppercase text-xs tracking-[0.2em] font-semibold mb-2">Total de Utilizadores</Text>
                <Text className="text-white text-4xl font-bold">2.143</Text>
                <Text className="text-slate-300 text-sm mt-3">+4% vs anterior</Text>
              </View>
              <View className="flex-1 rounded-[32px] bg-[#1D3D75] p-6 shadow-sm">
                <Text className="text-slate-100 uppercase text-xs tracking-[0.2em] font-semibold mb-2">Turmas Ativas</Text>
                <Text className="text-white text-4xl font-bold">148</Text>
                <Text className="text-slate-300 text-sm mt-3">Visualize a gestão de horários</Text>
              </View>
            </View>

            <View className="flex flex-col gap-4 lg:flex-row">
              <View className="flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-slate-200">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-slate-900 font-semibold text-base">Métricas Analíticas</Text>
                  <View className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                    <Text className="text-slate-500 text-xs">Semanal</Text>
                  </View>
                </View>
                <Text className="text-slate-600 text-sm leading-6">
                  Clique nos itens para explorar relatórios de presença, chamadas de atenção e progresso por turma.
                </Text>
                <View className="mt-6 rounded-[24px] bg-slate-50 p-4">
                  <Text className="text-slate-500 text-xs uppercase tracking-[0.2em]">Linha de tempo</Text>
                  <Text className="text-slate-900 font-semibold text-2xl mt-3">Resumo visual de presença</Text>
                </View>
              </View>

              <View className="w-full rounded-[32px] bg-white p-6 shadow-sm border border-slate-200 lg:w-[320px]">
                <Text className="text-slate-900 font-semibold text-base mb-4">Status de Alocação</Text>
                <View className="rounded-[28px] bg-slate-950 p-5 text-center">
                  <Text className="text-slate-200 uppercase text-xs tracking-[0.2em] font-semibold">Total</Text>
                  <Text className="text-white text-3xl font-bold mt-4">2.143</Text>
                </View>
                <View className="mt-5 space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 text-sm">Em Serviço</Text>
                    <Text className="text-slate-900 font-semibold">1.480</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-600 text-sm">Disponíveis</Text>
                    <Text className="text-slate-900 font-semibold">563</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-200">
              <Text className="text-slate-900 font-semibold text-base mb-4">Ações Rápidas</Text>
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={() => router.push("/admin/turmas")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <Text className="text-slate-900 font-medium">Gestão de Turmas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/admin/alunos")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <Text className="text-slate-900 font-medium">Gestão de Alunos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/admin/utilizadores")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <Text className="text-slate-900 font-medium">Gestão de Utilizadores</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
