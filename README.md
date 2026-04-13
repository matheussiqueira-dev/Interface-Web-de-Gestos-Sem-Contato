# Interface Web de Gestos Sem Contato

Interface web fullstack para interação touchless com webcam, reconhecendo gestos de mão em tempo real via **MediaPipe** para controlar um workspace visual com notas adesivas, desenho em canvas e efeitos de partículas.

---

## Visão geral

O sistema transforma uma webcam comum em um dispositivo de entrada gestual para cenários como:

- Quadros colaborativos sem contato físico
- Demonstrações interativas em eventos e kiosks
- Experiências hands-free em ambientes educacionais

### Gestos suportados

| Gesto | Ação |
|-------|------|
| Movimento do indicador | Move o cursor virtual |
| Pinça (polegar + indicador) | Inicia desenho ou arrasta notas |
| Punho fechado | Pausa o tracking |
| Swipe (esquerda/direita/cima/baixo) | Evento customizável via `useKeyboardShortcuts` |

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router), React 18, TypeScript 5 |
| ML / Visão Computacional | MediaPipe Tasks Vision 0.10.8 |
| Animações | Framer Motion 12 |
| Validação | Zod 3 |
| Testes | Vitest + @testing-library/react |
| Estilo | CSS Modules com design system Tron ENCOM |

---

## Arquitetura

```
src/
├── app/                      # Next.js App Router
│   ├── api/v1/               # API REST versionada
│   │   ├── workspace/        # GET / PUT / POST reset
│   │   ├── settings/         # PATCH configurações
│   │   └── events/           # POST telemetria
│   └── page.tsx / layout.tsx
│
├── components/
│   ├── gesture/              # Componentes do workspace gestual
│   │   ├── GestureWorkspace  # Orquestrador principal (useReducer)
│   │   ├── CanvasOverlay     # Superfície de desenho
│   │   ├── NotesBoard        # Notas adesivas
│   │   ├── ParticleSystem    # Efeitos visuais
│   │   └── VideoFeed         # Stream da câmera
│   └── ui/                   # Primitivos: Cursor, StatusPill, Panel
│
├── context/
│   └── GestureContext.tsx    # Provider para evitar prop drilling
│
├── hooks/
│   ├── useHandTracking       # Pipeline MediaPipe (detectForVideo)
│   ├── useGestureEngine      # Suavização + detecção de gestos
│   ├── useGestureCalibration # Calibração adaptativa em tempo real
│   └── useKeyboardShortcuts  # Atalhos de teclado como fallback acessível
│
├── lib/
│   ├── gestureEngine.ts      # Algoritmo principal (smoothing, hysteresis)
│   ├── calibration/          # Motor de calibração por fases
│   ├── workspace/            # reducer, schema, store, api, defaults
│   └── api/rateLimit.ts      # Rate limiter in-memory (sliding window)
│
├── services/
│   ├── camera.service        # getUserMedia + retry automático
│   ├── mediapipe.service     # HandLandmarker (GPU → CPU fallback)
│   └── workspacePersistence  # API primária + localStorage fallback
│
├── types/                    # Interfaces TypeScript
├── utils/
│   ├── geometry              # clamp, lerp, landmarkToScreen
│   ├── gestures              # detectPinch, detectFist, detectSwipe
│   └── exportWorkspace       # Export JSON / CSV
└── __tests__/                # Suíte de testes Vitest
```

### Fluxo de dados

```
Webcam → MediaPipe (GPU/CPU) → HandLandmarks
  → useHandTracking (throttling adaptativo)
  → useGestureEngine (suavização + hysteresis + swipe)
  → GestureWorkspace (useReducer)
  → { CanvasOverlay, NotesBoard, ParticleSystem, Cursor }
  → API v1 / localStorage (persistência híbrida)
```

---

## Instalação

### Pré-requisitos

- Node.js >= 18.18.0
- npm >= 9

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato.git
cd Interface-Web-de-Gestos-Sem-Contato

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local conforme necessário

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | Não | URL base da API (padrão: mesma origem) |
| `NEXT_PUBLIC_API_TOKEN` | Não | Token público para autenticação de leitura |
| `API_TOKEN` | Não | Token servidor para rotas de escrita protegidas |
| `ALLOWED_ORIGINS` | Não | Lista de origens CORS permitidas, separadas por vírgula |

---

## Scripts

```bash
npm run dev          # Servidor de desenvolvimento Next.js
npm run build        # Build de produção
npm run start        # Inicia o servidor em modo produção
npm run lint         # Verificação ESLint (zero warnings)
npm run type-check   # Verificação de tipos TypeScript sem emissão
npm run test         # Executa suíte Vitest
npm run test:ui      # Vitest com interface visual
```

---

## Funcionalidades

### Workspace gestual
- Cursor virtual controlado pelo dedo indicador
- Desenho em canvas por gesto de pinça no espaço livre
- Arrasto de notas adesivas por pinça sobre o painel da nota
- Pausa de tracking por punho fechado

### Notas adesivas
- Criação, edição e remoção gestual
- Cores personalizáveis do design system Tron ENCOM
- Persistência automática com debounce de 800ms

### Undo / Redo
- Histórico de até 30 snapshots de workspace
- `Ctrl+Z` / `Ctrl+Shift+Z` via `useKeyboardShortcuts`
- Histórico limpo ao resetar ou hidratar o workspace

### Calibração adaptativa
- Wizard por fases: mão aberta → pinça → conclusão
- Deriva `pinchSensitivity` e `cursorResponsiveness` a partir do tamanho real da mão
- Disponível via hook `useGestureCalibration`

### Exportação de dados
- Export do workspace completo em JSON
- Export apenas das notas em CSV (com escape correto de aspas)
- Nome de arquivo com data automática via `generateExportFilename()`

### Segurança
- Rate limiting por IP (sliding window) em todas as rotas API
- Cabeçalhos HTTP de segurança: CSP, HSTS, X-Frame-Options, Permissions-Policy
- Schemas Zod com `.strict()` e proteção contra XSS em campos de texto
- Autenticação por API token nos endpoints de escrita

---

## Testes

```bash
npm run test
```

### Cobertura atual

| Módulo | Tipo |
|--------|------|
| `utils/geometry` | Unitário |
| `utils/gestures` | Unitário |
| `utils/exportWorkspace` | Unitário |
| `lib/gestureEngine` | Unitário |
| `lib/workspace/reducer` | Unitário (incluindo undo/redo) |
| `services/workspacePersistence` | Integração (fetch mockado) |

---

## Deploy

O projeto está configurado para deploy no **Vercel** via `vercel.json`.

```bash
# Build de produção
npm run build

# Verificar build localmente
npm run start
```

Para outros provedores, qualquer plataforma com suporte a Node.js 18+ e Next.js funciona (Netlify, Railway, Fly.io, AWS App Runner).

---

## Contribuições

Este projeto é de autoria exclusiva de **Matheus Siqueira**.

---

## Licença

MIT © Matheus Siqueira

---

<p align="center">
  Desenvolvido por <a href="http://www.matheussiqueira.dev/">Matheus Siqueira</a>
</p>
