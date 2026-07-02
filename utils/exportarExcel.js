import * as XLSX from "xlsx";
import { Platform } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function exportarPresencasDaTurma(turmaId, nomeTurma, alunos) {
  // Busca todas as presenças desta turma
  const q = query(collection(db, "presencas"), where("turma_id", "==", turmaId));
  const snapshot = await getDocs(q);
  const presencas = snapshot.docs.map((d) => d.data());

  // Monta as linhas do Excel
  const linhas = alunos.map((aluno) => {
    const presencasDoAluno = presencas.filter((p) => p.aluno_id === aluno.id);
    const totalFaltas = presencasDoAluno.filter((p) => p.estado === "falta").length;
    const totalAtrasos = presencasDoAluno.filter((p) => p.estado === "atraso").length;
    const totalPresencas = presencasDoAluno.filter((p) => p.estado === "presente").length;

    return {
      "Nº Processo": aluno.numero_processo,
      "Nome": aluno.nome,
      "Presenças": totalPresencas,
      "Faltas": totalFaltas,
      "Atrasos": totalAtrasos,
    };
  });

  // Cria a folha de Excel
  const worksheet = XLSX.utils.json_to_sheet(linhas);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, nomeTurma.substring(0, 31));

  const nomeFicheiro = `presencas_${nomeTurma.replace(/\s/g, "_")}.xlsx`;

  if (Platform.OS === "web") {
    // No browser: gera o ficheiro e força o download diretamente
    XLSX.writeFile(workbook, nomeFicheiro);
    return;
  }

  // Em Android/iOS: usa FileSystem + Sharing (import dinâmico para não quebrar a web)
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