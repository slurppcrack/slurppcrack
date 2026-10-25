import {
  Binary,
  Compass,
  Database,
  DoorOpen,
  Flame,
  GraduationCap,
  LayoutGrid,
  Palette,
  PenLine,
  Plug,
  RefreshCw,
  Ruler,
  Scissors,
  Shield,
  ShieldCheck,
  Sparkles,
  Waypoints,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const PERSONA: Record<string, LucideIcon> = {
  surgeon: Scissors,
  architect: Ruler,
  racer: Zap,
  mentor: GraduationCap,
  custom: PenLine,
}

export function PersonaIcon({ id, size = 15 }: { id: string; size?: number }) {
  const Icon = PERSONA[id] ?? Sparkles
  return <Icon size={size} />
}

const PLUGIN: Record<string, LucideIcon> = {
  workflow: Waypoints,
  context: Database,
  safety: ShieldCheck,
  interface: Palette,
  integrations: Plug,
}

export function PluginIcon({ category, size = 14 }: { category: string; size?: number }) {
  const Icon = PLUGIN[category] ?? Binary
  return <Icon size={size} />
}

export const AUTONOMY_ICONS: Record<string, LucideIcon> = {
  ask: Shield,
  auto: RefreshCw,
  yolo: Flame,
}

export function AutonomyIcon({ id, size = 15 }: { id: string; size?: number }) {
  const Icon = AUTONOMY_ICONS[id] ?? Shield
  return <Icon size={size} />
}

export { Compass, DoorOpen, LayoutGrid }
export type { LucideIcon }
