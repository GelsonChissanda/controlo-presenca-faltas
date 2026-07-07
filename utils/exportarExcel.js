import XLSX from "xlsx-js-style";
import { Platform } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const COR_FUNDO_ESCURO = "0F172A";
const COR_TEXTO_CLARO = "FFFFFF";
const COR_MUTED = "64748B";
const COR_LINHA = "E2E8F0";
const COR_FALTA = "F87171";
const COR_FALTA_FORTE = "DC2626";
const COR_OK = "34D399";
const COR_OK_FORTE = "059669";
const COR_ATRASO = "FBBF24";
const COR_VAZIO = "F1F5F9";

const ESTILO_TITULO = {
  font: { bold: true, sz: 16, color: { rgb: COR_TEXTO_CLARO } },
  fill: { fgColor: { rgb: COR_FUNDO_ESCURO } },
  alignment: { horizontal: "left", vertical: "center" },
};

const ESTILO_SUBTITULO = {
  font: { bold: true, sz: 11, color: { rgb: COR_MUTED } },
};

const ESTILO_SECCAO = {
  font: { bold: true, sz: 12, color: { rgb: "0F172A" } },
};

const ESTILO_LABEL_CARTAO = { font: { sz: 10, color: { rgb: COR_MUTED } } };
const ESTILO_VALOR_CARTAO = { font: { bold: true, sz: 20, color: { rgb: "0F172A" } } };

const ESTILO_CABECALHO_TABELA = {
  font: { bold: true, color: { rgb: COR_TEXTO_CLARO } },
  fill: { fgColor: { rgb: COR_FUNDO_ESCURO } },
  alignment: { horizontal: "center", vertical: "center" },
};

const ESTILO_CELULA = {
  border: {
    top: { style: "thin", color: { rgb: COR_LINHA } },
    bottom: { style: "thin", color: { rgb: COR_LINHA } },
    left: { style: "thin", color: { rgb: COR_LINHA } },
    right: { style: "thin", color: { rgb: COR_LINHA } },
  },
};

const ESTILO_CELULA_FALTA = { ...ESTILO_CELULA, font: { bold: true, color: { rgb: COR_FALTA_FORTE } } };
const ESTILO_CELULA_OK = { ...ESTILO_CELULA, font: { bold: true, color: { rgb: COR_OK_FORTE } } };

function celula(valor, estilo) {
  return { v: valor === "" ? " " : valor, t: typeof valor === "number" ? "n" : "s", s: estilo };
}

function barraPreenchida(cor) {
  return { v: " ", t: "s", s: { fill: { fgColor: { rgb: cor } } } };
}

function barraVazia() {
  return { v: " ", t: "s", s: { fill: { fgColor: { rgb: COR_VAZIO } } } };
}

// Últimos N dias úteis (sem sábado/domingo), a partir de hoje
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

function contarPorDia(presencas, dias, estado) {
  return dias.map((dia) => {
    const proximo = new Date(dia);
    proximo.setDate(dia.getDate() + 1);
    return presencas.filter((p) => {
      const d = p.data?.toDate ? p.data.toDate() : null;
      return d && d >= dia && d < proximo && p.estado === estado;
    }).length;
  });
}

