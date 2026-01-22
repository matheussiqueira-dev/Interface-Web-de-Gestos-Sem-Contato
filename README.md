# Touchless Web Gesture Interface

## Visão Geral

Touchless Web Gesture Interface é uma aplicação web que permite aos usuários interagir com elementos digitais utilizando gestos manuais capturados através de uma webcam padrão. Aproveitando a tecnologia de visão computacional, especificamente o MediaPipe Hands, a aplicação rastreia pontos de referência da mão em tempo real para controlar um cursor virtual, realizar ações de clique, arrastar elementos e desenhar em uma tela virtual sem qualquer contato físico com dispositivos de entrada.

## Funcionalidades

- **Rastreamento de Mão em Tempo Real**: Utiliza o MediaPipe para detecção de mãos e rastreamento de pontos de referência de alta performance diretamente no navegador.
- **Cursor Virtual**: Mapeia a posição do dedo indicador do usuário para um cursor na tela com suavização para precisão.
- **Reconhecimento de Gestos**:
    - **Interação de Pinça**: Detecta o movimento de pinça entre o polegar e o dedo indicador para simular cliques e operações de arrastar.
    - **Detecção de Punho**: Identifica o gesto de punho fechado, utilizado para mudanças de estado ou alternância de ferramentas.
- **Quadro Interativo**:
    - **Notas Adesivas**: Usuários podem pegar e mover notas adesivas virtuais usando o gesto de pinça.
    - **Tela de Desenho**: Capacidades de desenho livre ativadas por gestos.
- **Painel de Status**: Exibe câmera, carregamento do modelo e detecção de mão em tempo real.
- **Controles Avançados**: Limpeza do quadro sem recarregar e pausa do rastreamento.
- **Arquitetura Moderna**: Construído com React, TypeScript e Vite para performance e manutenibilidade.

## Stack Tecnológico

- **Framework Frontend**: React 18
- **Linguagem**: TypeScript
- **Ferramenta de Build**: Vite
- **Visão Computacional**: Google MediaPipe Tasks Vision
- **Estilização**: CSS Modules / Variáveis CSS Customizadas (Sistema de design Glassmorphism)

## Pré-requisitos

- Node.js (Versão 16 ou superior recomendada)
- Gerenciador de pacotes NPM/TPM
- Um computador com uma webcam funcional

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/matheussiqueirahub/touchless-web-gesture-interface.git
   ```

2. Navegue até o diretório do projeto:
   ```bash
   cd touchless-web-gesture-interface
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

## Uso

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra seu navegador e navegue para a URL local fornecida (geralmente `http://localhost:5173`).

3. Conceda permissões de câmera quando solicitado pelo navegador.

4. **Guia de Interação**:
    - **Mover Cursor**: Mova sua mão na frente da câmera. O cursor segue seu dedo indicador.
    - **Clicar / Arrastar**: Faça o movimento de pinça (junte polegar e indicador).
    - **Desenhar**: Faça o movimento de pinça e mova a mão em uma área vazia.
    - **Parar de Desenhar**: Abra a mão (solte a pinça) ou feche o punho para parar a ação.

## Estrutura do Projeto

```
src/
├── components/         # Componentes React (VideoFeed, CanvasOverlay, NotesBoard)
├── context/           # Gerenciamento de estado global
├── hooks/             # Hooks customizados (useHandTracking, useGestureEngine)
├── utils/             # Funções auxiliares (geometria, lógica de gestos)
├── App.tsx            # Componente principal da aplicação
└── main.tsx           # Ponto de entrada
```

## Contribuição

1. Faça um Fork do projeto.
2. Crie sua branch de funcionalidade (`git checkout -b feature/FuncionalidadeIncrivel`).
3. Comite suas mudanças (`git commit -m 'Adiciona alguma FuncionalidadeIncrivel'`).
4. Dê um Push para a branch (`git push origin feature/FuncionalidadeIncrivel`).
5. Abra um Pull Request.

## Licença

Este projeto é distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.
