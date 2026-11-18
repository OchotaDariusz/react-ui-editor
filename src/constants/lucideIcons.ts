import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Heart,
  Home,
  Info,
  Mail,
  Plus,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trash2,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface IconLibraryEntry {
  name: string;
  type: string;
  label: string;
  keywords: string;
  component: LucideIcon;
}

export const ICON_LIBRARY: IconLibraryEntry[] = [
  { name: 'Star', type: 'Star', label: 'Gwiazdka', keywords: 'star rating ulubione', component: Star },
  { name: 'Heart', type: 'Heart', label: 'Serce', keywords: 'heart like polubienie', component: Heart },
  { name: 'Sparkles', type: 'Sparkles', label: 'Iskry', keywords: 'sparkles magic nowosc', component: Sparkles },
  { name: 'Zap', type: 'Zap', label: 'Błyskawica', keywords: 'zap speed szybki', component: Zap },
  { name: 'Check', type: 'Check', label: 'Ptak', keywords: 'check ok gotowe', component: Check },
  { name: 'CheckCircle2', type: 'CheckCircle2', label: 'Sukces', keywords: 'check circle verified', component: CheckCircle2 },
  { name: 'AlertCircle', type: 'AlertCircle', label: 'Alert', keywords: 'alert warning blad', component: AlertCircle },
  { name: 'Info', type: 'Info', label: 'Info', keywords: 'info pomoc informacja', component: Info },
  { name: 'Shield', type: 'Shield', label: 'Tarcza', keywords: 'shield security bezpieczenstwo', component: Shield },
  { name: 'Rocket', type: 'Rocket', label: 'Rakieta', keywords: 'rocket launch start', component: Rocket },
  { name: 'Search', type: 'Search', label: 'Szukaj', keywords: 'search lupa', component: Search },
  { name: 'Settings', type: 'Settings', label: 'Ustawienia', keywords: 'settings gear konfiguracja', component: Settings },
  { name: 'User', type: 'User', label: 'Użytkownik', keywords: 'user profile konto', component: User },
  { name: 'Mail', type: 'Mail', label: 'Email', keywords: 'mail poczta wiadomosc', component: Mail },
  { name: 'Bell', type: 'Bell', label: 'Powiadomienie', keywords: 'bell notification dzwonek', component: Bell },
  { name: 'Calendar', type: 'Calendar', label: 'Kalendarz', keywords: 'calendar date termin', component: Calendar },
  { name: 'Clock', type: 'Clock', label: 'Zegar', keywords: 'clock time czas', component: Clock },
  { name: 'ArrowRight', type: 'ArrowRight', label: 'Strzałka', keywords: 'arrow right dalej', component: ArrowRight },
  { name: 'ExternalLink', type: 'ExternalLink', label: 'Link', keywords: 'external link otworz', component: ExternalLink },
  { name: 'Download', type: 'Download', label: 'Pobierz', keywords: 'download zapisz', component: Download },
  { name: 'Plus', type: 'Plus', label: 'Dodaj', keywords: 'plus add nowy', component: Plus },
  { name: 'Trash2', type: 'Trash2', label: 'Usuń', keywords: 'trash delete kosz', component: Trash2 },
  { name: 'Home', type: 'Home', label: 'Start', keywords: 'home dom glowna', component: Home },
  { name: 'Globe', type: 'Globe', label: 'Świat', keywords: 'globe web internet', component: Globe },
];

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_LIBRARY.map((entry) => [entry.name, entry.component])
);

export const getLucideIcon = (iconName?: string): LucideIcon =>
  (iconName && LUCIDE_ICON_MAP[iconName]) || Star;
