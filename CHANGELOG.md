# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/).

## [2.2.0] - 2026-10-15

### Adicionado
- Entrada por mouse ou toque: pressionar equivale à pinça, com o mesmo arraste de notas e desenho.
- Demonstração automática com mão simulada que passa pelo motor de gestos real.
- Cursor de pinça com anel que fecha conforme os dedos chegam ao limiar, com histerese visível.
- Miniatura da câmera com a mão detectada desenhada por cima.
- Botão de mover em cada nota, com setas do teclado; botão Desfazer; confirmação antes de restaurar o quadro.
- Estados de câmera bloqueada, sem câmera, em uso e modelo carregando, com saída para mouse ou toque.

### Alterado
- Visual migrado para o design system ms-tokens v1.0, com IBM Plex Sans, header e rodapé padrão, ícone SC e metadados de SEO.
- Notas salvas só no navegador, validadas pelo schema e recuperadas nota a nota quando algo estiver danificado.
- Câmera pedida em 640×360; o MediaPipe só é baixado depois que a câmera entrega imagem.
- Limite de cobertura de testes elevado para 80%.

### Corrigido
- `Permissions-Policy` com sintaxe inválida (`camera=self` → `camera=(self)`); CSP de produção sem `unsafe-eval`.
- WASM do MediaPipe carregado em versão diferente do pacote JavaScript.
- Escrita na API liberada quando `API_TOKEN` não estava definido; token de API exposto ao navegador via `NEXT_PUBLIC_API_TOKEN`.
- Arrastar uma nota gravava uma entrada de desfazer por quadro de vídeo.
- Layout sobreposto no celular.

### Removido
- Tema ENCOM/Tron, efeito de partículas e a dependência `framer-motion`.

## [2.1.0] - 2026-10-11

### Alterado
- Next.js 16 e Vitest 5; ESLint 9 com configuração flat.
