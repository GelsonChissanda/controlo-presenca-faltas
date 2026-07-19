# Controlo de Presença e Faltas

App de controlo de presença e faltas de alunos, com reconhecimento facial, construído com React Native (Expo) e Firebase.

## Stack

- **React Native + Expo** (SDK 54) — frontend mobile, testado via Expo Go
- **Firebase Auth** — autenticação (email/password)
- **Firebase Firestore** — base de dados
- **Firebase Storage** — foto de perfil dos alunos (reaproveitada da foto de registo do rosto)
- **Face++ (faceplusplus.com API)** — reconhecimento facial (FaceSet + `/detect` + `/search`)
- **expo-camera** — captura de fotos (registo de rosto + chamada automática)
- **expo-av** — som de confirmação no reconhecimento facial
- **react-native-svg** — gráficos do dashboard (área + donut), desenhados à mão (sem lib de charts)
- **lucide-react-native** — ícones vetoriais (sem emojis no dashboard)
- **xlsx-js-style** — exportação de relatórios Excel com formatação (cores, "gráfico" feito de células)
- **NativeWind (Tailwind para RN)** — estilização; `darkMode: "class"` configurado para o tema claro/escuro
- **Expo Router** — navegação por ficheiros

> ⚠️ **Reconhecimento facial (Face++) não funciona no browser/web** — bloqueio de CORS do próprio browser. Só funciona em dispositivo físico via Expo Go (ou build nativa). O resto da app funciona normalmente na web.

## Requisitos

