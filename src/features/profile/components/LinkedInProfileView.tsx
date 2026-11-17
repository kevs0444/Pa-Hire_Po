'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Award,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  Edit3,
  FileText,
  FolderGit2,
  GraduationCap,
  ImagePlus,
  KeyRound,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { compressImageFileToDataUrl } from '@/features/profile/lib/image-upload';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  ExperienceLevel,
  MonochromeTheme,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProjectItem,
  StructuredResume,
  UserProfile,
  WorkType,
} from '@/types/job';
import { resumeToPlainText } from '@/lib/default-profile';
import {
  ResumeUploadDialog,
  type ResumeUploadConfirmOptions,
} from '@/features/resume/components/ResumeUploadDialog';
import {
  buildSmartProfilePatchFromResume,
  type ParsedResumePayload,
} from '@/features/resume/lib/resume-parser';
import { getThemeTokens } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface LinkedInProfileViewProps {
  users: UserProfile[];
  profile: UserProfile;
  theme: MonochromeTheme;
  geminiApiKey: string;
  personalApiConfigured?: boolean;
  onSelectUser: (userId: string) => void;
  onCreateUser: (payload: {
    name: string;
    email?: string;
    primaryRole: string;
    preferredRoles?: string[];
    location?: string;
  }) => void;
  onUpdateGeminiKey: (key: string) => void;
  onUpdateProfile: (next: UserProfile) => void;
  onOpenA4Studio: () => void;
  onImportResume?: (
    parsed: ParsedResumePayload,
    options: ResumeUploadConfirmOptions
  ) => Promise<void> | void;
}

