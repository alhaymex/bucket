import { useColorScheme } from "nativewind";

export type Colors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryForeground: string;
  primarySubtle: string;
  accent: string;
  accentForeground: string;
  pinned: string;
  archived: string;
  pending: string;
  dead: string;
  typeYoutube: string;
  typeArticle: string;
  typeProduct: string;
  typeTweet: string;
  typeGithub: string;
  typeGeneric: string;
};

const tokens = {
  light: {
    background: "#ffffff",
    foreground: "#2c2c2a",
    card: "#ffffff",
    cardForeground: "#2c2c2a",
    muted: "#f1efe8",
    mutedForeground: "#5f5e5a",
    border: "#d3d1c7",
    borderStrong: "#b4b2a9",
    primary: "#7f77dd",
    primaryForeground: "#3c3489",
    primarySubtle: "#eeedfe",
    accent: "#1d9e75",
    accentForeground: "#085041",
    pinned: "#1d9e75",
    archived: "#b4b2a9",
    pending: "#fac775",
    dead: "#f09595",
    typeYoutube: "#f5c4b3",
    typeArticle: "#b5d4f4",
    typeProduct: "#c0dd97",
    typeTweet: "#cecbf6",
    typeGithub: "#d3d1c7",
    typeGeneric: "#f4c0d1",
  },
  dark: {
    background: "#1a1918",
    foreground: "#f1efe8",
    card: "#2c2c2a",
    cardForeground: "#f1efe8",
    muted: "#232220",
    mutedForeground: "#b4b2a9",
    border: "#2c2c2a",
    borderStrong: "#444441",
    primary: "#afa9ec",
    primaryForeground: "#ffffff",
    primarySubtle: "#26215c",
    accent: "#5dcaa5",
    accentForeground: "#9fe1cb",
    pinned: "#5dcaa5",
    archived: "#444441",
    pending: "#ef9f27",
    dead: "#e24b4a",
    typeYoutube: "#4a1b0c",
    typeArticle: "#042c53",
    typeProduct: "#173404",
    typeTweet: "#26215c",
    typeGithub: "#2c2c2a",
    typeGeneric: "#4b1528",
  },
} as const satisfies Record<"light" | "dark", Colors>;

export function useColors(): Colors {
  const { colorScheme } = useColorScheme();

  return colorScheme === "dark" ? tokens.dark : tokens.light;
}
