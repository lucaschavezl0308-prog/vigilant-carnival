import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  AlertTriangle, Ban, BatteryCharging, Bell, Box, Building2, Calendar, Camera, Car, Check, CircleX, Clock,
  Cloud, Cpu, Crown, Disc3, Download, Euro, EyeOff, FileText, Flame, Gamepad2, Gift, Globe, HardDrive, Hourglass,
  Info, Key, Lock, MapPin, Quote, MessageCircle, Mic, Monitor, Mountain, Music, Package, Palmtree, RefreshCw, RotateCcw,
  Server, ShieldAlert, Ship, SlidersHorizontal, Smartphone, Sparkles, Star, Store, Sun, Ticket, TreePine,
  TrendingUp, Tv, Users, VolumeX, Waves, Wifi, Wrench, X, Zap,
} from 'lucide-react';
import {C, F, GRADIENT, gradientText} from '../brand';
import {EASE_OUT, clamp, enter, pop} from '../anim';

const ICONS: Record<string, React.FC<{size?: number; color?: string; strokeWidth?: number}>> = {
  'alert': AlertTriangle, ban: Ban, battery: BatteryCharging, bell: Bell, box: Box, building: Building2,
  calendar: Calendar, camera: Camera, car: Car, check: Check, 'circle-x': CircleX, clock: Clock, cloud: Cloud,
  cpu: Cpu, crown: Crown, disc: Disc3, download: Download, euro: Euro, 'eye-off': EyeOff, file: FileText,
  flame: Flame, gamepad: Gamepad2, gift: Gift, globe: Globe, 'hard-drive': HardDrive, hourglass: Hourglass,
  info: Info, quote: Quote, key: Key, lock: Lock, pin: MapPin, chat: MessageCircle, mic: Mic, monitor: Monitor,
  mountain: Mountain, music: Music, package: Package, palm: Palmtree, refresh: RefreshCw, restore: RotateCcw,
  server: Server, shield: ShieldAlert, ship: Ship, sliders: SlidersHorizontal, phone: Smartphone,
  sparkles: Sparkles, star: Star, store: Store, sun: Sun, ticket: Ticket, tree: TreePine, trend: TrendingUp,
  tv: Tv, users: Users, mute: VolumeX, waves: Waves, wifi: Wifi, wrench: Wrench, x: X, zap: Zap,
};

export const Icon: React.FC<{name?: string; size?: number; color?: string; stroke?: number}> = ({
  name = 'star', size = 48, color = C.white, stroke = 2.4,
}) => {
  const Cmp = ICONS[name] ?? Star;
  return <Cmp size={size} color={color} strokeWidth={stroke} />;
};

/** Ficha de icono en círculo con degradado. */
export const IconChip: React.FC<{name?: string; size?: number; color?: string}> = ({name, size = 84, color}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: color ?? GRADIENT,
      boxShadow: `0 0 30px ${C.magenta}55`,
    }}
  >
    <Icon name={name} size={size * 0.5} color={C.night} stroke={2.8} />
  </div>
);

export const Panel: React.FC<{style?: React.CSSProperties; children: React.ReactNode; accent?: string}> = ({
  style, children, accent,
}) => (
  <div
    style={{
      background: C.panel,
      border: `2px solid ${accent ?? C.panelBorder}`,
      borderRadius: 32,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Titular de escena: aparece con un deslizamiento y subrayado en degradado. */
export const Heading: React.FC<{text: string; size?: number; align?: 'left' | 'center'; delay?: number}> = ({
  text, size = 96, align = 'left', delay = 0,
}) => {
  const frame = useCurrentFrame();
  const p = enter(frame, delay, 20);
  return (
    <div style={{textAlign: align, marginBottom: 36}}>
      <div
        style={{
          fontFamily: F.display,
          fontSize: size,
          lineHeight: 1.02,
          color: C.white,
          textTransform: 'uppercase',
          letterSpacing: 1,
          opacity: p,
          translate: `${interpolate(p, [0, 1], [-40, 0])}px 0px`,
          textShadow: '0 6px 30px rgba(0,0,0,0.5)',
        }}
      >
        {text}
      </div>
      <div
        style={{
          height: 8,
          width: interpolate(enter(frame, delay + 6, 24), [0, 1], [0, 260]),
          background: GRADIENT,
          borderRadius: 4,
          marginTop: 14,
          marginLeft: align === 'center' ? 'auto' : 0,
          marginRight: align === 'center' ? 'auto' : 0,
        }}
      />
    </div>
  );
};

/** Opacidad/posición de un elemento que aparece en `at` (frames de escena). */
export const useReveal = (at: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = pop(frame, fps, at, 16);
  const o = interpolate(frame, [at, at + 8], [0, 1], {...clamp, easing: EASE_OUT});
  return {p, o, visible: frame >= at};
};

export const Big: React.FC<{children: React.ReactNode; size: number; style?: React.CSSProperties}> = ({
  children, size, style,
}) => (
  <div style={{fontFamily: F.display, fontSize: size, lineHeight: 1, ...gradientText(), ...style}}>{children}</div>
);
