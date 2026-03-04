# MissionFrica Email Templates Setup Guide

## How to Apply Custom Email Templates in Supabase

### Step 1: Access Email Templates

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Apply Templates

For each email type, copy the HTML content from the corresponding file and paste it into the Supabase email template editor.

#### Confirmation Email (Signup)
- File: `confirmation-email.html`
- In Supabase: Select "Confirm signup" template
- Subject Line: `Welcome to MissionFrica - Please Confirm Your Email`

#### Password Reset Email
- File: `reset-password-email.html`
- In Supabase: Select "Reset password" template
- Subject Line: `Reset Your MissionFrica Password`

#### Magic Link Email
- File: `magic-link-email.html`
- In Supabase: Select "Magic Link" template
- Subject Line: `Sign In to MissionFrica`

#### Invite Email
- File: `invite-email.html`
- In Supabase: Select "Invite user" template
- Subject Line: `You're Invited to Join MissionFrica`

### Step 3: Configure Sender

In **Authentication** → **Email Templates** → **SMTP Settings**:

- **Sender email**: noreply@missionfrica.com (or your domain)
- **Sender name**: MissionFrica

### Step 4: Test Emails

After applying templates:
1. Create a test account
2. Verify the email looks professional
3. Test password reset flow

## Template Variables

These templates use Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)

## Customization

Feel free to modify:
- Colors (currently using MissionFrica's blue #1e40af and amber #f59e0b)
- Logo (replace the ❤️ emoji with an actual logo image)
- Footer text and links
- Any copy/messaging