export async function exportarPresencasDaTurma(turmaId, nomeTurma, alunos) {
  const q = query(collection(db, "presencas"), where("turma_id", "==", turmaId));
  const snapshot = await getDocs(q);
  const presencas = snapshot.docs.map((d) => d.data());

  const linhasAlunos = alunos.map((aluno) => {
    const doAluno = presencas.filter((p) => p.aluno_id === aluno.id);
    return {
      numeroProcesso: aluno.numero_processo,
      nome: aluno.nome,
      presencas: doAluno.filter((p) => p.estado === "presente").length,
      faltas: doAluno.filter((p) => p.estado === "falta").length,
      atrasos: doAluno.filter((p) => p.estado === "atraso").length,
    };
  });

  const totalAlunos = linhasAlunos.length;
  const totalFaltas = linhasAlunos.reduce((s, a) => s + a.faltas, 0);
  const totalAtrasos = linhasAlunos.reduce((s, a) => s + a.atrasos, 0);
  const totalPresencas = linhasAlunos.reduce((s, a) => s + a.presencas, 0);
  const totalRegistos = totalPresencas + totalFaltas + totalAtrasos || 1;
  const mediaAssiduidade = Math.round((totalPresencas / totalRegistos) * 100);

  // Dados para o "gráfico" de tendência (últimos 5 dias úteis)
  const dias = ultimosDiasUteis(5);
  const labelsDias = dias.map((d) => d.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "").slice(0, 3));
  const faltasPorDia = contarPorDia(presencas, dias, "falta");
  const maxFaltasDia = Math.max(...faltasPorDia, 1);
  const ALTURA_BARRA = 8; // nº de linhas de altura do gráfico

  const workbook = XLSX.utils.book_new();

  // =================== FOLHA 1: RESUMO ===================
  const resumo = [];

  resumo[0] = [celula(`Controlo de Presença — ${nomeTurma}`, ESTILO_TITULO)];
  resumo[1] = [celula(`Relatório gerado em ${new Date().toLocaleDateString("pt-PT")}`, ESTILO_SUBTITULO)];
  resumo[2] = [];

  // --- Cartões de KPI ---
  resumo[3] = [
    celula("Total de Alunos", ESTILO_LABEL_CARTAO),
    celula("Faltas Registadas", ESTILO_LABEL_CARTAO),
    celula("Atrasos", ESTILO_LABEL_CARTAO),
    celula("Assiduidade Média", ESTILO_LABEL_CARTAO),
    celula("", {}),
  ];
  resumo[4] = [
    celula(totalAlunos, ESTILO_VALOR_CARTAO),
    celula(totalFaltas, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: COR_FALTA_FORTE } } }),
    celula(totalAtrasos, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: "D97706" } } }),
    celula(`${mediaAssiduidade}%`, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: COR_OK_FORTE } } }),
    celula("", {}),
  ];
  resumo[5] = [];

  // --- Gráfico de tendência de faltas (barras feitas com células) ---
  resumo[6] = [celula("📉  Tendência de Faltas — últimos 5 dias úteis", ESTILO_SECCAO)];
  resumo[7] = [];

  const linhaBaseGrafico = 8; // primeira linha do "gráfico" de barras
  for (let l = 0; l < ALTURA_BARRA; l++) {
    const linha = [];
    for (let c = 0; c < faltasPorDia.length; c++) {
      const valor = faltasPorDia[c];
      const alturaPreenchida = Math.round((valor / maxFaltasDia) * ALTURA_BARRA);
      const nivelAtual = ALTURA_BARRA - l; // conta de baixo para cima
      linha[c] = nivelAtual <= alturaPreenchida && valor > 0 ? barraPreenchida(COR_FALTA) : barraVazia();
    }
    resumo[linhaBaseGrafico + l] = linha;
  }
  // valores no topo de cada barra
  resumo[linhaBaseGrafico + ALTURA_BARRA] = faltasPorDia.map((v) =>
    celula(v, { font: { bold: true, sz: 10, color: { rgb: COR_FALTA_FORTE } }, alignment: { horizontal: "center" } })
  );
  // labels dos dias
  resumo[linhaBaseGrafico + ALTURA_BARRA + 1] = labelsDias.map((l) =>
    celula(l, { font: { sz: 10, color: { rgb: COR_MUTED } }, alignment: { horizontal: "center" } })
  );

  const linhaAposGrafico = linhaBaseGrafico + ALTURA_BARRA + 3;

  // --- Barra de assiduidade geral (progresso horizontal) ---
  resumo[linhaAposGrafico] = [celula("🟢  Assiduidade Geral da Turma", ESTILO_SECCAO)];
  resumo[linhaAposGrafico + 1] = [];

  const SEGMENTOS_BARRA = 20;
  const segmentosPreenchidos = Math.round((mediaAssiduidade / 100) * SEGMENTOS_BARRA);
  const linhaProgresso = [];
  for (let i = 0; i < SEGMENTOS_BARRA; i++) {
    linhaProgresso.push(i < segmentosPreenchidos ? barraPreenchida(COR_OK) : barraVazia());
  }
  // distribui os 20 segmentos pelas 5 colunas disponíveis (4 segmentos por coluna via merge visual simplificado)
  resumo[linhaAposGrafico + 2] = [
    { v: " ", t: "s", s: linhaProgresso[0].s },
  ];
  // Como só temos 5 colunas de largura definida, construímos a barra ocupando as 5 colunas com gradação proporcional
  const colunasBarraProgresso = 5;
  const linhaBarraSimplificada = [];
  for (let c = 0; c < colunasBarraProgresso; c++) {
    const limiteInferior = (c / colunasBarraProgresso) * 100;
    linhaBarraSimplificada.push(mediaAssiduidade > limiteInferior ? barraPreenchida(COR_OK) : barraVazia());
  }
  resumo[linhaAposGrafico + 2] = linhaBarraSimplificada;
  resumo[linhaAposGrafico + 3] = [
    celula(`${mediaAssiduidade}% de assiduidade nos registos desta turma`, {
      font: { italic: true, sz: 10, color: { rgb: COR_MUTED } },
    }),
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } },
    { s: { r: linhaAposGrafico, c: 0 }, e: { r: linhaAposGrafico, c: 4 } },
    { s: { r: linhaAposGrafico + 3, c: 0 }, e: { r: linhaAposGrafico + 3, c: 4 } },
  ];
  wsResumo["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

  // =================== FOLHA 2: DETALHE POR ALUNO ===================
  const cabecalho = ["Nº Processo", "Nome", "Presenças", "Faltas", "Atrasos"].map((t) =>
    celula(t, ESTILO_CABECALHO_TABELA)
  );
  const linhasTabela = linhasAlunos.map((a) => [
    celula(a.numeroProcesso, ESTILO_CELULA),
    celula(a.nome, ESTILO_CELULA),
    celula(a.presencas, ESTILO_CELULA_OK),
    celula(a.faltas, a.faltas > 0 ? ESTILO_CELULA_FALTA : ESTILO_CELULA),
    celula(a.atrasos, a.atrasos > 0 ? ESTILO_CELULA_FALTA : ESTILO_CELULA),
  ]);
  const wsDetalhe = XLSX.utils.aoa_to_sheet([cabecalho, ...linhasTabela]);
  wsDetalhe["!cols"] = [{ wch: 14 }, { wch: 26 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, wsDetalhe, "Detalhe por Aluno");

  const nomeFicheiro = `presencas_${nomeTurma.replace(/\s/g, "_")}.xlsx`;

  if (Platform.OS === "web") {
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeFicheiro;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const uri = FileSystem.cacheDirectory + nomeFicheiro;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: `Exportar presenças - ${nomeTurma}`,
    });
  }
}