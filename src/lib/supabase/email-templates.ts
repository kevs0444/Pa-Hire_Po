export type EmailTemplateCategory = 'authentication' | 'security';

export interface AuthEmailTemplateItem {
  id:
    | 'confirm-signup'
    | 'invite-user'
    | 'magic-link'
    | 'change-email'
    | 'reset-password'
    | 'reauthenticate'
    | 'password-changed'
    | 'email-changed'
    | 'phone-changed'
    | 'identity-linked'
    | 'identity-unlinked'
    | 'mfa-added'
    | 'mfa-removed';
  category: EmailTemplateCategory;
  title: string;
  supabaseTab: string;
  suggestedSubject: string;
  description: string;
  badgeTone?: 'success' | 'warning' | 'info';
  html: string;
}

function buildCivicEmailShell(params: {
  badgeText: string;
  badgeTone?: 'success' | 'warning' | 'info';
  heading: string;
  introHtml: string;
  alertBoxHtml?: string;
  otpLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote: string;
}): string {
  const tone = params.badgeTone ?? 'success';

  let badgeStyle =
    'background-color:#ecfdf5;border:1px solid #a7f3d0;color:#057642;';
  let badgeIcon = '✓';

  if (tone === 'warning') {
    badgeStyle =
      'background-color:#fef2f2;border:1px solid #fecaca;color:#b91c1c;';
    badgeIcon = '⚠️';
  } else if (tone === 'info') {
    badgeStyle =
      'background-color:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;';
    badgeIcon = 'ℹ️';
  }

  const otpBlock = params.otpLabel
    ? `
                  <!-- 6-Digit OTP Box -->
                  <tr>
                    <td style="padding:20px 0 8px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
                        <tr>
                          <td align="center" style="padding:16px 20px;">
                            <div style="font-family:'Source Sans 3','Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#475569;margin-bottom:8px;">
                              ${params.otpLabel}
                            </div>
                            <div style="font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:10px;color:#0f172a;line-height:1.2;">
                              {{ .Token }}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
    : '';

  const alertBoxBlock = params.alertBoxHtml
    ? `
                  <!-- Alert / Callout Box -->
                  <tr>
                    <td style="padding:16px 0 6px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${
                        tone === 'warning' ? '#fff5f5' : '#f8fafc'
                      };border:1px solid ${
        tone === 'warning' ? '#fee2e2' : '#e2e8f0'
      };border-left:3px solid ${
        tone === 'warning' ? '#dc2626' : tone === 'info' ? '#0a66c2' : '#057642'
      };border-radius:6px;">
                        <tr>
                          <td style="padding:12px 16px;font-size:13px;line-height:1.55;color:#334155;">
                            ${params.alertBoxHtml}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
    : '';

  const ctaBlock =
    params.ctaLabel && params.ctaHref
      ? `
                  <!-- Primary CTA Button -->
                  <tr>
                    <td style="padding:20px 0 16px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="background-color:#0a66c2;border-radius:8px;">
                            <a href="${params.ctaHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 22px;font-family:'Source Sans 3','Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                              ${params.ctaLabel}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>${params.heading} — Pa-Hire Po</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f2ef;color:#0f172a;font-family:'Source Sans 3','Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f2ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <!-- Civic Blue Top Accent -->
            <tr>
              <td style="height:4px;background-color:#0a66c2;font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="padding:24px 28px 16px 28px;border-bottom:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;line-height:1.2;">
                        Pa-Hire Po
                      </div>
                      <div style="font-size:12px;color:#475569;margin-top:2px;">
                        Civic Career Utility • Job Explorer &amp; Resume Studio
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;${badgeStyle}font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:600;padding:4px 8px;border-radius:6px;">
                        ${badgeIcon} ${params.badgeText}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:26px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <h1 style="margin:0 0 10px 0;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">
                        ${params.heading}
                      </h1>
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                        ${params.introHtml}
                      </p>
                    </td>
                  </tr>
                  ${alertBoxBlock}
                  ${otpBlock}
                  ${ctaBlock}

                  <!-- Fallback Link & Security Note -->
                  <tr>
                    <td style="padding-top:14px;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:12px;line-height:1.55;color:#64748b;">
                        ${params.footerNote}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 28px;">
                <p style="margin:0;font-size:11px;line-height:1.5;color:#64748b;">
                  Sent by <strong style="color:#0f172a;">Pa-Hire Po</strong> •
                  <a href="{{ .SiteURL }}/privacy" style="color:#0a66c2;text-decoration:none;">Privacy Policy</a> •
                  <a href="{{ .SiteURL }}/terms" style="color:#0a66c2;text-decoration:none;">Terms of Service</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const SUPABASE_AUTH_EMAIL_TEMPLATES: AuthEmailTemplateItem[] = [
  // ─── AUTHENTICATION (6) ──────────────────────────────────────────────────
  {
    id: 'confirm-signup',
    category: 'authentication',
    title: '1. Confirm Signup (Email OTP + Link)',
    supabaseTab: 'Confirm signup',
    suggestedSubject: 'Your Pa-Hire Po verification code: {{ .Token }}',
    description:
      'Sends a 6-digit OTP code ({{ .Token }}) for new email registrations plus a one-click confirmation button.',
    badgeTone: 'success',
    html: buildCivicEmailShell({
      badgeText: 'Email Verification',
      badgeTone: 'success',
      heading: 'Verify your Pa-Hire Po account',
      introHtml:
        'Enter the 6-digit verification code below on the sign-up screen to activate your <strong style="color:#0f172a;">{{ .Email }}</strong> account and start syncing your job pipeline and tailored resumes.',
      otpLabel: '6-Digit Verification Code',
      ctaLabel: 'Verify Email Directly',
      ctaHref: '{{ .ConfirmationURL }}',
      footerNote:
        'If the code expires or you prefer one-click verification, click the button above. If you did not create a Pa-Hire Po account, you can safely ignore this email.',
    }),
  },
  {
    id: 'invite-user',
    category: 'authentication',
    title: '2. Invite User (Workspace Invitation)',
    supabaseTab: 'Invite user',
    suggestedSubject: 'You have been invited to join Pa-Hire Po',
    description:
      'Welcomes invited users with an activation CTA button and account verification link.',
    badgeTone: 'info',
    html: buildCivicEmailShell({
      badgeText: 'Account Invitation',
      badgeTone: 'info',
      heading: "You've been invited to Pa-Hire Po",
      introHtml:
        'You have been invited to join Pa-Hire Po as <strong style="color:#0f172a;">{{ .Email }}</strong>. Click the button below to accept your invitation and set up your workspace.',
      ctaLabel: 'Accept Invitation & Join',
      ctaHref: '{{ .ConfirmationURL }}',
      footerNote:
        'This invitation link is unique to you and will expire. If you were not expecting an invitation, you can safely ignore this email.',
    }),
  },
  {
    id: 'magic-link',
    category: 'authentication',
    title: '3. Magic Link / Passwordless Sign-In',
    supabaseTab: 'Magic Link',
    suggestedSubject: 'Your Pa-Hire Po sign-in code: {{ .Token }}',
    description:
      'Sends both the 6-digit OTP code ({{ .Token }}) and instant sign-in link ({{ .ConfirmationURL }}) for Magic Link / OTP sign-in.',
    badgeTone: 'success',
    html: buildCivicEmailShell({
      badgeText: 'Secure Sign-In',
      badgeTone: 'success',
      heading: 'Sign in to Pa-Hire Po',
      introHtml:
        'Use this one-time 6-digit code on the login page—or click the button below—to sign in securely as <strong style="color:#0f172a;">{{ .Email }}</strong>.',
      otpLabel: '6-Digit Login Code',
      ctaLabel: 'Sign In to Pa-Hire Po',
      ctaHref: '{{ .ConfirmationURL }}',
      footerNote:
        'For your security, never share this one-time code with anyone. If you did not request a sign-in link, please ignore this message.',
    }),
  },
  {
    id: 'change-email',
    category: 'authentication',
    title: '4. Change Email Address',
    supabaseTab: 'Change email address',
    suggestedSubject: 'Confirm your new Pa-Hire Po email address',
    description:
      'Confirms email address updates with both OTP token and confirmation link.',
    badgeTone: 'info',
    html: buildCivicEmailShell({
      badgeText: 'Email Update',
      badgeTone: 'info',
      heading: 'Confirm your new email address',
      introHtml:
        'Confirm updating your Pa-Hire Po account email to <strong style="color:#0f172a;">{{ .NewEmail }}</strong> using the code or button below.',
      otpLabel: 'Email Change Verification Code',
      ctaLabel: 'Confirm New Email',
      ctaHref: '{{ .ConfirmationURL }}',
      footerNote:
        'If you did not request this email change, sign in immediately and review your Connected Logins and password.',
    }),
  },
  {
    id: 'reset-password',
    category: 'authentication',
    title: '5. Reset Password',
    supabaseTab: 'Reset password',
    suggestedSubject: 'Reset your Pa-Hire Po password',
    description:
      'Clean Civic Career Utility password reset email with secure recovery link.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Password Reset',
      badgeTone: 'warning',
      heading: 'Reset your password',
      introHtml:
        'We received a request to reset the password for <strong style="color:#0f172a;">{{ .Email }}</strong>. Click the button below to choose a new password.',
      ctaLabel: 'Reset Password',
      ctaHref: '{{ .ConfirmationURL }}',
      footerNote:
        'This reset link expires automatically. If you did not request a password change, your current password remains unchanged and you can safely ignore this email.',
    }),
  },
  {
    id: 'reauthenticate',
    category: 'authentication',
    title: '6. Reauthentication (Security Code)',
    supabaseTab: 'Reauthentication',
    suggestedSubject: 'Your Pa-Hire Po security code: {{ .Token }}',
    description:
      'Provides a 6-digit confirmation code for sensitive account modifications.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Security Check',
      badgeTone: 'warning',
      heading: 'Confirm your identity',
      introHtml:
        'A sensitive security action on your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>) requires confirmation. Enter the 6-digit code below to proceed.',
      otpLabel: 'Reauthentication Code',
      ctaLabel: 'Review Security Settings',
      ctaHref: '{{ .SiteURL }}/settings',
      footerNote:
        'This code will expire shortly. If you did not initiate this security verification, please secure your account immediately.',
    }),
  },

  // ─── SECURITY NOTIFICATIONS (7) ──────────────────────────────────────────
  {
    id: 'password-changed',
    category: 'security',
    title: '7. Password Changed (Security Alert)',
    supabaseTab: 'Password changed',
    suggestedSubject: 'Security Alert: Your Pa-Hire Po password was changed',
    description:
      'Notifies the user when their account password has been updated.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Password Changed',
      badgeTone: 'warning',
      heading: 'Your password was updated',
      introHtml:
        'The password for your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>) was recently changed.',
      alertBoxHtml:
        '<strong style="color:#b91c1c;">Did not make this change?</strong> If you did not authorize this password update, someone may have unauthorized access to your account. Please reset your password immediately.',
      ctaLabel: 'Secure Your Account',
      ctaHref: '{{ .SiteURL }}/login',
      footerNote:
        'If you authorized this change, you can safely ignore this notification.',
    }),
  },
  {
    id: 'email-changed',
    category: 'security',
    title: '8. Email Address Changed (Security Alert)',
    supabaseTab: 'Email address changed',
    suggestedSubject: 'Security Alert: Email address changed for Pa-Hire Po',
    description:
      'Notifies the user when their account email address has been modified.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Email Changed',
      badgeTone: 'warning',
      heading: 'Your email address was updated',
      introHtml:
        'The primary email address associated with your Pa-Hire Po account was recently updated.',
      alertBoxHtml:
        '<strong style="color:#b91c1c;">Unauthorized change?</strong> If you did not approve this email modification, please sign in to review your profile and update your password immediately.',
      ctaLabel: 'Review Account Security',
      ctaHref: '{{ .SiteURL }}/login',
      footerNote:
        'This security notification was sent to confirm changes made to your profile.',
    }),
  },
  {
    id: 'phone-changed',
    category: 'security',
    title: '9. Phone Number Changed (Security Alert)',
    supabaseTab: 'Phone number changed',
    suggestedSubject: 'Security Alert: Phone number updated for Pa-Hire Po',
    description:
      'Notifies the user when their linked phone number is modified or removed.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Phone Updated',
      badgeTone: 'warning',
      heading: 'Your phone number was updated',
      introHtml:
        'The phone number linked to your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>) was recently modified or removed.',
      alertBoxHtml:
        '<strong style="color:#b91c1c;">Did not initiate this?</strong> If you did not make this change, please sign in immediately to verify your account security settings.',
      ctaLabel: 'Review Security Settings',
      ctaHref: '{{ .SiteURL }}/login',
      footerNote:
        'If you authorized this change, you can safely disregard this message.',
    }),
  },
  {
    id: 'identity-linked',
    category: 'security',
    title: '10. Sign-in Method Linked (Connected Login)',
    supabaseTab: 'Sign-in method linked',
    suggestedSubject: 'Security Notice: New sign-in method linked to Pa-Hire Po',
    description:
      'Notifies the user when an OAuth provider (Google, GitHub) is connected.',
    badgeTone: 'success',
    html: buildCivicEmailShell({
      badgeText: 'Identity Linked',
      badgeTone: 'success',
      heading: 'A new login method was connected',
      introHtml:
        'A new sign-in provider (such as Google or GitHub) was successfully linked to your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>). You can now sign in using this provider.',
      alertBoxHtml:
        '<strong style="color:#057642;">Manage Connected Logins:</strong> You can review or unlink connected login providers anytime from your Pa-Hire Po Account Settings.',
      ctaLabel: 'Manage Account Settings',
      ctaHref: '{{ .SiteURL }}/settings',
      footerNote:
        'If you did not link this provider, please sign in immediately and unlink it under Settings → Connected Logins.',
    }),
  },
  {
    id: 'identity-unlinked',
    category: 'security',
    title: '11. Sign-in Method Removed (Disconnected Login)',
    supabaseTab: 'Sign-in method removed',
    suggestedSubject: 'Security Notice: Sign-in method disconnected from Pa-Hire Po',
    description:
      'Notifies the user when an OAuth provider (Google, GitHub) is unlinked.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: 'Identity Removed',
      badgeTone: 'warning',
      heading: 'A login method was disconnected',
      introHtml:
        'A sign-in provider was disconnected from your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>). You will no longer be able to use that provider to access this account.',
      alertBoxHtml:
        '<strong style="color:#b91c1c;">Important:</strong> Make sure you have another sign-in method (such as an email password or another linked account) so you can continue accessing your account.',
      ctaLabel: 'Review Connected Logins',
      ctaHref: '{{ .SiteURL }}/settings',
      footerNote:
        'If you did not disconnect this login provider, sign in and verify your account credentials immediately.',
    }),
  },
  {
    id: 'mfa-added',
    category: 'security',
    title: '12. MFA Method Added (Two-Factor Enabled)',
    supabaseTab: 'MFA method added',
    suggestedSubject: 'Security Notice: Two-factor authentication added to Pa-Hire Po',
    description:
      'Notifies the user when an authenticator app (TOTP) / 2FA is enrolled.',
    badgeTone: 'success',
    html: buildCivicEmailShell({
      badgeText: '2FA Enabled',
      badgeTone: 'success',
      heading: 'Multi-factor authentication enabled',
      introHtml:
        'A new multi-factor authentication (MFA / 2FA) method was successfully registered on your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>).',
      alertBoxHtml:
        '<strong style="color:#057642;">Enhanced Protection:</strong> Your account is now secured with two-factor authentication. You may be asked for a verification code when signing in.',
      ctaLabel: 'View Account Security',
      ctaHref: '{{ .SiteURL }}/settings',
      footerNote:
        'If you did not enable two-factor authentication, please reset your password and contact support immediately.',
    }),
  },
  {
    id: 'mfa-removed',
    category: 'security',
    title: '13. MFA Method Removed (Two-Factor Disabled)',
    supabaseTab: 'MFA method removed',
    suggestedSubject: 'Security Alert: Two-factor authentication removed from Pa-Hire Po',
    description:
      'Urgent alert when an MFA factor is removed, lowering account security.',
    badgeTone: 'warning',
    html: buildCivicEmailShell({
      badgeText: '2FA Disabled',
      badgeTone: 'warning',
      heading: 'Multi-factor authentication was removed',
      introHtml:
        'A multi-factor authentication (MFA / 2FA) method was removed from your Pa-Hire Po account (<strong style="color:#0f172a;">{{ .Email }}</strong>). Your account no longer requires a second factor when signing in.',
      alertBoxHtml:
        '<strong style="color:#b91c1c;">Security Warning:</strong> Disabling two-factor authentication lowers your account security. If you did not remove this method, your account may be compromised.',
      ctaLabel: 'Secure Your Account',
      ctaHref: '{{ .SiteURL }}/login',
      footerNote:
        'We strongly recommend keeping multi-factor authentication active to protect your job tracker data and personalized resumes.',
    }),
  },
];