- **Node.js** (confirmar versão exata usada — não há `.nvmrc` confirmado neste histórico; verificar se existe no repositório antes de assumir)
- npm
- **Expo Go** instalado no telemóvel (Android/iOS) — usado para todo o desenvolvimento até agora, **nunca foi gerada uma development build/EAS build**
- Git
- Conta gratuita no [Face++](https://console.faceplusplus.com) (API Key + Secret)
- Projeto Firebase com Auth + Firestore + Storage ativos

## Como rodar o projeto do zero

```powershell
git clone <url-do-repositorio>
cd controlo-presenca-faltas
npm install
npx expo start --web -c
```

> ⚠️ **Nota sobre `npm ci` vs `npm install`:** em teoria `npm ci` é mais seguro (instala exatamente o que está no `package-lock.json`), mas isto só funciona se o `.npmrc` com `legacy-peer-deps=true` **existir mesmo no repositório**. Isto não foi confirmado como criado nesta conversa — antes de confiar nesta instrução, verificar se o ficheiro `.npmrc` existe na raiz do projeto. Se não existir e houver erros `ERESOLVE`, usar `npm install --legacy-peer-deps`.

Depois de `npx expo start`, escanear o QR code com o **Expo Go** (Android) ou a **app Câmera** (iOS), no mesmo Wi-Fi do computador.

### Se o Expo Go disser "Project is incompatible"

O SDK do Expo evolui rápido e a app Expo Go das lojas por vezes fica desalinhada com o SDK do projeto (para cima ou para baixo, já aconteceram os dois casos neste projeto). Confirmar:
```powershell
npm list expo
```
E comparar com a versão que a Expo Go do telemóvel suporta (ver App Store/Play Store — atualizar a app se necessário).

## Variáveis / configs sensíveis (⚠️ confirmar `.gitignore`)

- `firebaseConfig.js` (raiz) — credenciais do projeto Firebase (Auth, Firestore, Storage). A `apiKey` do Firebase não é secreta por natureza (a segurança vem das Firestore Rules), mas **os restantes campos e o próprio ficheiro devem ser tratados como sensíveis por convenção**.
- `faceppConfig.js` (raiz) — `FACEPP_API_KEY` e `FACEPP_API_SECRET`. **Estas sim são credenciais sensíveis** — já foram expostas uma vez numa captura de ecrã partilhada durante o desenvolvimento; recomenda-se gerar uma nova chave no painel Face++ antes de qualquer uso em produção.

**Ação pendente:** confirmar se estes dois ficheiros estão listados no `.gitignore`. Se o repositório for tornado público nalgum momento, isto é crítico.

## Perfis de utilizador (roles)

Guardados no documento Firestore `users/{uid}`. Campos confirmados no documento `users`:
`uid`, `email`, `nome`, `role`, `professor_id`, `encarregado_id` (legado, não usado ativamente), `consentimento_biometria`, `criado_em`.

Três valores possíveis de `role`: `admin`, `professor`, `encarregado`.

**Como uma conta é criada:**
1. Qualquer pessoa cria conta pelo ecrã `app/criar-conta.js` → fica automaticamente com `role: "encarregado"`.
2. Para tornar alguém `professor` ou `admin`, o Admin vai a `app/admin/utilizadores.js`, encontra a conta pelo email, e muda o `role` — ligando ao registo correspondente em `professores` (campo `professor_id`) quando o role escolhido é `professor`.
3. **Não existe** criação de conta pelo Admin com password definida por ele — a pessoa (ou o próprio Admin em nome dela) tem sempre de passar primeiro pelo ecrã de registo público.

**Dashboard (`app/dashboard.js`) difere por role:**
- `admin` / `professor`: dashboard geral da escola — KPIs (turmas, alunos, faltas hoje, chamadas do mês), gráfico de área "faltas nos últimos 5 dias úteis", donut de assiduidade geral. Todos os cartões e o gráfico são clicáveis e navegam para o ecrã relevante.
- `encarregado`: não vê KPIs gerais nem "Turmas e Alunos" no acesso rápido. Vê um cartão por cada educando (via `alunos` onde `encarregados_ids` contém o seu `uid`), com avatar (iniciais, cor conforme assiduidade), donut de assiduidade individual, gráfico de faltas do educando, contagem de faltas do mês, e a última chamada de atenção (se existir).
- Tema claro/escuro: implementado via `context/ThemeContext.js` (usa `useColorScheme` do NativeWind) + botão `components/ThemeToggle.js`. **Só o `dashboard.js` respeita os dois temas até ao momento** — as restantes páginas ainda estão fixas no estilo claro original.

## Modelo de dados (Firestore) — campos confirmados

| Coleção | Campos confirmados |
|---|---|
| `alunos` | `nome`, `numero_processo`, `turma_id`, `data_nascimento`, `foto` (URL do Storage, preenchido automaticamente no registo do rosto), `encarregados_ids` (array de UIDs de `users`), `estado` (`"ativo"`), `face_token` (Face++), `criado_em` |
| `professores` | `nome`, `email`, `telefone`, `disciplinas` (array), `criado_em` |
| `turmas` | `nome`, `ano_letivo`, `sala`, `professor_titular_id`, `professores_ids` (array), `criado_em` |
| `presencas` | `aluno_id`, `turma_id`, `data`, `estado` (`presente`/`falta`/`atraso`), `justificada`, `observacoes`, `registado_por`, `criado_em` |
| `chamadas_atencao` | `aluno_id`, `motivo`, `gravidade` (`leve`/`media`/`grave`), `descricao`, `registado_por`, `data`, `encarregado_notificado`, `criado_em` |
| `reunioes` | `tipo` (`pais`/`pessoal`), `titulo`, `data`, `local`, `motivo`, `aluno_id`, `participantes_ids` (array), `estado` (`pendente`/`confirmada`/`recusada`), `criado_por`, `criado_em` |
| `notificacoes` | `destinatario_id` (uid), `tipo` (`falta`/`chamada_atencao`/`reuniao`), `titulo`, `mensagem`, `referencia_id`, `lida`, `data_envio` |
| `users` | ver secção "Perfis de utilizador" acima |

> ⚠️ **Correção importante:** numa fase inicial de planeamento (antes de qualquer código), foi desenhada uma coleção `encarregados` separada. **Esta coleção nunca chegou a ser implementada nem é usada pela app real.** Os encarregados existem apenas como documentos em `users` com `role: "encarregado"`, e a ligação aluno↔encarregado é feita via `alunos.encarregados_ids` (array de UIDs de `users`), não através de nenhuma coleção `encarregados`. Se encontrares essa coleção vazia no Firestore, é resíduo do planeamento inicial — pode ser ignorada/removida.

## Regras de segurança (`firestore.rules`)

Pontos-chave implementados:
- `users/{userId}`: cada um só lê/escreve o seu próprio documento; admin lê/escreve todos.
- `turmas`, `professores`: leitura aberta a qualquer autenticado; escrita só admin.
- `alunos/{alunoId}`: leitura para admin/professor, **ou** para encarregado se `request.auth.uid in resource.data.encarregados_ids`; escrita só admin.
- `presencas`, `chamadas_atencao`: leitura condicionada à mesma lógica de `encarregados_ids` do aluno referenciado (via `resource.data.aluno_id`); escrita para admin/professor.
- `notificacoes`: cada um só lê as suas (`destinatario_id == uid`); admin lê todas.

⚠️ Nota técnica: a primeira versão desta regra usava `get()` dentro de uma função de verificação para consultas de lista (`where("encarregados_ids","array-contains",uid)`), o que causava `permission-denied` em queries de lista. A correção foi verificar diretamente `resource.data.encarregados_ids` sem `get()` extra — manter esta abordagem.

## Rotas principais (Expo Router, pasta `app/`)

```
app/
  index.js                          → Login
  criar-conta.js                    → Registo público (role: encarregado)
  dashboard.js                      → Dashboard (varia por role, tema claro/escuro)
  notificacoes.js                   → Lista de notificações do utilizador autenticado
  turmas.js                         → Lista de turmas
  turmas/[id].js                    → Alunos de uma turma + botão exportar Excel
  aluno/[id].js                     → Histórico do aluno (presenças + chamadas de atenção, com filtros)
  registar-presenca.js              → Escolher turma → escolhe Manual ou Facial (Alert com 2 opções)
  chamada/[turmaId].js              → Chamada manual (marcar presente/falta/atraso por aluno)
  chamada-facial/[turmaId].js       → Chamada automática (reconhecimento facial, botão manual de captura)
  registar-rosto/[alunoId].js       → Captura e regista o rosto do aluno no Face++ + foto de perfil
  chamada-atencao/[alunoId].js      → Nova chamada de atenção
  chamadas-atencao.js               → Vista geral de chamadas de atenção (filtro por gravidade)
  reunioes.js                       → Lista + agendamento de reuniões (modal)
  admin/
    index.js                        → Menu do painel de admin
    turmas.js                       → CRUD de turmas
    alunos.js                       → CRUD de alunos (turma + encarregados + botão "Rosto")
    professores.js                  → CRUD de professores
    utilizadores.js                 → Gestão de roles + consentimento de biometria
```

## Reconhecimento facial (fluxo completo)

1. **Consentimento**: em `admin/utilizadores.js`, ao editar um utilizador com `role: "encarregado"`, existe um interruptor "Consentimento de Biometria" → grava `consentimento_biometria: true/false` no documento `users`.
2. **Registo de rosto** (`registar-rosto/[alunoId].js`): antes de abrir a câmara, `admin/alunos.js` verifica se **pelo menos um** encarregado do aluno (`encarregados_ids`) tem `consentimento_biometria: true`; caso contrário, bloqueia com aviso.
   - Foto capturada via `expo-camera` (`CameraView`, `facing="front"`).
   - `utils/registarRosto.js` → `/facepp/v3/detect` (confirma exatamente 1 rosto) → `/facepp/v3/faceset/addface` (adiciona ao FaceSet `controlo_presenca_alunos`) → devolve `face_token`, guardado em `alunos/{id}.face_token`.
   - `utils/uploadFoto.js` → a mesma foto (base64) é enviada para o Firebase Storage (`alunos/{id}.jpg`) e o URL fica em `alunos/{id}.foto` — **não há upload de foto separado, é sempre a foto do registo do rosto**.
3. **Chamada automática** (`chamada-facial/[turmaId].js`): botão manual "📸 Reconhecer Aluno" (não é captura contínua automática — foi trocado a pedido, para dar controlo ao professor).
   - `utils/reconhecerRosto.js` → `/facepp/v3/search` com `outer_id` (⚠️ nome do parâmetro correto; `faceset_outer_id` estava errado e causava `MISSING_ARGUMENTS`) → devolve o `face_token` mais próximo + `confidence` (0–100).
   - Limiar de confiança atual: **60%** (ajustável em `LIMIAR_CONFIANCA` dentro de `reconhecerRosto.js`).
   - Se reconhecido: grava em `presencas` (`estado: "presente"`, `observacoes: "Marcado via reconhecimento facial"`) e mostra `components/ReconhecimentoOverlay.js` — cartão central com foto do aluno, nome, ✓ verde animado (Animated + spring), e toca `assets/sounds/sucesso.mp3` via `expo-av`. Fecha sozinho ao fim de 2s.
   - Evita duplicados na mesma sessão via `Set` local (`presentesHoje`).
4. **Fallback manual sempre disponível** — `chamada/[turmaId].js` continua a existir e a funcionar independentemente do reconhecimento facial.
5. **Limitações conhecidas**: precisa de internet (chamada à nuvem Face++); pensado para um aluno de cada vez (não sala inteira numa foto de grupo); não funciona no browser/web (CORS); qualidade depende de iluminação/ângulo.

## Utilitários (`utils/`)

| Ficheiro | Função |
|---|---|
| `criarFaceSet.js` | Cria o FaceSet da escola no Face++ (correr uma única vez) |
| `registarRosto.js` | Deteta rosto + adiciona ao FaceSet (usado no registo de aluno) |
| `reconhecerRosto.js` | Pesquisa no FaceSet (`/search`) e devolve o `face_token` + confiança |
| `uploadFoto.js` | Upload da foto (base64) para o Firebase Storage + grava URL em `alunos.foto` |
| `criarNotificacoes.js` | Cria documentos em `notificacoes` (faltas, chamadas de atenção); `notificarReuniao` existe mas não está ligado a nenhum fluxo ativo ainda |
| `exportarExcel.js` | Gera `.xlsx` com `xlsx-js-style`: folha "Resumo" (estilo dashboard, "gráfico" de barras feito de células coloridas + barra de progresso) e folha "Detalhe por Aluno" |

## Componentes reutilizáveis (`components/`)

`AnimatedNumber.js` (contagem animada), `AreaChart.js` e `DonutChart.js` (SVG, `react-native-svg`, sem libs de charts), `ThemeToggle.js`, `ReconhecimentoOverlay.js`. `StatCard.js` existe mas **já não é usado** (versão antiga do dashboard antes do redesign "estilo trading").

## Problemas já enfrentados e resolvidos (evitar repetir)

- **Downgrade/upgrade acidental do SDK do Expo** ao correr `npx expo install` várias vezes seguidas com instalações interrompidas — sempre deixar `npm install`/`npx expo install --fix` terminar por completo antes do próximo comando.
- **`rmdir /s /q` não funciona no PowerShell** — usar `Remove-Item -Recurse -Force node_modules`.
- **CORS ao chamar Face++ na web** — esperado, não é bug; testar sempre em dispositivo físico para tudo o que toca em Face++.
- **`rotation`/`originX`/`originY` no `<Circle>` do `react-native-svg` rebenta na web** — usar `transform: [{ rotate }]` numa `View` a envolver o `<Svg>`, não propriedades nativas de rotação no próprio elemento SVG.
- **`.mjs` não resolvido pelo Metro** (`lucide-react-native`) — adicionar `config.resolver.sourceExts.push("mjs")` no `metro.config.js`.
- **`permission-denied` em queries de lista com regras usando `get()`** — preferir verificar `resource.data.campo` diretamente em vez de `get()` dentro da função de regra, para queries com `where`.

## Para quem for dar continuidade (dev humano ou IA)

Este README foi corrigido com base no histórico real de decisões de desenvolvimento (não apenas planeamento inicial). Ainda assim, antes de assumir qualquer campo ou ficheiro **não confirmado explicitamente** acima (ex: existência de `.npmrc`/`.nvmrc`, estrutura exata de `app/reunioes.js` mais recente), confirmar diretamente no Firestore Console e na árvore de ficheiros do repositório.