export function LinkedInProfileView({
  users,
  profile,
  theme,
  geminiApiKey,
  personalApiConfigured = false,
  onSelectUser,
  onCreateUser,
  onUpdateGeminiKey,
  onUpdateProfile,
  onOpenA4Studio,
  onImportResume,
}: LinkedInProfileViewProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const tokens = getThemeTokens(theme);
  const isDark = tokens.isDark;
  const resume = profile.structuredResume;

  const [showNewUser, setShowNewUser] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingJourney, setEditingJourney] = useState(false);
  const [showKeyOverride, setShowKeyOverride] = useState(false);

  const [addingExp, setAddingExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState({
    role: '',
    company: '',
    location: '',
    period: '',
    bulletsText: '',
  });

  const [addingProj, setAddingProj] = useState(false);
  const [projForm, setProjForm] = useState({
    name: '',
    subtitle: '',
    period: '',
    bulletsText: '',
  });

  const [newCert, setNewCert] = useState('');
  const [addingEdu, setAddingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree: '',
    school: '',
    period: '',
    honors: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [newRoleOption, setNewRoleOption] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    primaryRole: '',
    extras: '',
    location: 'Metro Manila, Philippines',
  });

  const cardClass = tokens.cardSurface;
  const subBoxClass = tokens.subSurface;
  const inputClass = tokens.inputSurface;
  const primaryBtn = tokens.primaryBtn;
  const secondaryBtn = tokens.secondaryBtn;
  const mutedText = tokens.mutedText;
  const borderSubtle = tokens.borderSubtle;

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

  const syncResume = (nextResume: StructuredResume, extra?: Partial<UserProfile>) => {
    onUpdateProfile({
      ...profile,
      ...extra,
      structuredResume: nextResume,
      resumeText: resumeToPlainText(nextResume),
    });
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.role.trim() || !expForm.company.trim()) return;
    const bullets = expForm.bulletsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const item: ResumeExperienceItem = {
      id: editingExpId || `exp-${Date.now()}`,
      role: expForm.role.trim(),
      company: expForm.company.trim(),
      location: expForm.location.trim(),
      period: expForm.period.trim() || 'Present',
      bullets: bullets.length > 0 ? bullets : [`Contributed as ${expForm.role.trim()}.`],
    };

    const nextExp = editingExpId
      ? resume.experience.map((x) => (x.id === editingExpId ? item : x))
      : [item, ...resume.experience];

    syncResume({ ...resume, experience: nextExp });
    setAddingExp(false);
    setEditingExpId(null);
    setExpForm({ role: '', company: '', location: '', period: '', bulletsText: '' });
  };

  const handleDeleteExp = (id: string) => {
    syncResume({
      ...resume,
      experience: resume.experience.filter((x) => x.id !== id),
    });
  };

  const handleSaveProj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.name.trim()) return;
    const bullets = projForm.bulletsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const item: ResumeProjectItem = {
      id: `proj-${Date.now()}`,
      name: projForm.name.trim(),
      subtitle: projForm.subtitle.trim(),
      period: projForm.period.trim(),
      bullets: bullets.length > 0 ? bullets : ['Built and deployed solution.'],
    };

    syncResume({ ...resume, projects: [item, ...resume.projects] });
    setAddingProj(false);
    setProjForm({ name: '', subtitle: '', period: '', bulletsText: '' });
  };

  const handleAddCert = () => {
    const clean = newCert.trim();
    if (!clean) return;
    syncResume({
      ...resume,
      certifications: [...resume.certifications, clean],
    });
    setNewCert('');
  };

  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.degree.trim() || !eduForm.school.trim()) return;
    const item: ResumeEducationItem = {
      degree: eduForm.degree.trim(),
      school: eduForm.school.trim(),
      period: eduForm.period.trim(),
      honors: eduForm.honors.trim(),
    };
    syncResume({ ...resume, education: [item, ...resume.education] });
    setAddingEdu(false);
    setEduForm({ degree: '', school: '', period: '', honors: '' });
  };

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    const nextSkills = profile.skills.some(
      (s) => s.toLowerCase() === clean.toLowerCase()
    )
      ? profile.skills
      : [...profile.skills, clean];

    const cats = [...resume.skillCategories];
    if (cats.length > 0) {
      const first = cats[0];
      const existingList = first.items.split(',').map((s) => s.trim()).filter(Boolean);
      if (!existingList.some((x) => x.toLowerCase() === clean.toLowerCase())) {
        cats[0] = { ...first, items: `${first.items}, ${clean}` };
      }
    } else {
      cats.push({ category: 'Core Skills', items: clean });
    }

    syncResume({ ...resume, skillCategories: cats }, { skills: nextSkills });
    setNewSkill('');
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'avatar' | 'cover'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(
        file,
        kind === 'avatar'
          ? {
              maxWidth: 320,
              maxHeight: 320,
              quality: 0.84,
              cropMode: 'cover',
              backgroundColor: '#ffffff',
            }
          : {
              maxWidth: 1200,
              maxHeight: 360,
              quality: 0.84,
              cropMode: 'cover',
              backgroundColor: '#1e293b',
            }
      );
      onUpdateProfile({
        ...profile,
        ...(kind === 'avatar' ? { avatarUrl: dataUrl } : { coverUrl: dataUrl }),
      });
      setUploadStatus(
        kind === 'avatar'
          ? 'Updated LinkedIn profile photo (compressed for instant cloud sync).'
          : 'Updated LinkedIn cover banner photo.'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to process the selected image.';
      setUploadStatus(message);
    } finally {
      e.target.value = '';
    }
  };

  const handleResetPhotos = () => {
    onUpdateProfile({
      ...profile,
      avatarUrl: null,
      coverUrl: null,
    });
    setUploadStatus('Reset profile and cover photos to default Civic theme.');
  };

  return (
    <div className="no-print mx-auto max-w-5xl space-y-4">
      {/* Profile Switcher Bar */}
      <div className={cn('rounded-lg border p-3.5 flex flex-wrap items-center justify-between gap-3', cardClass)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-xs font-medium', mutedText)}>
            Profiles:
          </span>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelectUser(u.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                u.id === profile.id ? primaryBtn : secondaryBtn
              )}
            >
              {u.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewUser((v) => !v)}
            className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {showNewUser ? 'Cancel' : 'Add Profile'}
          </button>

          <button
            type="button"
            onClick={onOpenA4Studio}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs', primaryBtn)}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Open Resume Studio</span>
            <span className="rounded border border-white/30 bg-white/15 px-1 py-0.5 font-mono text-[9px] font-semibold uppercase leading-none">
              AI
            </span>
          </button>
        </div>
      </div>

      {showNewUser && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newUserForm.name.trim() || !newUserForm.primaryRole.trim()) return;
            const extras = newUserForm.extras
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            onCreateUser({
              name: newUserForm.name.trim(),
              email: newUserForm.email.trim() || undefined,
              primaryRole: newUserForm.primaryRole.trim(),
              preferredRoles: Array.from(new Set([newUserForm.primaryRole.trim(), ...extras])),
              location: newUserForm.location.trim(),
            });
            setNewUserForm({
              name: '',
              email: '',
              primaryRole: '',
              extras: '',
              location: 'Metro Manila, Philippines',
            });
            setShowNewUser(false);
          }}
          className={cn('grid gap-3 rounded-lg border p-4 sm:grid-cols-2', cardClass)}
        >
          <input
            type="text"
            required
            placeholder="Full Name *"
            value={newUserForm.name}
            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
            className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <input
            type="text"
            required
            placeholder="Target Job Title * (e.g. Data Analyst / Junior Data Analyst)"
            value={newUserForm.primaryRole}
            onChange={(e) => setNewUserForm({ ...newUserForm, primaryRole: e.target.value })}
            className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <input
            type="text"
            placeholder="Location"
            value={newUserForm.location}
            onChange={(e) => setNewUserForm({ ...newUserForm, location: e.target.value })}
            className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <input
            type="text"
            placeholder="Additional role options (comma separated)"
            value={newUserForm.extras}
            onChange={(e) => setNewUserForm({ ...newUserForm, extras: e.target.value })}
            className={cn('sm:col-span-2 rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <button type="submit" className={cn('sm:col-span-2 rounded-lg py-2 text-xs', primaryBtn)}>
            Create Profile &amp; Switch
          </button>
        </form>
      )}

      {/* LINKEDIN HERO PROFILE CARD */}
      <section className={cn('overflow-hidden rounded-lg border', cardClass)}>
        <div
          className={cn(
            'relative h-32 sm:h-36 w-full overflow-hidden border-b',
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-slate-200 bg-[#1e293b]'
          )}
        >
          {profile.coverUrl && (
            <>
              <Image
                src={profile.coverUrl}
                alt={`${profile.name} cover banner`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-slate-950/20" />
            </>
          )}

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
            <label
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/25 bg-slate-950/65 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-slate-950/85"
              title="Upload LinkedIn-style cover banner (1200×360 recommended)"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>{profile.coverUrl ? 'Change Cover' : 'Add Cover Photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleProfileImageUpload(e, 'cover')}
                className="hidden"
              />
            </label>

            <span className="rounded border border-white/20 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-100">
              Synced 2-way with Resume Studio (AI)
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 text-xl font-bold',
                  isDark
                    ? 'border-[#111827] bg-[#2563eb] text-white'
                    : 'border-white bg-[#0a66c2] text-white'
                )}
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <label
                className={cn(
                  'absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition-colors',
                  secondaryBtn
                )}
                title="Upload LinkedIn profile photo"
                aria-label="Upload LinkedIn profile photo"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleProfileImageUpload(e, 'avatar')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingHeader((v) => !v)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', secondaryBtn)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {editingHeader ? 'Close Editor' : 'Edit Profile Info'}
              </button>
              <label className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', secondaryBtn)}>
                <Camera className="h-3.5 w-3.5" />
                Profile Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleProfileImageUpload(e, 'avatar')}
                  className="hidden"
                />
              </label>
              <label className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', secondaryBtn)}>
                <ImagePlus className="h-3.5 w-3.5" />
                Cover Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleProfileImageUpload(e, 'cover')}
                  className="hidden"
                />
              </label>
              {(profile.avatarUrl || profile.coverUrl) && (
                <button
                  type="button"
                  onClick={handleResetPhotos}
                  className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', secondaryBtn)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Photos
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsUploadDialogOpen(true)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors', secondaryBtn)}
              >
                <Upload className="h-3.5 w-3.5" />
                Import PDF / Word
              </button>
            </div>
          </div>

          {uploadStatus && (
            <p className={cn('mt-3 rounded-lg border px-3 py-1.5 text-xs', borderSubtle)}>
              {uploadStatus}
            </p>
          )}

          {editingHeader ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  syncResume(
                    { ...resume, fullName: e.target.value.toUpperCase() },
                    { name: e.target.value }
                  )
                }
                placeholder="Full Name"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                value={resume.targetHeadline}
                onChange={(e) => syncResume({ ...resume, targetHeadline: e.target.value })}
                placeholder="LinkedIn / Resume Headline"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                value={resume.email}
                onChange={(e) => syncResume({ ...resume, email: e.target.value })}
                placeholder="Email"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                value={resume.location}
                onChange={(e) =>
                  syncResume(
                    { ...resume, location: e.target.value },
                    { location: e.target.value }
                  )
                }
                placeholder="Location"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                value={resume.portfolio}
                onChange={(e) => syncResume({ ...resume, portfolio: e.target.value })}
                placeholder="Portfolio URL"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                value={profile.salaryExpectation}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, salaryExpectation: e.target.value })
                }
                placeholder="Salary Expectation"
                className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
              />
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-sm font-medium">{resume.targetHeadline}</p>
              <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs', mutedText)}>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {resume.location}
                </span>
                <span>{resume.email}</span>
                {resume.portfolio && (
                  <a
                    href={resume.portfolio.startsWith('http') ? resume.portfolio : `https://${resume.portfolio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    {resume.portfolio}
                  </a>
                )}
                {profile.salaryExpectation && <span>Target: {profile.salaryExpectation}</span>}
              </div>
            </div>
          )}

          {/* Open to Work / Role Options Box */}
          <div className={cn('mt-5 rounded-lg border p-4 space-y-3', subBoxClass)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold">
                  Open to Work — Target Job Titles
                </h3>
                <p className={cn('text-xs', mutedText)}>
                  Select your primary target role to calibrate match scoring.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={profile.experienceLevel}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      experienceLevel: e.target.value as ExperienceLevel,
                    })
                  }
                  className={cn('rounded-lg border px-2.5 py-1 text-xs focus:outline-none', inputClass)}
                >
                  <option value="entry">Fresh Grad / Entry Level</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior / Lead</option>
                  <option value="any">Any Experience</option>
                </select>

                <select
                  value={profile.workType}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      workType: e.target.value as WorkType,
                    })
                  }
                  className={cn('rounded-lg border px-2.5 py-1 text-xs focus:outline-none', inputClass)}
                >
                  <option value="any">Any Work Setup</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>

                <select
                  value={profile.country}
                  onChange={(e) => {
                    const c = e.target.value as CountryCode;
                    onUpdateProfile({
                      ...profile,
                      country: c,
                      location: COUNTRY_CONFIGS[c].defaultLocation,
                    });
                  }}
                  className={cn('rounded-lg border px-2.5 py-1 text-xs focus:outline-none', inputClass)}
                >
                  {Object.values(COUNTRY_CONFIGS).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.preferredRoles.map((role) => {
                const isPrimary =
                  role.toLowerCase() === profile.primaryRole.toLowerCase();
                return (
                  <span
                    key={role}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                      isPrimary ? primaryBtn : secondaryBtn
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({
                          ...profile,
                          primaryRole: role,
                          title: role,
                        })
                      }
                    >
                      {role}
                      {isPrimary ? ' ★' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProfile({
                          ...profile,
                          preferredRoles: profile.preferredRoles.filter(
                            (r) => r !== role
                          ),
                        })
                      }
                      className="opacity-75 hover:opacity-100"
                      aria-label={`Remove ${role}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newRoleOption}
                onChange={(e) => setNewRoleOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!newRoleOption.trim()) return;
                    onUpdateProfile({
                      ...profile,
                      preferredRoles: Array.from(
                        new Set([...profile.preferredRoles, newRoleOption.trim()])
                      ),
                    });
                    setNewRoleOption('');
                  }
                }}
                placeholder="Add another desired job title..."
                className={cn('flex-1 min-w-[200px] rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newRoleOption.trim()) return;
                  onUpdateProfile({
                    ...profile,
                    preferredRoles: Array.from(
                      new Set([...profile.preferredRoles, newRoleOption.trim()])
                    ),
                  });
                  setNewRoleOption('');
                }}
                className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Role
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCE SECTION */}
      <section className={cn('rounded-lg border p-5 sm:p-6 space-y-4', cardClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <h3 className="text-base font-semibold">Experience</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddingExp((v) => !v);
              setEditingExpId(null);
              setExpForm({
                role: '',
                company: '',
                location: '',
                period: '',
                bulletsText: '',
              });
            }}
            className={cn('inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Experience
          </button>
        </div>

        {(addingExp || editingExpId) && (
          <form
            onSubmit={handleSaveExp}
            className={cn('grid gap-2.5 rounded-lg border p-4 sm:grid-cols-2', subBoxClass)}
          >
            <input
              type="text"
              required
              placeholder="Job Title *"
              value={expForm.role}
              onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <input
              type="text"
              required
              placeholder="Company *"
              value={expForm.company}
              onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <input
              type="text"
              placeholder="Location (e.g. BGC, Taguig City)"
              value={expForm.location}
              onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <input
              type="text"
              placeholder="Period (e.g. July 2026 - Present)"
              value={expForm.period}
              onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <textarea
              rows={4}
              placeholder="Bullet achievements (1 per line, wrap keywords in **bold**)"
              value={expForm.bulletsText}
              onChange={(e) => setExpForm({ ...expForm, bulletsText: e.target.value })}
              className={cn('sm:col-span-2 rounded-lg border p-3 text-xs focus:outline-none', inputClass)}
            />
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setAddingExp(false);
                  setEditingExpId(null);
                }}
                className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
              >
                Cancel
              </button>
              <button type="submit" className={cn('rounded-lg px-4 py-1.5 text-xs', primaryBtn)}>
                Save Experience
              </button>
            </div>
          </form>
        )}

        <div className={cn('divide-y', borderSubtle)}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">{exp.role}</h4>
                  <p className={cn('text-xs', mutedText)}>
                    {exp.company} {exp.location ? `• ${exp.location}` : ''} • {exp.period}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpId(exp.id);
                      setAddingExp(false);
                      setExpForm({
                        role: exp.role,
                        company: exp.company,
                        location: exp.location,
                        period: exp.period,
                        bulletsText: exp.bullets.join('\n'),
                      });
                    }}
                    className={cn('rounded-lg border p-1.5', secondaryBtn)}
                    title="Edit experience"
                    aria-label={`Edit ${exp.role}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExp(exp.id)}
                    className={cn('rounded-lg border p-1.5', secondaryBtn)}
                    title="Delete experience"
                    aria-label={`Delete ${exp.role}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <ul className={cn('list-disc space-y-1 pl-4 text-xs leading-relaxed', mutedText)}>
                {exp.bullets.map((b, i) => (
                  <li key={i}>{b.replace(/\*\*/g, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section className={cn('rounded-lg border p-5 sm:p-6 space-y-4', cardClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            <h3 className="text-base font-semibold">Projects</h3>
          </div>
          <button
            type="button"
            onClick={() => setAddingProj((v) => !v)}
            className={cn('inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </button>
        </div>

        {addingProj && (
          <form
            onSubmit={handleSaveProj}
            className={cn('grid gap-2.5 rounded-lg border p-4 sm:grid-cols-2', subBoxClass)}
          >
            <input
              type="text"
              required
              placeholder="Project Title *"
              value={projForm.name}
              onChange={(e) => setProjForm({ ...projForm, name: e.target.value })}
              className={cn('sm:col-span-2 rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <input
              type="text"
              placeholder="Role / Context (e.g. Lead AI Developer)"
              value={projForm.subtitle}
              onChange={(e) => setProjForm({ ...projForm, subtitle: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <input
              type="text"
              placeholder="Period (e.g. Oct 2026)"
              value={projForm.period}
              onChange={(e) => setProjForm({ ...projForm, period: e.target.value })}
              className={cn('rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
            />
            <textarea
              rows={3}
              placeholder="Key deliverables (1 bullet per line)"
              value={projForm.bulletsText}
              onChange={(e) => setProjForm({ ...projForm, bulletsText: e.target.value })}
              className={cn('sm:col-span-2 rounded-lg border p-3 text-xs focus:outline-none', inputClass)}
            />
            <button type="submit" className={cn('sm:col-span-2 rounded-lg py-2 text-xs', primaryBtn)}>
              Add Project to Resume Studio
            </button>
          </form>
        )}

        <div className={cn('divide-y', borderSubtle)}>
          {resume.projects.map((proj) => (
            <div key={proj.id} className="space-y-1.5 py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">{proj.name}</h4>
                  <p className={cn('text-xs', mutedText)}>
                    {proj.subtitle} {proj.period ? `• ${proj.period}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    syncResume({
                      ...resume,
                      projects: resume.projects.filter((p) => p.id !== proj.id),
                    })
                  }
                  className={cn('rounded-lg border p-1.5', secondaryBtn)}
                  aria-label={`Delete ${proj.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <ul className={cn('list-disc space-y-1 pl-4 text-xs leading-relaxed', mutedText)}>
                {proj.bullets.map((b, i) => (
                  <li key={i}>{b.replace(/\*\*/g, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* LICENSES & CERTIFICATIONS + EDUCATION (2-COL GRID) */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className={cn('rounded-lg border p-5 space-y-4', cardClass)}>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <h3 className="text-base font-semibold">Licenses &amp; Certifications</h3>
          </div>

          <div className={cn('divide-y', borderSubtle)}>
            {resume.certifications.map((cert, idx) => (
              <div
                key={`${cert}-${idx}`}
                className="flex items-center justify-between gap-2 py-2.5 text-xs first:pt-0 last:pb-0"
              >
                <span className="font-medium">{cert}</span>
                <button
                  type="button"
                  onClick={() =>
                    syncResume({
                      ...resume,
                      certifications: resume.certifications.filter((_, i) => i !== idx),
                    })
                  }
                  className={cn('rounded p-1 transition-colors', mutedText)}
                  aria-label={`Remove ${cert}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCert();
                }
              }}
              placeholder="New certificate (e.g. Google Data Analytics)"
              className={cn('flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
            />
            <button
              type="button"
              onClick={handleAddCert}
              className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs', primaryBtn)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </section>

        <section className={cn('rounded-lg border p-5 space-y-4', cardClass)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <h3 className="text-base font-semibold">Education</h3>
            </div>
            <button
              type="button"
              onClick={() => setAddingEdu((v) => !v)}
              className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium', secondaryBtn)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          {addingEdu && (
            <form onSubmit={handleSaveEdu} className={cn('space-y-2 rounded-lg border p-3', subBoxClass)}>
              <input
                type="text"
                required
                placeholder="Degree / Program *"
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
              />
              <input
                type="text"
                required
                placeholder="School / University *"
                value={eduForm.school}
                onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                className={cn('w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Period"
                  value={eduForm.period}
                  onChange={(e) => setEduForm({ ...eduForm, period: e.target.value })}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
                />
                <input
                  type="text"
                  placeholder="GWA / Honors"
                  value={eduForm.honors}
                  onChange={(e) => setEduForm({ ...eduForm, honors: e.target.value })}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
                />
              </div>
              <button type="submit" className={cn('w-full rounded-lg py-1.5 text-xs', primaryBtn)}>
                Save Education
              </button>
            </form>
          )}

          <div className={cn('divide-y', borderSubtle)}>
            {resume.education.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 py-3 text-xs first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{edu.degree}</span>
                  <button
                    type="button"
                    onClick={() =>
                      syncResume({
                        ...resume,
                        education: resume.education.filter((_, i) => i !== idx),
                      })
                    }
                    className={cn('rounded p-1 transition-colors', mutedText)}
                    aria-label={`Remove ${edu.degree}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className={mutedText}>
                  {edu.school} • {edu.period}
                </p>
                {edu.honors && <p className="font-medium">{edu.honors}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* SKILLS + GEMINI AI KEY */}
      <section className={cn('rounded-lg border p-5 sm:p-6 space-y-4', cardClass)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">
            Skills &amp; Personal AI Tailoring
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {personalApiConfigured && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium',
                  isDark
                    ? 'border-emerald-700/70 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
              >
                <Check className="h-3.5 w-3.5" />
                Personal Gemini AI Connected (.env)
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowKeyOverride((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium',
                secondaryBtn
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              {showKeyOverride ? 'Hide Key' : geminiApiKey ? 'Custom Key Active' : 'Override Key'}
            </button>
          </div>
        </div>

        {(showKeyOverride || !personalApiConfigured) && (
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound className={cn('h-3.5 w-3.5', mutedText)} />
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiKey(e.target.value)}
              placeholder={
                personalApiConfigured
                  ? 'Optional browser Gemini API Key override — leave blank to use personal .env key'
                  : 'Optional Gemini API Key — leave blank to use built-in Smart Tailor'
              }
              className={cn('flex-1 rounded-lg border px-3 py-1.5 text-xs focus:outline-none', inputClass)}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className={cn('inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium', secondaryBtn)}
            >
              {skill}
              <button
                type="button"
                onClick={() =>
                  onUpdateProfile({
                    ...profile,
                    skills: profile.skills.filter((s) => s !== skill),
                  })
                }
                className="opacity-75 hover:opacity-100"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Add new skill (syncs with resume & job matcher)..."
            className={cn('flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none', inputClass)}
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className={cn('inline-flex items-center gap-1 rounded-lg px-4 py-2 text-xs', primaryBtn)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Skill
          </button>
        </div>
      </section>

      {/* ABOUT / CAREER JOURNEY VAULT */}
      <section className={cn('rounded-lg border p-5 sm:p-6 space-y-3', cardClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <h3 className="text-base font-semibold">About &amp; Career Journey Vault</h3>
          </div>
          <button
            type="button"
            onClick={() => setEditingJourney((v) => !v)}
            className={cn('inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium', secondaryBtn)}
          >
            {editingJourney ? (
              <>
                <Check className="h-3.5 w-3.5" /> Done
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" /> Edit Journey
              </>
            )}
          </button>
        </div>

        {editingJourney ? (
          <textarea
            rows={14}
            value={profile.careerJourneyMarkdown}
            onChange={(e) =>
              onUpdateProfile({
                ...profile,
                careerJourneyMarkdown: e.target.value,
              })
            }
            className={cn('w-full rounded-lg border p-4 font-mono text-xs leading-relaxed focus:outline-none', inputClass)}
          />
        ) : (
          <div className={cn('max-h-72 overflow-y-auto rounded-lg border p-4 text-xs leading-relaxed whitespace-pre-line', subBoxClass)}>
            {profile.careerJourneyMarkdown || profile.summary}
          </div>
        )}
      </section>

      <ResumeUploadDialog
        isOpen={isUploadDialogOpen}
        theme={theme}
        primaryRole={profile.primaryRole}
        geminiApiKey={geminiApiKey}
        onClose={() => setIsUploadDialogOpen(false)}
        onConfirmImport={async (parsed, options) => {
          if (onImportResume) {
            await onImportResume(parsed, options);
          } else {
            const patched = buildSmartProfilePatchFromResume(profile, parsed, {
              syncSmartProfile: options.syncSmartProfile,
            });
            onUpdateProfile(patched);
          }
          setUploadStatus(
            `Imported "${parsed.fileName || 'resume'}" and synced to Smart Profile & Resume Studio.`
          );
        }}
      />
    </div>
  );
}
