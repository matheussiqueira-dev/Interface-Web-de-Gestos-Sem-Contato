# ✨ Touchless Web Gesture Interface

![Touchless Interface Banner](https://img.shields.io/badge/Status-Premium_Refactor-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0078D7?style=for-the-badge&logo=google&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

## 📖 Visão Geral

O **Touchless Web Gesture Interface** é uma aplicação de ponta que redefine a interação homem-máquina. Utilizando visão computacional avançada através do **MediaPipe**, esta interface permite o controle total de elementos digitais sem a necessidade de contato físico, transformando qualquer webcam padrão em um sensor de movimento de alta precisão.

Esta versão passou por um refactoring completo focado em **performance senior**, **UI/UX premium** e uma arquitetura robusta e escalável.

---

## 🚀 Funcionalidades Principais

### 🖐️ Rastreamento de Mão em Ultra Performance
- Detecção em tempo real com baixa latência utilizando **MediaPipe Tasks Vision**.
- Suavização adaptativa para eliminar jitter e garantir precisão cirúrgica.

### 🎭 Reconhecimento de Gestos Inteligente
- **Gesto de Pinça (Pinch)**: Seleção natural, arraste de elementos e desenho fluido.
- **Detecção de Punho (Fist)**: Comando universal para pausa e segurança de estado.
- **Mapeamento Dinâmico**: Calibração automática baseada na distância da palma para estabilidade em qualquer ambiente.

### 🍱 Interface de Usuário (UI) Senior
- **Layout "Control Center"**: Design moderno com hierarquia visual clara e foco no conteúdo.
- **Glassmorphism 2.0**: Efeitos de desfoque e transparência refinados com bordas submilimétricas.
- **Micro-interações Premium**: Feedback visual imediato através de um sistema de partículas e animações via **Framer Motion**.

### 🎨 Quadro Interativo 3.0
- **Notas Adesivas Inteligentes**: Gerenciamento de elementos via gestos com física suave.
- **Canvas com Brilho Neon**: Desenho livre com efeitos de rastro e glow dinâmico.
- **Sistema de Partículas**: Feedback imersivo que acompanha o movimento do usuário.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 18](https://reactjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Visão Computacional**: [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Iconografia**: [Lucide React](https://lucide.dev/)
- **Estilização**: CSS Moderno (Custom Properties & Glassmorphism)

---

## 📦 Estrutura do Projeto

```text
src/
├── components/
│   ├── ui/               # Componentes atômicos (Button, Status, Cursor)
│   ├── CanvasOverlay     # Camada de desenho e cursor
│   ├── NotesBoard        # Quadro de notas interativas
│   ├── ParticleSystem    # Efeitos visuais de feedback
│   └── VideoFeed         # Gerenciamento de stream de vídeo
├── hooks/
│   ├── useHandTracking   # Bridge com MediaPipe
│   ├── useGestureEngine  # Lógica de interpretação de gestos
│   └── useViewportSize   # Responsividade dinâmica
├── utils/
│   ├── geometry          # Cálculos matemáticos e clamp
│   └── gestures          # heurísticas de detecção
├── App.tsx               # Orquestração principal
└── index.css             # Design System e tokens
```

---

## 🔧 Instalação e Uso

1. **Clonar o Repositório**
   ```bash
   git clone https://github.com/matheussiqueirahub/touchless-web-gesture-interface.git
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Executar em Desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acessar a Aplicação**
   Abra `http://localhost:5173` e permita o acesso à câmera.

---

## 💡 Guia de Uso

- **Mover**: O cursor seguirá seu dedo indicador.
- **Selecionar/Desenhar**: Junte o polegar e o indicador (gesto de pinça).
- **Soltar**: Afaste os dedos.
- **Pausar**: Feche o punho.

---

## 🛣️ Futuras Melhorias

- [ ] Support para gestos multi-manuais.
- [ ] Integração com APIs de apresentação (Google Slides/PowerPoint).
- [ ] Calibração personalizada de sensibilidade via UI.
- [ ] Modo de alta performance para dispositivos móveis.

---

### Autoria
**Matheus Siqueira**  
Website: [matheussiqueira.dev](https://www.matheussiqueira.dev/)  
LinkedIn: [linkedin.com/in/matheussiqueira](https://www.linkedin.com/in/matheussiqueira/)

---
*Este projeto foi desenvolvido com foco em excelência técnica e usabilidade futurista.*
