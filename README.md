# Interface Web de Gestos Sem Contato

Quadro de notas e desenho controlado pela mão via webcam, com reconhecimento no navegador; também funciona com mouse ou toque.

[![Demo ao vivo](https://img.shields.io/badge/Demo-ao_vivo-00f2fe?style=for-the-badge&logo=vercel&logoColor=000000)](https://interface-web-de-gestos-sem-contato.vercel.app)
[![Case no portfólio](https://img.shields.io/badge/Case-Portf%C3%B3lio-000000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.matheussiqueira.dev/pt-BR/projects/touchless-web-gesture-interface)
[![Código](https://img.shields.io/badge/C%C3%B3digo-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato)

## O que faz

O indicador move um cursor virtual. A pinça (polegar e indicador juntos) arrasta a nota que estiver sob o cursor ou, no espaço livre, desenha. Com o punho fechado, o desenho fica pausado.

O quadro aceita três entradas, escolhidas na tela inicial:

| Entrada | Para quem | Como funciona |
|---|---|---|
| Câmera | Quiosque, bancada, quem não pode tocar no equipamento | MediaPipe Hand Landmarker roda no navegador, a 30 quadros por segundo |
| Mouse ou toque | Quem não tem webcam ou está no celular | Pressionar equivale à pinça; arrasta notas e desenha do mesmo jeito |
| Demonstração automática | Quem quer ver o reconhecimento sem ligar a câmera | Uma mão simulada gera os 21 pontos que o MediaPipe geraria e passa pelo mesmo motor de gestos |

Toda ação feita com a mão também tem caminho por teclado: cada nota tem um botão de mover (setas, com Shift para passos maiores), um campo de texto e um botão de excluir.

## Privacidade e carga

- O vídeo é processado no navegador e não sai do computador.
- O motor WASM (9,6 MB) e o modelo de mãos (7,8 MB) só são baixados depois que a câmera entrega o primeiro quadro. Quem usa mouse, toque ou a demonstração não baixa nada disso.
- As notas ficam no `localStorage` deste navegador. Nada é enviado a um servidor.

## O cursor de pinça

O cursor mostra um anel que fecha conforme a distância entre polegar e indicador se aproxima do limiar de pinça e fica ciano quando a pinça é reconhecida. O limiar de soltura é maior que o de início (histerese), então o anel continua fechado um pouco mais quando os dedos abrem. É isso que explica, sem texto, por que um gesto foi ou não reconhecido. O limiar se ajusta ao tamanho da mão na imagem e à "Sensibilidade da pinça", em Ajustes.

## Arquitetura

```
Câmera ──▶ useHandTracking (MediaPipe, carga tardia) ─┐
Demonstração ──▶ useSimulatedHand (mão simulada) ─────┼─▶ useGestureEngine ─┐
                                                      │  (suavização,       │
Mouse ou toque ──▶ usePointerGesture ─────────────────┼──── histerese) ────┼─▶ GestureState
                                                      │                     │
                                                      └─────────────────────┘
GestureState ──▶ useNoteDrag (pinça sobre nota = arrastar) ──▶ workspaceReducer ──▶ localStorage
             └─▶ DrawingCanvas (pinça no espaço livre = desenhar)
             └─▶ PinchCursor (anel de limiar)
```

Todas as entradas produzem o mesmo `GestureState`, então o quadro não sabe de onde veio o gesto.

```
src/
├── app/                    # App Router: layout, página, ícone, rotas /api
├── components/
│   ├── app/                # Tela inicial e escolha da entrada
│   ├── gesture/            # Quadro, notas, canvas, cursor, câmera, painéis
│   ├── layout/             # Header, footer e boundary de erro
│   └── ui/                 # Diálogo de confirmação
├── hooks/                  # Entradas (câmera, ponteiro, mão simulada), arraste, métricas
├── lib/
│   ├── gestureEngine.ts    # Suavização adaptativa, limiar de pinça com histerese
│   ├── demo/               # Mão simulada e roteiro da demonstração
│   ├── workspace/          # Reducer com desfazer, schema zod, layout das notas
│   └── api/                # Rate limit das rotas
├── services/               # Câmera, MediaPipe, persistência local
└── styles/app.css          # Estilos sobre o design system ms-tokens
```

### Decisões técnicas

- **Uma entrada, um formato.** Câmera, ponteiro e demonstração convergem em `GestureState`. A demonstração não imita o resultado: alimenta o motor real com landmarks simulados, e um teste roda o roteiro inteiro pelo motor e confere que a pinça começa dentro da nota.
- **Desfazer por gesto, não por quadro.** Arrastar uma nota grava uma entrada de histórico no início do arraste; os movimentos seguintes não enchem o histórico.
- **Dados guardados são entrada não confiável.** O que vem do `localStorage` passa pelo schema zod; se uma nota estiver danificada, só ela é descartada e o resto do quadro é recuperado. O texto das notas é saneado na digitação para nunca gerar dados que o schema recuse.
- **Versões presas.** O WASM do MediaPipe é carregado na mesma versão do pacote JavaScript instalado; um teste falha se as duas divergirem.

## API v1

As rotas em `/api/v1` são uma superfície de integração para clientes de servidor, como um painel que administra quiosques. O navegador não as usa.

| Rota | Método | Escrita |
|---|---|---|
| `/api/health` | GET | não |
| `/api/v1/workspace` | GET, PUT | PUT exige token |
| `/api/v1/workspace/reset` | POST | exige token |
| `/api/v1/settings` | PATCH | exige token |
| `/api/v1/events` | POST | exige token |

A escrita fecha por padrão: sem `API_TOKEN` configurado no servidor, as rotas de escrita respondem 503. Com o token, a requisição precisa do cabeçalho `x-api-token`. O estado da API vive em memória da instância e não é persistido; trate-o como demonstração da superfície, não como armazenamento.

## Segurança

- CSP sem `unsafe-eval` em produção; o WASM usa `wasm-unsafe-eval`. `Permissions-Policy: camera=(self)`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, HSTS, `nosniff`, sem `X-Powered-By`.
- Escrita na API fechada por padrão, comparação de token em tempo constante, rate limit por IP.
- Schemas zod estritos em toda entrada da API e nos dados locais.

## Qualidade

| Verificação | Comando | Estado |
|---|---|---|
| Lint | `npm run lint` | 0 erros, 0 avisos |
| Tipos | `npm run type-check` | TypeScript estrito, sem erros |
| Testes | `npm test` | 231 testes em 26 arquivos |
| Cobertura | `npm run test:coverage` | 97,1% de linhas e 91% de branches em `lib`, `hooks`, `services` e `utils`; mínimo exigido de 80% |
| Build | `npm run build` | Next.js 16 |

## Executar localmente

Requisitos: Node.js 22.12 ou mais recente (exigido pelo Vitest 5) e npm.

```bash
git clone https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato.git
cd Interface-Web-de-Gestos-Sem-Contato
npm ci
npm run dev
```

Abra `http://localhost:3000`. A câmera só funciona em `localhost` ou HTTPS.

Se o caminho da pasta tiver acentos (por exemplo, `Programação`), o build com Turbopack falha ao carregar as fontes; use `npm run build:webpack`. O deploy na Vercel não é afetado.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `API_TOKEN` | Não | Libera a escrita nas rotas `/api/v1`. Só no servidor; nunca com prefixo `NEXT_PUBLIC_`. |

## Limitações

- Uma mão por vez. Luz fraca e contraluz reduzem a detecção.
- O desenho não é salvo: some ao limpar ou fechar a página.
- O estado da API é por instância e se perde em cada deploy.

## Licença

MIT © Matheus Henrique Dias Siqueira

---

### Desenvolvido por Matheus Siqueira

**Analista de Dados & BI | Power BI • SQL • Python • DAX | ETL, Modelagem de Dados, KPIs e Automação**

Conecte-se e acesse meus projetos:

[![Portfólio](https://img.shields.io/badge/Portf%C3%B3lio-matheussiqueira.dev-000000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.matheussiqueira.dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Matheus_Siqueira-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/matheussiqueira-dev)
[![GitHub](https://img.shields.io/badge/GitHub-matheussiqueira--dev-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/matheussiqueira-dev)
[![E-mail](https://img.shields.io/badge/E--mail-hellomatheusdev%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hellomatheusdev@gmail.com)
