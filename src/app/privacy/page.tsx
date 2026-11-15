import type { Metadata } from 'next';
import { LegalPageShell } from '@/features/legal/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Pa-Hire Po',
  description:
    'Official Privacy Policy for Pa-Hire Po. Details Google OAuth authentication, Supabase Row-Level Security, Gemini AI resume tailoring, and user data rights.',
};

const navItems = [
  { id: 'overview', label: '1. Overview & Scope' },
  { id: 'google-data', label: '2. Google User Data Policy' },
  { id: 'data-collected', label: '3. Data We Collect' },
  { id: 'ai-processing', label: '4. Gemini AI Processing' },
  { id: 'storage-security', label: '5. Storage & Security' },
  { id: 'retention-deletion', label: '6. Retention & Rights' },
  { id: 'contact', label: '7. Contact & Inquiries' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How Pa-Hire Po collects, uses, protects, and manages your personal information, uploaded CVs, and Google OAuth credentials."
      effectiveDate="November 15, 2026"
      currentPath="/privacy"
      navItems={navItems}
    >
      {/* 1. Overview & Scope */}
      <section id="overview" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          1. Overview &amp; Scope
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            Welcome to <strong>Pa-Hire Po</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;), accessible at{' '}
            <a
              href="https://pa-hire-po.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a66c2] hover:underline font-medium"
            >
              https://pa-hire-po.vercel.app
            </a>
            . Pa-Hire Po is a civic career utility designed to streamline multi-board job discovery across public portals (LinkedIn, JobStreet, Indeed) and empower job seekers with an intelligent, privacy-first Resume Studio.
          </p>
          <p>
            We recognize that job applications and resumes contain sensitive professional and personal information. This Privacy Policy outlines what information we collect, how it is processed and secured, and your explicit rights under applicable data protection laws, including the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), General Data Protection Regulation (GDPR), and Google API Services User Data Policy.
          </p>
          <p>
            By accessing or using Pa-Hire Po, you acknowledge and agree to the practices described in this Privacy Policy. If you do not agree with any term in this policy, please discontinue use of the Platform immediately.
          </p>
        </div>
      </section>

      {/* 2. Google User Data & OAuth Policy */}
      <section id="google-data" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-xs font-mono font-semibold text-blue-800 dark:text-blue-300">
            Google OAuth Verified
          </span>
          <span className="text-xs text-slate-500 font-mono">Scope Compliance</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          2. Google User Data &amp; OAuth 2.0 Policy
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            Pa-Hire Po allows users to sign in and authenticate using their Google Account via Google OAuth 2.0. Our use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a66c2] hover:underline font-medium"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>

          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-zinc-100">
              Specific Scopes Requested &amp; Purpose:
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <code className="font-mono bg-white dark:bg-zinc-800 px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                  openid
                </code>
                : Authenticates your identity securely without Pa-Hire Po ever seeing or storing your Google account password.
              </li>
              <li>
                <code className="font-mono bg-white dark:bg-zinc-800 px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                  https://www.googleapis.com/auth/userinfo.profile
                </code>
                : Retrieves your display name and profile avatar to populate your user badge and resume header.
              </li>
              <li>
                <code className="font-mono bg-white dark:bg-zinc-800 px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                  https://www.googleapis.com/auth/userinfo.email
                </code>
                : Associates your saved job applications, tailored resumes, and account settings with your verified email address.
              </li>
            </ul>
          </div>

          <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 mt-4">
            Our Explicit Commitments Regarding Google Data:
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>NO SELLING:</strong> We do NOT sell, rent, lease, or monetize your Google user data, profile information, or email address to third parties, advertisers, or data brokers under any circumstances.
            </li>
            <li>
              <strong>NO ADVERTISING:</strong> We do NOT use or transfer your Google user data for serving personalized, retargeted, or interest-based advertising.
            </li>
            <li>
              <strong>NO AI MODEL TRAINING:</strong> We do NOT use Google user data to train, retrain, fine-tune, or improve generalized foundation machine learning models.
            </li>
            <li>
              <strong>MINIMAL TRANSFER:</strong> Data received via Google OAuth is transferred only as strictly necessary to maintain your authenticated session through Supabase Authentication or as required by law.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Data We Collect */}
      <section id="data-collected" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          3. Information We Collect
        </h2>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            We collect only the minimum information necessary to deliver the features of Pa-Hire Po:
          </p>

          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
              A. User-Provided Information
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Profile &amp; Contact Details:</strong> Full name, professional headline, primary role, email, phone number, location, and links (e.g., LinkedIn, GitHub, portfolio).
              </li>
              <li>
                <strong>Resume &amp; Career Content:</strong> Work experiences, education, certifications, technical and soft skills, and achievement bullet points entered into Resume Studio or parsed from an uploaded PDF.
              </li>
              <li>
                <strong>Job Pipeline State:</strong> Bookmarked job listings, application stages (Saved, Applied, Interviewing, Offered, Rejected), custom interview notes, and match preferences.
              </li>
              <li>
                <strong>Compressed Profile Imagery:</strong> User-uploaded avatars center-cropped and compressed client-side to lightweight data URLs (&lt;60 KB) to respect database efficiency.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
              B. Automatically Collected Technical Information
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Usage Metrics:</strong> Aggregated, privacy-first analytics powered by Vercel Analytics (does not use third-party tracking cookies or cross-site tracking).
              </li>
              <li>
                <strong>Diagnostic Logs:</strong> Standard HTTP request logs (IP address, browser user-agent, operating system, and response latency) retained temporarily for security auditing, DDoS mitigation, and error debugging.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Gemini AI Processing */}
      <section id="ai-processing" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
            Resume Studio (AI)
          </span>
          <span className="text-xs text-slate-500 font-mono">Gemini 3.1 Flash-Lite</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          4. Artificial Intelligence Processing (Google Gemini API)
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            Pa-Hire Po features an AI-assisted resume optimizer within <strong>Resume Studio</strong>. This feature utilizes the Google Gemini API (specifically <code className="font-mono text-xs bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">gemini-3.1-flash-lite</code>) under strict enterprise data protection principles:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>On-Demand Execution:</strong> AI tailoring occurs <em>only</em> when you explicitly click &ldquo;Tailor Resume&rdquo; or &ldquo;Score Fit&rdquo; in the interface.
            </li>
            <li>
              <strong>Stateless Processing:</strong> Only the current resume draft and the selected job description are submitted to the API. No personal data is permanently retained by the AI model after generating the suggestions.
            </li>
            <li>
              <strong>Enterprise Non-Training Guarantee:</strong> Under Google&apos;s API Terms of Service, prompts and data sent to paid developer Gemini API endpoints are not used to train or improve Google foundation models.
            </li>
            <li>
              <strong>Advisory Nature:</strong> AI suggestions are purely assistive. You retain total editorial control to accept, reject, or rewrite all generated content before downloading or submitting your resume.
            </li>
          </ul>
        </div>
      </section>

      {/* 5. Storage & Security */}
      <section id="storage-security" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          5. Data Storage, Hosting &amp; Row-Level Security
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            We enforce modern technical and organizational security measures to protect your personal data against unauthorized access, loss, or disclosure:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Supabase PostgreSQL with Row-Level Security (RLS):</strong> User profiles, resumes, and saved job pipelines are stored in a dedicated Supabase PostgreSQL database. Every table enforces strict PostgreSQL RLS policies ensuring that an authenticated user can only access, view, or modify their own rows. No user can access another user&apos;s records.
            </li>
            <li>
              <strong>Encryption in Transit &amp; at Rest:</strong> All traffic between your browser and our servers is encrypted using modern Transport Layer Security (TLS 1.3). Database disks and cloud backups are encrypted at rest with AES-256.
            </li>
            <li>
              <strong>Zero Plaintext Passwords:</strong> For accounts using email and password, authentication is managed securely by Supabase Auth using industry-standard salted bcrypt hashing. OAuth sessions utilize cryptographically signed JSON Web Tokens (JWT).
            </li>
            <li>
              <strong>Global Edge Delivery:</strong> The web application is hosted on Vercel&apos;s global secure infrastructure with automated DDoS mitigation and Web Application Firewall (WAF) filtering.
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Retention & Rights */}
      <section id="retention-deletion" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          6. Data Retention &amp; Your Legal Rights
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            We retain your personal data only for as long as your account remains active or as needed to provide you with the services of the Platform.
          </p>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
            Your Rights:
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Right to Access:</strong> You can view all information stored about your account at any time via your profile and Resume Studio.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You can edit and update any piece of profile information, work history, or contact data directly.
            </li>
            <li>
              <strong>Right to Erasure (Deletion):</strong> You have the right to request full deletion of your user account and all associated resumes, jobs, and profile data. Upon receiving your verified request, all your data will be permanently purged from our database within seven (7) business days.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You can export your resume content at any time in industry-standard PDF, TXT, or JSON formats.
            </li>
          </ul>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            To submit an account or data deletion request, email us at{' '}
            <a
              href="mailto:markevinalcantara40@gmail.com?subject=Pa-Hire%20Po%20Data%20Deletion%20Request"
              className="text-[#0a66c2] hover:underline font-mono font-medium"
            >
              markevinalcantara40@gmail.com
            </a>
            {' '}with your registered email address.
          </p>
        </div>
      </section>

      {/* 7. Contact & Inquiries */}
      <section id="contact" className="p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          7. Contact Information &amp; Data Protection Officer
        </h2>
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy, your personal information, or our compliance with data privacy regulations, please contact our designated administrator:
          </p>

          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-1.5 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-zinc-100">
              Pa-Hire Po — Privacy &amp; Data Protection
            </p>
            <p>
              <strong>Developer &amp; Administrator:</strong> Mark Kevin Alcantara
            </p>
            <p>
              <strong>Primary Contact Email:</strong>{' '}
              <a
                href="mailto:markevinalcantara40@gmail.com"
                className="text-[#0a66c2] hover:underline font-mono"
              >
                markevinalcantara40@gmail.com
              </a>
            </p>
            <p>
              <strong>Application Home:</strong>{' '}
              <a
                href="https://pa-hire-po.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a66c2] hover:underline font-mono"
              >
                https://pa-hire-po.vercel.app
              </a>
            </p>
            <p>
              <strong>Location:</strong> Republic of the Philippines
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            We review and update this Privacy Policy periodically to reflect enhancements to our platform and evolving legal standards. Material updates will be noted by updating the &ldquo;Effective Date&rdquo; at the top of this page.
          </p>
        </div>
      </section>
    </LegalPageShell>
  );
}
