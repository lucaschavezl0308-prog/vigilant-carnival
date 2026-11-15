import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Identidad del canal: cambia aquí el nombre y los colores y se aplica a los 10 vídeos.
export const CHANNEL = {
  name: 'MODO LEONIDA',
  tagline: 'GTA 6 sin rodeos',
  disclaimer: 'Canal no oficial · Sin afiliación con Rockstar Games ni Take-Two',
};

export const C = {
  night: '#0A0A1F',
  deep: '#160D38',
  violet: '#3B1670',
  magenta: '#FF2D8A',
  orange: '#FF8A1F',
  yellow: '#FFD23F',
  cyan: '#22E4D4',
  white: '#F7F4FF',
  muted: '#B3ACD6',
  panel: 'rgba(14, 10, 38, 0.78)',
  panelBorder: 'rgba(255, 255, 255, 0.10)',
  danger: '#FF5A5A',
};

export const GRADIENT = `linear-gradient(90deg, ${C.yellow} 0%, ${C.orange} 45%, ${C.magenta} 100%)`;
export const GRADIENT_V = `linear-gradient(180deg, ${C.yellow} 0%, ${C.orange} 50%, ${C.magenta} 100%)`;

export const F = {
  display: 'Anton',
  body: 'Inter',
  mono: 'JetBrains Mono',
};

const fonts = [
  {family: F.display, file: 'anton-latin-400-normal.woff2', weight: '400'},
  {family: F.body, file: 'inter-latin-400-normal.woff2', weight: '400'},
  {family: F.body, file: 'inter-latin-600-normal.woff2', weight: '600'},
  {family: F.body, file: 'inter-latin-800-normal.woff2', weight: '800'},
  {family: F.body, file: 'inter-latin-900-normal.woff2', weight: '900'},
  {family: F.mono, file: 'jetbrains-mono-latin-700-normal.woff2', weight: '700'},
];

export const fontsReady = Promise.all(
  fonts.map((f) => loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight})),
);

// Texto con degradado (para cifras y titulares)
export const gradientText = (g = GRADIENT): React.CSSProperties => ({
  backgroundImage: g,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});
