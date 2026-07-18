# Controlo de Presença e Faltas

App de controlo de presença e faltas de alunos, com reconhecimento facial, construído com React Native (Expo) e Firebase.

## Stack

- **React Native + Expo** (SDK 54) — frontend mobile, testado via Expo Go
- **Firebase Auth** — autenticação (email/password)
- **Firebase Firestore** — base de dados
- **Firebase Storage** — fotos de perfil dos alunos
- **Face++ (Face++.com API)** — reconhecimento facial (FaceSet + comparação de rosto)
- **expo-camera** — captura de fotos (registo de rosto + chamada automática)
- **expo-av** — som de confirmação no reconhecimento
- **NativeWind (Tailwind para RN)** — estilização
- **Expo Router** — navegação por ficheiros

> ⚠️ Reconhecimento facial (Face++) **não funciona no browser/web** — bloqueio de CORS. Só funciona em dispositivo físico via Expo Go (ou build nativa).

## Requisitos

- **Node.js** (ver versão exata em `.nvmrc`)
- **npm**
- **Expo Go** instalado no telemóvel — para testar
- **Git**

## Como rodar o projeto do zero

```powershell
git clone <url-do-repositorio>
cd controlo-presenca-faltas
npm ci
npx expo start -c
```

Depois de `npx expo start -c`, escaneie o QR code com o **Expo Go** (Android) ou **Câmera** (iOS), no mesmo Wi-Fi do computador.

> ⚠️ **Use sempre `npm ci`** (não `npm install`) num PC novo. Instala exatamente as versões travadas no `package-lock.json`.

## Variáveis / configs sensíveis

- `firebaseConfig.js` (raiz) — credenciais do projeto Firebase (Auth, Firestore, Storage)
- `faceppConfig.js` (raiz) — `FACEPP_API_KEY` e `FACEPP_API_SECRET`

*(Confirmar: estes ficheiros devem estar no `.gitignore` se contiverem chaves reais — verificar antes de tornar o repositório público.)*

## Perfis de utilizador (roles)

Guardados no documento Firestore `users/{uid}`, campo `role`. Três valores possíveis:

- `admin`
- `professor`
- `encarregado`

**Como uma conta é criada:**
1. Qualquer pessoa cria conta pelo ecrã "Criar Conta" da app → fica automaticamente com `role: "encarregado"`.
2. Para tornar alguém `professor` ou `admin`, o Admin vai a **Gerir Utilizadores**, encontra a conta pelo email, e muda o `role` — ligando ao registo correspondente em `professores` (campo `professor_id`) quando aplicável.
3. Não existe (ainda) criação de conta pelo Admin com password definida por ele — a pessoa tem sempre de passar primeiro pelo ecrã de registo.

**Dashboard difere por role:**
- `admin` / `professor`: dashboard geral da escola (KPIs, gráfico agregado, donut de assiduidade geral, acesso a Turmas/Alunos).
- `encarregado`: vê só o(s) seu(s) educando(s) — cartão por aluno com donut de assiduidade individual, faltas do mês, última chamada de atenção, notificações. Não tem acesso a "Turmas e Alunos".

## Modelo de dados (Firestore)

Coleções confirmadas pelo histórico de desenvolvimento:

| Coleção | Campos observados |
|---|---|
| `alunos` | `nome`, `numero_processo`, `turma_id` (?), foto de perfil (Storage), face registada no Face++ |
| `professores` | `nome`, `email`, `telefone`, `disciplinas`, `criado_em` |
| `turmas` | *(estrutura não detalhada nas conversas — confirmar campos)* |
| `encarregados` | *(estrutura não detalhada — confirmar campos e ligação a `alunos`)* |
| `presencas` | `aluno_id`, `estado` (presente/falta/atraso), `data` |
| `chamadas_atencao` | `aluno_id`, `motivo`, `gravidade` (leve/media/grave), `descricao`, `registado_por`, `data`, `criado_em`, `encarregado_notificado` |
| `reunioes` | *(estrutura não detalhada — agendamento via modal)* |
| `notificacoes` | *(estrutura não detalhada — usada no cartão de notificações do dashboard)* |
| `users` | `role`, ligação a `professor_id` / `aluno_id` (encarregado) |

> Nota: algumas destas estruturas não foram confirmadas em detalhe nas conversas anteriores — **quem for mexer no código deve verificar diretamente no Firestore Console** antes de assumir os nomes exatos dos campos.

## Rotas principais (Expo Router, pasta `app/`)

