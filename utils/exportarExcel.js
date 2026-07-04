import XLSX from "xlsx-js-style";
import { Platform } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const ESTILO_TITULO = {
  font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "0F172A" } },
  alignment: { horizontal: "left", vertical: "center" },
};

const ESTILO_SUBTITULO = {
  font: { bold: true, sz: 11, color: { rgb: "64748B" } },
};

const ESTILO_LABEL_CARTAO = {
  font: { sz: 10, color: { rgb: "64748B" } },
};

const ESTILO_VALOR_CARTAO = {
  font: { bold: true, sz: 20, color: { rgb: "0F172A" } },
};

const ESTILO_CABECALHO_TABELA = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "0F172A" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "0F172A" } },
    bottom: { style: "thin", color: { rgb: "0F172A" } },
  },
};

const ESTILO_CELULA = {
  border: {
    top: { style: "thin", color: { rgb: "E2E8F0" } },
    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
    left: { style: "thin", color: { rgb: "E2E8F0" } },
    right: { style: "thin", color: { rgb: "E2E8F0" } },
  },
};

const ESTILO_CELULA_FALTA = {
  ...ESTILO_CELULA,
  font: { bold: true, color: { rgb: "DC2626" } },
};

const ESTILO_CELULA_OK = {
  ...ESTILO_CELULA,
  font: { bold: true, color: { rgb: "059669" } },
};

function celula(valor, estilo) {
  return { v: valor, t: typeof valor === "number" ? "n" : "s", s: estilo };
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
  const mediaAssiduidade =
    totalAlunos > 0
      ? Math.round(
          (linhasAlunos.reduce((s, a) => s + a.presencas, 0) /
            (linhasAlunos.reduce((s, a) => s + a.presencas + a.faltas + a.atrasos, 0) || 1)) *
            100
        )
      : 0;

  const workbook = XLSX.utils.book_new();

  // ---------- FOLHA 1: RESUMO (estilo dashboard) ----------
  const resumo = [];

  resumo[0] = [celula(`Controlo de Presença — ${nomeTurma}`, ESTILO_TITULO)];
  resumo[1] = [celula(`Relatório gerado em ${new Date().toLocaleDateString("pt-PT")}`, ESTILO_SUBTITULO)];
  resumo[2] = [];
  resumo[3] = [
    celula("Total de Alunos", ESTILO_LABEL_CARTAO),
    celula("Faltas Registadas", ESTILO_LABEL_CARTAO),
    celula("Atrasos", ESTILO_LABEL_CARTAO),
    celula("Assiduidade Média", ESTILO_LABEL_CARTAO),
  ];
  resumo[4] = [
    celula(totalAlunos, ESTILO_VALOR_CARTAO),
    celula(totalFaltas, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: "DC2626" } } }),
    celula(totalAtrasos, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: "D97706" } } }),
    celula(`${mediaAssiduidade}%`, { ...ESTILO_VALOR_CARTAO, font: { ...ESTILO_VALOR_CARTAO.font, color: { rgb: "059669" } } }),
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  wsResumo["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  wsResumo["!rows"] = [{ hpt: 28 }, { hpt: 18 }, {}, { hpt: 16 }, { hpt: 26 }];
  XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

  // ---------- FOLHA 2: DETALHE POR ALUNO ----------
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
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: `Exportar presenças - ${nomeTurma}`,
    });
  }
}