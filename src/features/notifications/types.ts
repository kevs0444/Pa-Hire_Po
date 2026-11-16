import type { ActiveTab } from '@/types/auth';

export type ActivityNotificationKind =
  | 'scan'
  | 'applied'
  | 'saved'
  | 'hidden'
  | 'resume'
  | 'settings'
  | 'release';

export interface ActivityNotification {
  id: string;
  kind: ActivityNotificationKind;
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
  targetTab?: ActiveTab;
  targetJobId?: string;
}