- Login / Criar Conta
- `app/dashboard.js` — dashboard (varia por role)
- Turmas → Alunos da turma
- `app/aluno/[id].js` — histórico do aluno (presenças + chamadas de atenção, com filtros)
- Chamada diária (registo manual de presença)
- `app/chamada-atencao/[alunoId].js` — nova chamada de atenção
- `app/chamadas-atencao.js` — vista geral de chamadas de atenção (filtro por gravidade)
- Reuniões
- `app/admin/utilizadores.js` — gestão de utilizadores/roles
- Gestão de professores (nome de ficheiro exato a confirmar)
- Chamada automática (reconhecimento facial)

*(Nomes de ficheiros não mencionados diretamente nas conversas foram descritos pela função, não pelo path exato — confirmar contra a pasta `app/` real.)*

## Reconhecimento facial (fluxo)

1. **Registo de rosto do aluno**: foto capturada via `expo-camera` → enviada ao Face++ (associada a um FaceSet) → mesma foto reaproveitada como foto de perfil (upload para Firebase Storage).
2. **Chamada automática**: um aluno de cada vez aponta o rosto à câmara → foto enviada ao Face++ → comparação com o FaceSet → se houver correspondência com confiança suficiente, presença marcada automaticamente em `presencas`.
3. **Feedback ao utilizador**: cartão central com foto + nome do aluno, check verde animado, som de sucesso (`assets/sounds/sucesso.mp3`, via `expo-av`).
4. **Fallback**: marcação manual sempre disponível (o reconhecimento falha ocasionalmente — iluminação, ângulo, corte de cabelo diferente, etc.).
5. **Limitações conhecidas**: precisa de internet (chamada à nuvem); funciona bem um aluno de cada vez, não uma sala inteira numa foto de grupo; não funciona no browser/web (CORS) — só em dispositivo físico.

## `.npmrc`

Conflitos conhecidos de *peer dependencies* entre `react-native-reanimated`, `nativewind` e `expo-router`. O repositório inclui `.npmrc` na raiz:

```
legacy-peer-deps=true
```

Isto faz `npm install`/`npm ci` resolverem sempre em modo legado, sem precisar da flag manual. **Não apagar este ficheiro.**

## Problemas comuns e soluções

### `ERESOLVE could not resolve` ao instalar pacotes novos
```powershell
npm install <pacote> --legacy-peer-deps
npx expo install --fix
```

### `Project is incompatible with this version of Expo Go`
O Expo Go do telemóvel está desatualizado em relação ao SDK do projeto (atualmente **SDK 54**). Atualizar pela loja de apps.

### `Cannot find module 'X'` ao iniciar o Metro
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```
(o `.npmrc` já garante `legacy-peer-deps` automaticamente)

### Erros do PowerShell ao remover `node_modules` (caminhos longos no Windows)
```powershell
npm install -g rimraf
rimraf node_modules
```

### `FirebaseError: permission-denied` num listener do Firestore
Normalmente transitório (o app tenta ler antes do estado de autenticação carregar). Se for consistente, verificar `firestore.rules` e confirmar que o `role` do utilizador em `users/{uid}` está correto.

### Erro 401 (Unauthorized) ao chamar o Face++
Verificar `FACEPP_API_KEY` / `FACEPP_API_SECRET` em `faceppConfig.js` — sem espaços a mais, chave ativa no painel Face++.

### Bloqueio de CORS ao chamar o Face++
Esperado ao testar na web — o Face++ só funciona dentro do Expo Go/app nativa, nunca no browser.

## Estrutura relevante

- `app/` — rotas e telas (Expo Router)
- `context/AuthContext.js` — estado de autenticação e role do utilizador
- `firebaseConfig.js` — credenciais Firebase
- `faceppConfig.js` — credenciais Face++
- `assets/sounds/` — som de confirmação do reconhecimento
- `firestore.rules` — regras de segurança do Firestore
- `.npmrc` — config de instalação (não remover)
- `.nvmrc` — versão do Node

## Versões principais

| Pacote | Versão |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| react-native-reanimated | ~4.1.1 |
| expo-router | ~6.0.24 |
| nativewind | ^4.2.6 |

## Para quem for dar continuidade (dev humano ou IA)

Antes de assumir qualquer estrutura de dados ou nome de ficheiro não listado com caminho exato acima, **confirmar diretamente no código e no Firestore Console** — este README foi reconstruído a partir do histórico de decisões do projeto, não de uma leitura linha a linha de todos os ficheiros atuais.