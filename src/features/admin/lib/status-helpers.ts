import { ServiceHealthLevel } from '@/features/admin/types';
import { ThemeTokens } from '@/lib/theme';

export function getHealthBadgeStyle(
  level: ServiceHealthLevel,
  tokens: ThemeTokens
): { className: string; prefix: string; label: string } {
  switch (level) {
    case 'operational':
      return {
        className: tokens.badgeSuccess,
        prefix: '✓',
        label: 'Operational',
      };
    case 'degraded':
      return {
        className: tokens.badgeWarning,
        prefix: '!',
        label: 'Degraded',
      };
    case 'maintenance':
      return {
        className: tokens.badgeAccent,
        prefix: '•',
        label: 'Maintenance',
      };
    case 'outage':
      return {
        className: tokens.badgeDanger,
        prefix: '×',
        label: 'Outage',
      };
    default:
      return {
        className: tokens.badgeNeutral,
        prefix: '—',
        label: 'Offline / Unknown',
      };
  }
}

export function formatComponentState(rawStatus: string): {
  prefix: string;
  label: string;
  tone: ServiceHealthLevel;
} {
  const normalized = rawStatus.toLowerCase();
  if (normalized === 'operational') {
    return { prefix: '✓', label: 'Operational', tone: 'operational' };
  }
  if (normalized === 'degraded_performance') {
    return { prefix: '!', label: 'Degraded', tone: 'degraded' };
  }
  if (normalized === 'partial_outage') {
    return { prefix: '!', label: 'Partial Outage', tone: 'degraded' };
  }
  if (normalized === 'major_outage') {
    return { prefix: '×', label: 'Major Outage', tone: 'outage' };
  }
  if (normalized === 'under_maintenance') {
    return { prefix: '•', label: 'Maintenance', tone: 'maintenance' };
  }
  return {
    prefix: '—',
    label: rawStatus.replace(/_/g, ' '),
    tone: 'unknown',
  };
}
