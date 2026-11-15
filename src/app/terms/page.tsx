import type { Metadata } from 'next';
import { LegalPageShell } from '@/features/legal/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Terms of Service — Pa-Hire Po',
  description:
    'Terms of Service and Conditions of Use for Pa-Hire Po multi-board job explorer and Resume Studio (AI).',
};

const navItems = [
  { id: 'acceptance', label: '1. Acceptance & Eligibility' },
  { id: 'nature-of-service', label: '2. Nature of Platform' },
  { id: 'third-party-aggregation', label: '3. Third-Party Portals' },
  { id: 'ai-responsibility', label: '4. AI Assistance & Accuracy' },
  { id: 'accounts-security', label: '5. Accounts & Conduct' },
  { id: 'intellectual-property', label: '6. Intellectual Property' },
  { id: 'limitation-liability', label: '7. Limitation of Liability' },
  { id: 'governing-law', label: '8. Governing Law & Contact' },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="The terms, rules, and conditions governing your access to and use of Pa-Hire Po, Resume Studio (AI), and our job discovery features."
      effectiveDate="November 15, 2026"
      currentPath="/terms"
      navItems={navItems}
    >
      {/* 1. Acceptance & Eligibility */}
      <section id="acceptance" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          1. Acceptance of Terms &amp; Eligibility
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;) and <strong>Pa-Hire Po</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the Platform&rdquo;), accessible at{' '}
            <a
              href="https://pa-hire-po.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a66c2] hover:underline font-medium"
            >
              https://pa-hire-po.vercel.app
            </a>
            .
          </p>
          <p>
            By creating an account, signing in via Google OAuth or other authentication providers, or using any part of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use or access the Platform.
          </p>
          <p>
            You represent and warrant that you are at least 18 years of age (or the legal age of majority in your jurisdiction) and possess the legal capacity to enter into this agreement.
          </p>
        </div>
      </section>

      {/* 2. Nature of Platform */}
      <section id="nature-of-service" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          2. Nature of the Platform &amp; Service Scope
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            Pa-Hire Po is a productivity and career utility tool designed to assist individual job seekers in exploring job postings across multiple career boards, tracking their personal application pipeline, and formatting professional resumes.
          </p>
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-zinc-100">
              Important Clarification:
            </p>
            <p>
              Pa-Hire Po is <strong>NOT</strong> an employer, employment agency, recruiting firm, or labor intermediary. We do not evaluate job candidates on behalf of hiring organizations, conduct hiring interviews, make employment offers, or guarantee that any user will receive job interviews or job offers.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Third-Party Portals & Disclaimer */}
      <section id="third-party-aggregation" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-xs font-mono font-semibold text-amber-900 dark:text-amber-200">
            External Portals
          </span>
          <span className="text-xs text-slate-500 font-mono">Independent Utility</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          3. Third-Party Job Aggregation &amp; Trademark Disclaimers
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            The Platform indexes and displays publicly available job openings originating from third-party career portals, including but not limited to <strong>LinkedIn</strong>, <strong>JobStreet</strong>, and <strong>Indeed</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>No Affiliation or Endorsement:</strong> Pa-Hire Po is an independent project and is <strong>not affiliated with, associated with, sponsored by, or endorsed by</strong> LinkedIn Corporation, SEEK Limited / JobStreet, Indeed, Inc., or any other hiring portal.
            </li>
            <li>
              <strong>Trademarks:</strong> All product and company names, brand logos, and registered trademarks displayed within job listings belong exclusively to their respective owners. Their display on Pa-Hire Po is for nominative identification and informational reference purposes only.
            </li>
            <li>
              <strong>External Application Links:</strong> When you click &ldquo;Apply&rdquo; on an external job card, you will be redirected to the original employer or job board website. We have no control over the content, terms, privacy practices, or hiring procedures of those external websites.
            </li>
          </ul>
        </div>
      </section>

      {/* 4. AI Assistance & Accuracy */}
      <section id="ai-responsibility" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
            Resume Studio (AI)
          </span>
          <span className="text-xs text-slate-500 font-mono">User Accountability</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          4. AI-Powered Resume Tailoring &amp; User Truthfulness
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            Pa-Hire Po includes <strong>Resume Studio</strong>, an AI-powered drafting feature utilizing Google Gemini API (<code className="font-mono text-xs bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">gemini-3.1-flash-lite</code>) to assist in structuring resume bullet points and aligning candidate skills with job descriptions.
          </p>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
            Your Mandatory Responsibilities:
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Truth in Applications:</strong> You are solely and completely responsible for the factual accuracy, truthfulness, and representation of all qualifications, work experiences, certifications, education, and dates presented in your resumes and submitted to employers.
            </li>
            <li>
              <strong>Advisory Nature of Suggestions:</strong> AI output is provided for brainstorming, stylistic refinement, and ATS readability. It does not replace your personal judgment. You must carefully review, verify, and edit all AI-generated suggestions before utilizing them in any formal application.
            </li>
            <li>
              <strong>No Deceptive Conduct:</strong> You agree not to use Pa-Hire Po to generate fabricated credentials, false employment history, or impersonate other professionals.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Accounts & Conduct */}
      <section id="accounts-security" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          5. User Accounts, Security &amp; Acceptable Use
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            When creating an account or authenticating via Google OAuth, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Provide accurate and current information.</li>
            <li>Maintain the confidentiality of your session credentials and report any unauthorized access promptly.</li>
            <li>Use the Platform solely for lawful career and personal development purposes.</li>
          </ul>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 mt-4">
            Prohibited Activities:
          </h3>
          <p className="text-xs sm:text-sm">
            You agree not to engage in any of the following activities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Attempting to probe, scan, or breach the vulnerability of our systems, Supabase PostgreSQL database, or Row-Level Security policies.</li>
            <li>Using automated bots, spiders, or scripts to flood or disrupt the API or server infrastructure.</li>
            <li>Uploading malicious code, trojans, worms, or corrupted files.</li>
            <li>Sublicensing, selling, or redistributing the software or its API endpoints without prior written authorization.</li>
          </ul>
        </div>
      </section>

      {/* 6. Intellectual Property */}
      <section id="intellectual-property" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          6. Intellectual Property &amp; User Content Ownership
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            <strong>Your Content Remains Yours:</strong> You retain complete and exclusive ownership of all resumes, career summaries, personal notes, and profile content you input into the Platform (&ldquo;User Content&rdquo;). We do not claim any proprietary rights over your career information.
          </p>
          <p>
            You grant Pa-Hire Po only the limited, non-exclusive license necessary to store, render, display, and process your User Content within your authenticated account as required to operate the service.
          </p>
          <p>
            <strong>Platform Rights:</strong> All intellectual property rights in the software architecture, user interface code, visual styles, branding, and documentation of Pa-Hire Po are owned by Mark Kevin Alcantara.
          </p>
        </div>
      </section>

      {/* 7. Limitation of Liability */}
      <section id="limitation-liability" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          7. Disclaimers &amp; Limitation of Liability
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            THE PLATFORM, INCLUDING ALL JOB DATA, RESUME STUDIO (AI) TOOLS, AND CONNECTIVITY SERVICES, IS PROVIDED ON AN <strong>&ldquo;AS IS&rdquo;</strong> AND <strong>&ldquo;AS AVAILABLE&rdquo;</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          </p>
          <p>
            WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PA-HIRE PO, ITS DEVELOPER, OR SERVICE PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF EMPLOYMENT OPPORTUNITIES, OR LOSS OF DATA, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
          </p>
        </div>
      </section>

      {/* 8. Governing Law & Contact */}
      <section id="governing-law" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          8. Governing Law &amp; Contact Information
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of law provisions.
          </p>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable, that provision will be modified to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
          </p>

          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-1.5 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-zinc-100">
              Questions Regarding Terms:
            </p>
            <p>
              <strong>Developer &amp; Platform Operator:</strong> Mark Kevin Alcantara
            </p>
            <p>
              <strong>Contact Email:</strong>{' '}
              <a
                href="mailto:markevinalcantara40@gmail.com"
                className="text-[#0a66c2] hover:underline font-mono"
              >
                markevinalcantara40@gmail.com
              </a>
            </p>
            <p>
              <strong>Live Platform:</strong>{' '}
              <a
                href="https://pa-hire-po.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a66c2] hover:underline font-mono"
              >
                https://pa-hire-po.vercel.app
              </a>
            </p>
          </div>
        </div>
      </section>
    </LegalPageShell>
  );
}
