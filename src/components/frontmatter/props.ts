import type { UserProfile } from '../../types';

/** Props shared by every front-matter section component. */
export interface FrontMatterSectionProps {
  user: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
  onToast?: (msg: string) => void;
}

/** Props for the FrontMatterView shell. */
export interface FrontMatterViewProps extends FrontMatterSectionProps {
  /** Optional: where the Operating Manual's nav buttons go. Rendered only when provided. */
  onNavigateToGoals?: () => void;
  onNavigateToDaily?: () => void;
}
