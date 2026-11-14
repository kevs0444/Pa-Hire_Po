'use client';

import { useState } from 'react';
import {
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  UserCircle2,
  X,
} from 'lucide-react';
import {
  COUNTRY_CONFIGS,
  CountryCode,
  DynamicRoleSuggestion,
  ExperienceLevel,
  UserProfile,
  WorkType,
} from '@/types/job';

interface ProfilePanelProps {
  isOpen: boolean;
  profile: UserProfile;
  suggestedRoles: DynamicRoleSuggestion[];
  onClose: () => void;
  onUpdateProfile: (next: UserProfile) => void;
  onApplyParsedResume: (
    nextProfile: UserProfile,
    roles: DynamicRoleSuggestion[]
  ) => void;
}

export function ProfilePanel({
  isOpen,
  profile,
  suggestedRoles,
  onClose,
  onUpdateProfile,
  onApplyParsedResume,
}: ProfilePanelProps) {
  const [newSkill, setNewSkill] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    if (!profile.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      onUpdateProfile({
        ...profile,
        skills: [...profile.skills, clean],
      });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onUpdateProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleAnalyzeText = async () => {
    setAnalyzing(true);
    setParseError(null);
    setParseMessage(null);

    try {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: profile.resumeText,
          fileName: profile.resumeFileName,
          primaryRole: profile.primaryRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || 'Could not analyze resume text.');
        return;
      }

      const mergedSkills = Array.from(
        new Set([...(data.skills || []), ...profile.skills])
      );

      onApplyParsedResume(
        {
          ...profile,
          summary: data.summary || profile.summary,
          skills: mergedSkills,
        },
        data.suggestedRoles || []
      );
      setParseMessage(
        `Extracted ${data.skills?.length || 0} skills and updated dynamic role suggestions.`
      );
    } catch {
      setParseError('Failed to reach resume analyzer.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setParseError(null);
    setParseMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('primaryRole', profile.primaryRole);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || 'Could not read uploaded file.');
        return;
      }

      const nextSkills =
        Array.isArray(data.skills) && data.skills.length > 0
          ? data.skills
          : profile.skills;

      onApplyParsedResume(
        {
          ...profile,
          resumeText: data.resumeText || profile.resumeText,
          resumeFileName: data.fileName || file.name,
          summary: data.summary || profile.summary,
          skills: nextSkills,
        },
        data.suggestedRoles || []
      );

      setParseMessage(
        data.warning ||
          `Loaded "${file.name}" (${nextSkills.length} skills detected).`
      );
    } catch {
      setParseError('Upload failed. Try pasting your resume text directly.');
    } finally {
      setAnalyzing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold">
                Your Resume, Skills & Search Brain
              </h2>
              <p className="text-xs text-slate-400">
                Everything runs dynamically from this profile—change any field anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Basic Identity & Region */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Your Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Primary Target Role (Dynamic)
              </label>
              <input
                type="text"
                value={profile.primaryRole}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    primaryRole: e.target.value,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Data Analyst, Product Analyst, Full Stack Dev"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                JobStreet / Indeed Country
              </label>
              <select
                value={profile.country}
                onChange={(e) => {
                  const nextCountry = e.target.value as CountryCode;
                  onUpdateProfile({
                    ...profile,
                    country: nextCountry,
                    location: COUNTRY_CONFIGS[nextCountry].defaultLocation,
                  });
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(COUNTRY_CONFIGS).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                City / Location Filter
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, location: e.target.value })
                }
                placeholder="Manila, Philippines"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Work Setup Preference
              </label>
              <select
                value={profile.workType}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    workType: e.target.value as WorkType,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="any">Any (Remote / Hybrid / On-site)</option>
                <option value="remote">Remote only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Experience Level
              </label>
              <select
                value={profile.experienceLevel}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    experienceLevel: e.target.value as ExperienceLevel,
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="any">Any Level</option>
                <option value="entry">Entry / Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior / Lead</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Auto-Pilot Scan Interval
              </label>
              <select
                value={profile.autoScanIntervalMinutes}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    autoScanIntervalMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 60 minutes</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Dynamic Pivot Mix
              </label>
              <select
                value={profile.pivotFrequency}
                onChange={(e) =>
                  onUpdateProfile({
                    ...profile,
                    pivotFrequency: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value={20}>Light (1 adjacent pivot role)</option>
                <option value={25}>Balanced (1 rotating pivot role)</option>
                <option value={40}>Exploratory (2 rotating pivot roles)</option>
              </select>
            </div>
          </section>

          {/* Skills Section */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Extracted & Active Skills ({profile.skills.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Used to score LinkedIn, JobStreet & Indeed listings
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="rounded hover:text-white"
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
                placeholder="Add skill (e.g. dbt, Looker, React, Figma)..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </section>

          {/* Resume Upload + Text Editor */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Resume / CV Source
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {profile.resumeFileName
                      ? `Active file: ${profile.resumeFileName}`
                      : 'Paste your resume or upload .txt / .md / .pdf'}
                  </p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500">
                <Upload className="h-3.5 w-3.5" />
                Upload CV (.txt, .md, .pdf)
                <input
                  type="file"
                  accept=".txt,.md,.json,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={9}
              value={profile.resumeText}
              onChange={(e) =>
                onUpdateProfile({ ...profile, resumeText: e.target.value })
              }
              placeholder="Paste your full resume here (experience, tools, projects, education)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200 focus:border-emerald-500 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyzeText}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Analyze Resume & Auto-Detect Skills/Roles
              </button>

              {suggestedRoles.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Top inferred match:{' '}
                  <strong className="text-emerald-300">
                    {suggestedRoles[0].role} ({suggestedRoles[0].overlapPercent}%)
                  </strong>
                </span>
              )}
            </div>

            {parseMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {parseMessage}
              </p>
            )}
            {parseError && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {parseError}
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
          <span className="text-xs text-slate-400">
            Saved automatically to browser & local disk
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
