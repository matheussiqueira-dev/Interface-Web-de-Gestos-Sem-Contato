import packageJson from "../../package.json";

export const SITE = {
  productName: "Interface Web de Gestos Sem Contato",
  shortName: "Gestos sem contato",
  url: "https://interface-web-de-gestos-sem-contato.vercel.app",
  description:
    "Quadro de notas e desenho controlado pela mão via webcam. Reconhecimento no navegador com MediaPipe e Next.js; também funciona com mouse ou toque.",
  repository: "https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato",
  portfolioCase: "https://www.matheussiqueira.dev/pt-BR/projects/touchless-web-gesture-interface",
  version: packageJson.version,
  author: {
    name: "Matheus Siqueira",
    url: "https://www.matheussiqueira.dev",
    linkedin: "https://www.linkedin.com/in/matheussiqueira-dev",
    github: "https://github.com/matheussiqueira-dev",
  },
} as const;

/** First 7 characters of the deployed commit, when Vercel provides it at build time. */
export function shortCommit(): string | null {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return sha ? sha.slice(0, 7) : null;
}
