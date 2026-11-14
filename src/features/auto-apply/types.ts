import { AutoApplyConfig, UserProfile } from '@/types/job';

export type { AutoApplyConfig };

export function createDefaultAutoApplyConfig(
  profile: UserProfile
): AutoApplyConfig {
  return {
    expectedSalary: profile.salaryExpectation || 'PHP 25,000 - 30,000',
    noticePeriod: 'Immediate / 15-30 Days',
    workAuthorization:
      profile.country === 'ph'
        ? 'Authorized to work in the Philippines (Citizen)'
        : `Eligible in ${profile.location}`,
    willingToRelocate: 'Open to Remote / Hybrid / Metro Manila Onsite',
    autoTailorResume: true,
    humanReviewBeforeSubmit: true,
  };
}
