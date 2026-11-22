# ViceLink // Leonida Companion Hub — Setup, Deployment & Panama Compliance Guide

This guide covers local development, Supabase database & Row-Level Security (RLS) migration, dual-rail payment gateway configuration (**Banco General Yappy Comercial V2** + **Stripe / Tilopay / PagueloFácil**), Vercel deployment, and the **Panama Legal, Tax & Banking Pre-Launch Checklist**.

---

## 1. Local Development Setup

### 1.1 Install Dependencies & Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `.env.local` with your Supabase project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`).
3. Install dependencies and start the local development server on `http://127.0.0.1:3000`:
   ```bash
   npm install
   npm run dev
   ```

### 1.2 Apply the Supabase Postgres & RLS Migration

ViceLink namespaces all database objects with `vicelink_` inside `public` and `private` schemas so it can safely coexist with other applications in a shared Supabase project.

1. Open the **Supabase Dashboard → SQL Editor** for your project (or run `supabase db push` via the Supabase CLI).
2. Paste and execute the full contents of:
   ```
   supabase/migrations/20261121000001_vicelink_schema.sql
   ```
3. Verify the migration created:
   - `public.vicelink_profiles` (with `BEFORE UPDATE` trigger `private.vicelink_guard_profile_tier()` preventing client-side privilege escalation of `access_tier` or `stripe_customer_id`)
   - `public.vicelink_transactions` (`SELECT` only for `authenticated`; writes restricted to server `service_role`)
   - `public.vicelink_progress`
   - `public.vicelink_ai_usage`
   - `public.vicelink_glitch_votes`
   - `public.vicelink_theories`, `public.vicelink_theory_votes`, `public.vicelink_theory_reactions`
   - `public.vicelink_comments`, `public.vicelink_comment_likes`
   - `AFTER INSERT ON auth.users` trigger `private.vicelink_handle_new_user()`
4. In **Supabase Dashboard → Authentication → URL Configuration**:
   - Set **Site URL** to `http://127.0.0.1:3000` (local) or your production domain `https://vicelink.app`.
   - Add Redirect URLs:
     - `http://127.0.0.1:3000/api/auth/callback`
     - `https://vicelink.app/api/auth/callback`

### 1.3 Local Webhook Testing (Stripe CLI & Yappy UAT)

#### Stripe CLI Webhook Forwarding
To test card upgrades (`Street Pass $1.99` and `Kingpin VIP $4.99`) locally:

```bash
stripe login
stripe listen --forward-to http://127.0.0.1:3000/api/webhooks/card
```
*(You can also forward to `http://127.0.0.1:3000/api/stripe/webhook`, which shares the exact same raw-body signature verification handler.)*

Copy the `whsec_...` signing secret printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

#### Banco General Yappy Comercial V2 (UAT / Sandbox Testing)
To simulate a Yappy Instant Payment Notification (IPN) callback locally after creating a pending order via `POST /api/checkout/yappy`:
1. Compute the HMAC-SHA256 signature of `${orderId}E${domain}` using the first segment of `YAPPY_SECRET_KEY` (base64-decoded per Banco General Botón de Pago V2 specification, or UTF-8 fallback in local test mode).
2. Send a `GET` or `POST` request to:
   ```
   http://127.0.0.1:3000/api/webhooks/yappy?orderId=VL...&status=E&domain=https://vicelink.app&hash=<hmac_sha256_hex>
   ```
3. Status codes sent by Yappy Comercial V2:
   - `E` = Ejecutado (Completed — atomically upgrades `vicelink_profiles.access_tier` and marks `vicelink_transactions.status = 'completed'`)
   - `R` = Rechazado (Rejected)
   - `C` = Cancelado (Canceled)
   - `X` = Expirado (Expired)

---

## 2. Vercel Environment Variables Reference

Configure the following variables in **Vercel → Project Settings → Environment Variables**:

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | **Yes** | Supabase project URL (`https://<project>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | **Yes*** | Supabase publishable / anon key (*or set `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SECRET_KEY` | **Server Only** | **Yes*** | Supabase `service_role` secret key for webhook tier upgrades (*or `SUPABASE_SERVICE_ROLE_KEY`) |
| `NEXT_PUBLIC_APP_URL` | Client & Server | **Yes** | Canonical public origin (e.g. `https://vicelink.app`) |
| `YAPPY_MERCHANT_ID` | **Server Only** | Panama Rail | Banco General Yappy Comercial Merchant ID (`ID del Comercio`) |
| `YAPPY_SECRET_KEY` | **Server Only** | Panama Rail | Banco General Yappy Comercial `Clave Secreta` (Botón de Pago V2) |
| `YAPPY_DOMAIN_URL` | **Server Only** | Panama Rail | Registered domain in Yappy Comercial portal (e.g. `https://vicelink.app`) |
| `YAPPY_API_URL` | **Server Only** | Optional | Defaults to `https://apipagosbg.bgeneral.cloud` |
| `CARD_GATEWAY_PROVIDER` | **Server Only** | Card Rail | `stripe` (default), `tilopay`, or `paguelofacil` |
| `STRIPE_SECRET_KEY` | **Server Only** | Card Rail | Stripe Secret Key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | **Server Only** | Card Rail | Stripe Webhook Endpoint Signing Secret (`whsec_...`) |
| `STRIPE_PRICE_STREET_PASS` | **Server Only** | Optional | Optional pre-created Stripe Price ID for Street Pass ($1.99 USD) |
| `STRIPE_PRICE_KINGPIN_VIP` | **Server Only** | Optional | Optional pre-created Stripe Price ID for Kingpin VIP ($4.99 USD) |
| `CARD_GATEWAY_API_KEY` | **Server Only** | Optional | API key when using Tilopay or PagueloFácil Panama card gateway |
| `CARD_GATEWAY_SECRET_KEY` | **Server Only** | Optional | Secret key when using Tilopay or PagueloFácil |
| `CARD_WEBHOOK_SECRET` | **Server Only** | Optional | Webhook HMAC secret for Tilopay or PagueloFácil callbacks |
| `GEMINI_API_KEY` | **Server Only** | Optional | Google Gemini API key used by `POST /api/ai/ask` (falls back to built-in Leonida tactical brain when omitted; never exposed to browser) |

---

## 3. Verification & Automated Test Suite

Before deploying to production, run both the TypeScript compiler check and the automated security & logic test suite:

```bash
npm run typecheck
npm test
```

The test suite (`tests/security-and-logic.test.ts`) validates:
- 100% EN/ES translation key parity (`TRANSLATIONS.en` vs `TRANSLATIONS.es`) and zero hardcoded `"61 Total"` cheat count mismatches.
- Bilingual legal compliance policies (`LEGAL_POLICIES`: Terms, Refunds, Law 81 Privacy, and Unofficial Fan Disclaimer).
- All 32 `LEONIDA_PINS` coordinates have minimum pairwise Euclidean distance `>= 3.8` (preventing pin overlap at `1x` zoom) and zero duplicate leading emojis.
- Non-empty glitches across all 4 categories (`Money`, `Camera`, `Stealth`, `Physics`).
- `getBuiltInLeonidaReply` Easter Egg branch accuracy (EN & ES) and `ch1` Spoiler Shield enforcement.
- Server entitlement matrix (`hasAccess`), XSS/input sanitization (`sanitizePlainText`, `normalizeHandle`), and Yappy V2 order ID & HMAC-SHA256 IPN verification (`generateYappyOrderId`, `verifyYappyIpnHash`).

---

## 4. Panama Legal, Tax & Banking Pre-Launch Checklist

Before switching `YAPPY_SECRET_KEY` and `STRIPE_SECRET_KEY` / Panama card gateway credentials from test mode to live production in the Republic of Panama, complete the following compliance steps:

### 4.1 MICI — PanamaEmprende (`Aviso de Operación`)
- [ ] Register your commercial activity on **[PanamaEmprende](https://www.panamaemprende.gob.pa/)** (Ministerio de Comercio e Industrias — MICI) as a digital services / software portal (*Servicios digitales, desarrollo de software y portales web*).
- [ ] Download and archive your signed **Aviso de Operación** PDF (required by Banco General, Tilopay, and PagueloFácil during merchant onboarding).

### 4.2 DGI — Tax Registration (`RUC` & `Facturador Gratuito SFEP`)
- [ ] Verify your **RUC (Registro Único de Contribuyente)** and **DV (Dígito Verificador)** are active in the **DGI e-Tax 2.0** portal (`etax2.mef.gob.pa`).
- [ ] Register in the **Sistema de Facturación Electrónica de Panamá (SFEP)** using the **Facturador Gratuito** (free tier for up to 200 electronic invoices/month and gross annual revenue under B/. 36,000) or an authorized PAC (*Proveedor Autorizado Calificado*).
- [ ] Note on **ITBMS (7%)**: Under Panamanian tax law, businesses are exempt from charging 7% ITBMS until gross annual revenue exceeds **B/. 36,000.00**. Once annual revenue exceeds B/. 36,000, update your DGI status and enable ITBMS line items on electronic receipts.

### 4.3 Banco General — Yappy Comercial (`Botón de Pago V2`)
- [ ] Open or log in to your **Yappy Comercial** merchant portal at Banco General (`comercial.yappy.com.pa`).
- [ ] Navigate to **Métodos de cobro → Botón de Pago Yappy → Integración API V2**.
- [ ] Register your production domain (`https://vicelink.app`) and set the IPN Webhook URL to:
  ```
  https://vicelink.app/api/webhooks/yappy
  ```
- [ ] Copy the generated **ID del Comercio** (`YAPPY_MERCHANT_ID`) and **Clave Secreta** (`YAPPY_SECRET_KEY`) into Vercel Environment Variables.

### 4.4 Public Legal & Card Acquirer Compliance URLs (Law 81 of 2019)
Banco General, Visa/Mastercard acquirers (Stripe, Tilopay, PagueloFácil), and Panama **Law 81 of 2019** (*Protección de Datos Personales*) require public, unauthenticated access to your Terms, Refund Policy, Privacy Notice, and Intellectual Property Disclaimer prior to checkout.

ViceLink exposes these routes publicly in `src/middleware.ts` and links them on `/login`, the sidebar footer, and the checkout modal:
- [ ] **Terms of Service / Términos y Condiciones:** `https://vicelink.app/terms`
  *(Clearly discloses one-time digital license pricing of $1.99 USD for Street Pass and $4.99 USD for Kingpin VIP, plus explicit non-affiliation with Rockstar Games or Take-Two Interactive.)*
- [ ] **Privacy Policy / Política de Privacidad (Ley 81 de 2019):** `https://vicelink.app/privacy`
  *(Discloses minimal personal data collection, third-party PCI-DSS payment processing, and the self-service **Export My Data (Law 81)** JSON download at `GET /api/me/export`.)*
- [ ] **Refund Policy / Política de Reembolsos:** `https://vicelink.app/refunds`
  *(Discloses immediate digital delivery upon webhook confirmation and the 7-business-day resolution procedure for duplicate charges or technical delivery failures.)*

---

## 5. Admin Command Center & Manual Yappy Approval Workflow

Stage 5 introduces a database-enforced Role-Based Access Control (RBAC) **Admin Command Center** (`🛡️ Admin Panel`) and a public **Submit Intel & Feedback / Community Roadmap** portal (`💡 Submit Intel & Feedback`).

### 5.1 Apply the Stage 5–8 Database Migration
1. Open **Supabase Dashboard → SQL Editor**.
2. Execute the idempotent migration file:
   ```
   supabase/migrations/20261121000002_vicelink_stages_5_8.sql
   ```
   This adds `is_admin` to `public.vicelink_profiles`, `unlocked_trophies` to `public.vicelink_progress`, and creates the RLS-protected CMS & community tables (`vicelink_dynamic_cheats`, `vicelink_dynamic_glitches`, `vicelink_dynamic_map_pins`, `vicelink_community_submissions`, `vicelink_submission_votes`) plus the admin-only `SECURITY DEFINER` RPCs (`vicelink_admin_search_users` and `vicelink_admin_grant_tier`).

### 5.2 Promote the Two Founders to Admin (`is_admin = true`)
Because `private.vicelink_guard_profile_tier()` strictly blocks any client or API user session from modifying `is_admin`, admin promotion can **only** be performed from the **Supabase Dashboard → SQL Editor** (running as `postgres` / `supabase_admin`).

Run the following SQL command after both founders have created their ViceLink accounts:

```sql
update public.vicelink_profiles
set is_admin = true
where email in ('founder1@yourdomain.com', 'founder2@yourdomain.com');
```

Once promoted, reload ViceLink: the **`🛡️ Admin Panel` (`ADMIN`)** navigation button appears automatically in the left sidebar (and remains completely hidden from non-admin players). Every `/api/admin/*` route independently verifies `profile.is_admin === true` on the server and returns `403 FORBIDDEN` to non-admins.

### 5.3 Approving Community Intel & Feedback Submissions
1. Players submit newly discovered money spots, glitch reports, Easter eggs, cheat combinations, or site feedback in **`💡 Submit Intel & Feedback`**.
2. New submissions enter `public.vicelink_community_submissions` with `status = 'pending'` (visible only to the author and admins).
3. Open **`🛡️ Admin Panel → Community Intel & Feedback Queue`**:
   - Filter by **`Pending`** to review incoming player reports.
   - Add an optional bilingual or founder note in **`Admin Notes`** (e.g., *"Verified on Patch 01.002.001 — added to Leonida Tactical Map!"*).
   - Click **`Approve`** (`✓ Verified by ViceLink`), **`Mark Implemented`** (`🚀 Implemented`), or **`Reject`**.
   - Approved and implemented discoveries immediately appear on the public **Community Roadmap & Approved Player Discoveries** feed where all members can upvote (`▲`) them.

### 5.4 Live Glitch Patch Toggling, Cheat Publishing & Click-to-Pin Map Editor
- **1-Click Glitch Status Toggle (`WORKING` ↔ `PATCHED`):** When Rockstar releases a title update, open **`🛡️ Admin Panel → Live Glitch & Cheat Manager`** and click **`Mark Patched`** next to any patched exploit. It immediately flips to a red **`● PATCHED`** badge for all users without redeploying code.
- **Publish New Cheats & Glitches:** Use the bilingual EN/ES forms in Tab 1 to publish newly cracked D-Pad button combos or exploits straight to Postgres.
- **Interactive Click-to-Pin Map Publisher:** In **`🛡️ Admin Panel → Map Pin Publisher`**, click anywhere on the Leonida radar preview to capture exact `(x%, y%)` coordinates, select the pin tier (`free`, `street`, `kingpin`), type (`Money`, `ATM`, `RareCar`, `Fence`, `EasterEgg`, `Collectible`), region, and bilingual notes, then click **`Publish Map Pin`**.

### 5.5 Manual Yappy QR & Card Receipt Approval Workflow
If you accept a manual **Yappy QR** transfer (or verify a support receipt from **PagueloFácil**, **Tilopay**, or **Stripe**) prior to enabling automated Botón de Pago V2 webhooks:
1. Open **`🛡️ Admin Panel → Manual VIP Pass Granter`**.
2. Search the player by their **`@username`** or **`email`**.
3. Select the target tier (**`Street Pass ($1.99)`**, **`Kingpin VIP ($4.99)`**, or **`Free Recruit`**) and payment provider (**`yappy`**, **`paguelofacil`**, **`tilopay`**, or **`stripe`**).
4. Paste the Yappy confirmation number or receipt reference into the reference box and click **`Grant Pass`**.
5. This executes `public.vicelink_admin_grant_tier(...)`, which atomically upgrades `public.vicelink_profiles.access_tier` and records a completed audit receipt (`ADM...`) in `public.vicelink_transactions` so the user's receipt table and Law 81 data export remain 100% accurate.

---

## 6. Stages 9–11: Co-Founder Elevation, TOTP 2FA, Console Verification, Screenshot OCR Sync & Live Feature Flags

Stages 9–11 upgrade ViceLink to the **2026 Neo-Glass HUD UI System**, adding split-screen SaaS authentication, step-up TOTP 2FA (`aal1 -> aal2`), `/reset-password` recovery, PSN/Xbox/Social Club bio-code console verification, Screenshot Progress OCR Sync (`POST /api/sync-progress`), Co-Founder Admin Telemetry & Audit Logs, a Global Command Palette (`Cmd + K`), and a Mobile-First Floating Glass Bottom Dock.

### 6.1 Apply the Stage 9–11 Database Migration (`20261121000003_vicelink_stages_9_11.sql`)
1. Open **Supabase Dashboard → SQL Editor** (or apply via the Supabase CLI / MCP migration runner).
2. Execute the idempotent, additive migration file:
   ```
   supabase/migrations/20261121000003_vicelink_stages_9_11.sql
   ```
3. Verify the migration created and configured:
   - Extended `public.vicelink_profiles` columns: `avatar_preset`, `psn_id`, `psn_verified`, `xbox_gamertag`, `xbox_verified`, `social_club_handle`, `verification_code` (`VL-XXXXXX`), `mfa_enabled`, and `is_banned`.
   - `public.vicelink_admin_audit_logs` (RLS enabled + forced; immutable audit trail recording admin actions across settings, glitches, cheats, map pins, submissions, tier grants, and user bans).
   - `public.vicelink_site_settings` (RLS enabled + forced; stores `global_banner`, `free_ai_daily_limit`, `maintenance_mode`, and `glitches_tab_enabled`).
   - Admin & console RPCs: `vicelink_verify_console_handle`, `vicelink_author_badges`, `vicelink_admin_list_users_v2`, `vicelink_admin_telemetry`, `vicelink_admin_toggle_ban`, and `vicelink_admin_redact_comment`.

### 6.2 Automatic Co-Founder Elevation & Immutable Admin Audit Logs
- **Automatic Co-Founder Privileges:** Migration `20261121000003_vicelink_stages_9_11.sql` and the trigger function `private.vicelink_guard_profile_tier()` automatically recognize the two co-founder emails (`mikehevi2003@gmail.com` and `felipedleon@gmail.com`, case-insensitive) on both `INSERT` and `UPDATE`, immediately granting `is_admin = true`, `access_tier = 'kingpin'`, and `is_banned = false` while blocking privilege tampering by non-privileged callers.
- **Immutable Audit Trail (`public.vicelink_admin_audit_logs`):** Every administrative mutation (`/api/admin/settings`, `/api/admin/glitches`, `/api/admin/cheats`, `/api/admin/pins`, `/api/admin/submissions/[id]`, `/api/admin/users/grant`, `/api/admin/users/ban`) appends a timestamped entry with `admin_id`, `admin_email`, `action_type`, `target_id`, and JSON `details`, viewable live in **`🛡️ Admin Panel → Moderation & Audit Log`**.

### 6.3 Enabling Supabase Native TOTP 2FA & Email Password Recovery Redirects
1. **Enable TOTP Multi-Factor Authentication:**
   - In **Supabase Dashboard → Authentication → Multi-Factor Authentication**, enable **TOTP (App Authenticator)**.
   - Players and co-founders can enroll an authenticator app (Google Authenticator, Authy, 1Password, iCloud Keychain) inside **`👤 Account & 2FA`** (`view-account`), scan the generated QR code, verify a 6-digit code to elevate their session to **`aal2`**, and download 8 emergency backup codes (`VL-XXXX-XXXX`).
   - On subsequent logins (and password resets when MFA is active), `AuthGate` and `ResetPasswordGate` automatically detect `nextLevel === "aal2"` and prompt for the 6-digit TOTP step-up code before entering the hub.
2. **Email Password Recovery Redirect Allowlist:**
   - In **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, ensure the callback URLs are allowlisted for both production and local development:
     - `https://<domain>/api/auth/callback` (e.g. `https://vicelink.app/api/auth/callback`)
     - `http://localhost:3000/api/auth/callback`
     - `http://127.0.0.1:3000/api/auth/callback`
   - When a user requests a password reset on `/login`, ViceLink sends `redirectTo: "<origin>/api/auth/callback?next=/reset-password"`, exchanges the PKCE `code` in `/api/auth/callback`, and lands the authenticated recovery session directly on `/reset-password`.

### 6.4 Configuring `GEMINI_API_KEY` for Screenshot Progress OCR Sync & Live Site Settings
- **Gemini 2.5 Flash Screenshot Progress OCR Sync (`POST /api/sync-progress`):**
  - Set `GEMINI_API_KEY` in `.env.local` and Vercel Environment Variables to enable live **Gemini 2.5 Flash Vision** analysis when players upload a GTA VI Pause/Progress screenshot in **`👤 Account & 2FA → Smart Screenshot Progress OCR Sync`**.
  - **Smart Deterministic Fallback:** When `GEMINI_API_KEY` is unset (or when a player clicks **`⚡ Run Demo Leonida Scan`**), `/api/sync-progress` automatically falls back to the deterministic Leonida keyword and region signature matcher, syncing discovered map pin IDs into `public.vicelink_progress.found_pins` without failing.
- **Live Global Alert Ticker & Feature Flags (`public.vicelink_site_settings`):**
  - Co-founders can update `global_banner` (bilingual EN/ES alert ticker above the hub workspace), `glitches_tab_enabled` (live toggle for the Glitches & Exploits tab), `maintenance_mode` (Neo-Glass Maintenance Shield for non-admin users), and `free_ai_daily_limit` (dynamic daily free AI quota enforced inside `public.vicelink_consume_ai_quota()`) in real time from **`🛡️ Admin Panel → Telemetry & Feature Flags`** without redeploying.

---

## 7. Stage 12: Production Resend SMTP (Gmail & Apple iCloud), Google OAuth, Promo Engine, International No-Refund Waiver & QA-01..QA-08 Matrix

Stage 12 hardens ViceLink for immediate Vercel production launch: eliminating orphaned TOTP 2FA lockout on first-time Co-Founder logins, adding **Resend (`resend.com`)** transactional & promotional email delivery with Panama **Law 81** 1-click unsubscribe (`/api/unsubscribe`), enabling **Google OAuth**, launching the **Promo & Discount Code Engine** (`PANAMA50`, `LEONIDA25`, `FOUNDERVIP`) and the **`$250K/hr First-Hour Cash & Supercar Route (6 Stops)`** map overlay, and enforcing an **International Pre-Checkout No-Refund Waiver** across Yappy and Card checkouts.

### 7.1 Apply the Stage 12 Database Migration (`20261121000004_vicelink_stage12_auth_email_security.sql`)
1. Open **Supabase Dashboard → SQL Editor** (or apply via the Supabase MCP migration runner).
2. Execute the idempotent, additive migration file (contains zero destructive `DROP` or `DELETE` keywords):
   ```
   supabase/migrations/20261121000004_vicelink_stage12_auth_email_security.sql
   ```
3. Verify the migration configured:
   - **Orphaned MFA Factor Demotion & Reset RPC:** Demotes any pre-existing unlinked `auth.mfa_factors` rows where `public.vicelink_profiles.mfa_enabled = false` to `unverified` and exposes `public.vicelink_prepare_totp_enrollment()` (`POST /api/account/mfa-reset`) so Co-Founders (`mikehevi2003@gmail.com` and `felipedleon@gmail.com`) are never locked out before scanning their QR code.
   - **Safe `@handle` Backfill & Co-Founder Trigger:** Ensures every existing and newly registered Gmail, Apple iCloud, or Google OAuth user in `auth.users` has a valid `@handle` (`^@[A-Za-z0-9_]{2,24}$`) in `public.vicelink_profiles` and `public.vicelink_progress`, with automatic `is_admin = true` and `access_tier = 'kingpin'` elevation for both Co-Founders.
   - **Promo Codes & Email Campaigns Tables:** Creates `public.vicelink_promo_codes` (seeded with `PANAMA50` 50% off, `LEONIDA25` 25% off, and `FOUNDERVIP` 100% Kingpin VIP unlock), `public.vicelink_promo_redemptions`, and `public.vicelink_email_campaigns`, plus `marketing_opt_in` and `unsubscribe_token` on `public.vicelink_profiles`.

### 7.2 Connecting Resend (`resend.com`) Custom SMTP + SPF/DKIM/DMARC for Gmail & Apple iCloud
Supabase's built-in demo mailer is rate-limited (~2 emails/hour) and frequently blocked by **Apple iCloud (`@icloud.com`, `@me.com`)** and **Gmail (`@gmail.com`)** spam filters. Connect **Resend** for both Supabase Auth emails (password reset & signup confirmation) and Admin promotional broadcasts (`POST /api/admin/send-promo`):

1. **Verify Your Domain & DNS Records in Resend (`resend.com/domains`):**
   - Add your domain (e.g. `vicelink.app`) in Resend and publish the required DNS records at your registrar / Cloudflare:
     - **SPF (`TXT`):** `v=spf1 include:amazonses.com ~all`
     - **DKIM (`TXT`):** `resend._domainkey.vicelink.app` (paste the RSA public key provided by Resend)
     - **DMARC (`TXT` at `_dmarc.vicelink.app`):** `v=DMARC1; p=quarantine; rua=mailto:security@vicelink.app; pct=100`
   - Wait until Resend shows status **`Verified`** (required by Apple iCloud Mail and Gmail 2024–2026 bulk sender authentication rules).
2. **Configure Supabase Custom SMTP (`Supabase Dashboard → Project Settings → Authentication → SMTP Settings`):**
   - Enable **Custom SMTP** with the following credentials:
     - **Sender Email:** `intel@vicelink.app` (or `no-reply@vicelink.app`)
     - **Sender Name:** `ViceLink // Leonida Tactical Hub`
     - **Host:** `smtp.resend.com`
     - **Port:** `465` (SSL/TLS) or `587` (STARTTLS)
     - **Username:** `resend`
     - **Password:** Your Resend API Key (`re_...`)
3. **Configure Vercel Environment Variables for Admin Broadcasts (`POST /api/admin/send-promo`):**
   - Add the following server-only variables in `.env.local` and **Vercel → Project Settings → Environment Variables**:
     - `RESEND_API_KEY`: `re_xxxxxxxxxxxxxxxxxxxxxxxx`
     - `RESEND_FROM_EMAIL`: `ViceLink Leonida Hub <intel@vicelink.app>`
   - When `RESEND_API_KEY` is configured, **`🛡️ Admin Panel → 📧 Promos & Email`** sends live bilingual HTML broadcasts (`deliveryMode: "resend_live"`) with `List-Unsubscribe` headers and a 1-click Panama Law 81 opt-out link (`/api/unsubscribe?uid=...&token=...`). When unset locally, broadcasts execute a verified dry-run (`deliveryMode: "dry_run_logged"`) and render the full HTML preview inside the Admin Panel.

### 7.3 Enabling Google OAuth in Supabase & Google Cloud Console
1. In **[Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)**:
   - Configure the OAuth Consent Screen (`External`, App Name: `ViceLink // Leonida Companion Hub`).
   - Create an **OAuth 2.0 Client ID** (`Web application`):
     - **Authorized JavaScript Origins:**
       - `https://vicelink.app`
       - `http://localhost:3000`
       - `http://127.0.0.1:3000`
     - **Authorized Redirect URI:**
       - `https://bdtewmmtnfnbjwajmvdg.supabase.co/auth/v1/callback` *(or your project's `https://<project-ref>.supabase.co/auth/v1/callback`)*
2. In **Supabase Dashboard → Authentication → Providers → Google**:
   - Toggle **Enable Sign in with Google** to **ON**.
   - Paste the **Client ID** and **Client Secret** from Google Cloud Console and click **Save**.
3. The **`Continue with Google`** button on `/login` (`AuthGate.tsx`) will redirect through `/api/auth/callback`, auto-create the player's `vicelink_profiles` row (and auto-elevate Co-Founders to `kingpin` + `is_admin = true`), and land them directly in the Hub.

### 7.4 International No-Refund Digital Waiver & Chargeback Protection
- **Statutory Compliance:** `src/lib/legal/policies.ts` (`/terms` and `/refunds`) discloses that **Street Pass (`$1.99` USD)** and **Kingpin VIP (`$4.99` USD)** are one-time, immediately delivered digital licenses with **All Sales Final / No Cooling-Off Refunds** once tactical coordinates, glitches, or AI tools are unlocked, citing:
  - **Republic of Panama:** Ley 45 de 2007 (ACODECO Consumer Protection) & Ley 81 de 2019 (Personal Data Protection).
  - **European Union & United Kingdom:** EU Consumer Rights Directive 2011/83/EU Article 16(m) & UK Consumer Contracts Regulations 2013 Regulation 37 (express prior consent to immediate digital delivery waives the 14-day withdrawal period).
  - **United States & LATAM:** FTC Digital Goods disclosure standards + Colombia Ley 1480 Art. 47 / Mexico PROFECO immediate digital performance exemptions.
- **Pre-Checkout Waiver Enforcement:** Both `PricingModal.tsx` and the server endpoints (`POST /api/checkout/yappy` and `POST /api/checkout/card`) require `waiverAccepted: true` (returning `400 WAIVER_REQUIRED` if omitted) and record `waiverAcceptedAt` and `waiverPolicyVersion: "2026-11-21-NO-REFUND-INTL"` in `vicelink_transactions.raw_payload` and Stripe `metadata` for **Visa/Mastercard Compelling Evidence 3.0** chargeback defense.

### 7.5 Pre-Vercel Verification Matrix (`QA-01` .. `QA-08`)

Run `npm run typecheck` and `npm test` (executing all **18 automated test suites** in `tests/security-and-logic.test.ts`) to verify every pre-launch requirement:

| QA ID | Verification Domain | What Is Verified | Automated / Manual Verification |
| :--- | :--- | :--- | :--- |
| **`QA-01`** | **Co-Founder Auto-Elevation & First-Time 2FA Routing** | `mikehevi2003@gmail.com` and `felipedleon@gmail.com` auto-receive `is_admin = true`, `access_tier = 'kingpin'`, `is_banned = false`; first login without 2FA redirects to `/?setup2fa=1` -> `👤 Account & 2FA` QR setup instead of locking out. | `Test 11` & `Test 15` (`tests/security-and-logic.test.ts`) |
| **`QA-02`** | **Orphaned MFA Factor Reset & Clean TOTP Enrollment** | `POST /api/account/mfa-reset` (`vicelink_prepare_totp_enrollment`) demotes orphaned factors when `mfa_enabled = false`; `AccountView.tsx` unenrolls unverified factors before `mfa.enroll` with timestamped `friendlyName`. | `Test 15` (`tests/security-and-logic.test.ts`) |
| **`QA-03`** | **Universal Gmail, Apple iCloud & OAuth Signup** | `private.vicelink_handle_new_user()` derives a collision-safe `@handle` matching `^@[A-Za-z0-9_]{2,24}$` for all Gmail, iCloud (`@icloud.com`, `@me.com`), and Apple Private Relay addresses; Password Strength meter enforces 4 criteria. | `Test 13` & `Test 15` (`tests/security-and-logic.test.ts`) |
| **`QA-04`** | **Bilingual Data Integrity & Map Coordinate Spacing** | 100% EN/ES key parity in `TRANSLATIONS`, 19 cheats, 32 map pins with pairwise Euclidean distance `>= 3.8`, 25 radio stations, 55 trophies, 30+ hidden controls, and Spoiler Shield on AI Advisor. | `Tests 1, 3, 4, 5, 7, 8, 9, 10, 14` |
| **`QA-05`** | **Paywall Bypass & Privilege Escalation Prevention** | `PATCH /api/me` blocks `access_tier`, `is_admin`, `is_banned`, and `stripe_customer_id`; `private.vicelink_guard_profile_tier()` enforces server-only tier mutations; Yappy IPN verifies HMAC-SHA256. | `Test 6` & `Test 16` (`tests/security-and-logic.test.ts`) |
| **`QA-06`** | **Production Security Headers & Pre-Checkout Waiver** | `next.config.ts` and `vercel.json` enforce `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `Content-Security-Policy`; `/api/checkout/{yappy,card}` enforce `waiverAccepted: true`. | `Test 16` (`tests/security-and-logic.test.ts`) |
| **`QA-07`** | **International No-Refund Policy & Statutory Citations** | `LEGAL_POLICIES.refunds` and `LEGAL_POLICIES.terms` disclose immediate digital delivery & final sale under Panama Law 45 & Law 81, EU Directive 2011/83/EU Art. 16(m), UK CCR, and chargeback protection while preserving `Rockstar Games`. | `Test 2` & `Test 17` (`tests/security-and-logic.test.ts`) |
| **`QA-08`** | **Promo Code Math, Law 81 Unsubscribe & `$250K/hr` Map Route** | `PANAMA50` (50% off -> `$1.00` Street / `$2.50` Kingpin), `LEONIDA25` (25% off -> `$1.49` / `$3.74`), `FOUNDERVIP` (100% -> `$0.00` instant unlock); `/api/unsubscribe` 1-click opt-out in Admin Email Broadcaster; 6-stop `$250K/hr` route in `MapView.tsx`. | `Test 18` (`tests/security-and-logic.test.ts`) |

---

## 8. Final Pre-Launch & Stage 13–15 Official Go-Live Runbook

Stages 13–15 complete ViceLink's **Five-Layer Zero-Trust Security Architecture**, full **Stage 14 Penetration & QA Verification Suite (`Tests 1–22`)**, **Mobile PWA & Dynamic Edge OpenGraph Cards (`/api/og`)**, **Shareable Deep Links (`/?view=map&pin=<id>`)**, **Capacitor iOS/Android Store Packaging**, and **Production Observability & Backup Operations** for `https://vicelink.app`.

### 8.1 Five-Layer Zero-Trust Security Architecture

| Layer | Control Plane | Enforcement Mechanism |
| :---: | :--- | :--- |
| **Layer 1** | **Edge Network, WAF & Distributed Rate Limiting** | Cloudflare WAF (TLS 1.3 Full Strict + Bot Fight Mode) + Vercel security headers (`X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, strict `Content-Security-Policy` in `next.config.ts` & `vercel.json`) + `checkRateLimitAsync()` (Upstash Redis REST pipeline via `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, with sliding-window memory fallback). Enforces **`5 req / 15 min`** on `/api/auth/*` (excluding `/api/auth/signout`) and **`10 req / min`** burst shield on `/api/ai/ask`. |
| **Layer 2** | **Authentication & Mandatory Co-Founder 2FA (`AAL2`) Gate** | Supabase PKCE Auth + `requireAdminAal2()` enforced on **all 11 `/api/admin/*` API routes** (`overview`, `cheats`, `glitches`, `pins`, `promos`, `send-promo`, `settings`, `submissions/[id]`, `users`, `users/ban`, `users/grant`) plus dedicated server-rendered `/admin` route (`src/app/admin/page.tsx`) and inline step-up TOTP modal (`AdminView.tsx`). Any Co-Founder session at `aal1` receives `403 MFA_AAL2_REQUIRED` with `setupUrl: "/?setup2fa=1"`. |
| **Layer 3** | **Input Sanitization & Injection Prevention** | Zero `dangerouslySetInnerHTML`; all user-submitted content validated through `containsDisallowedMarkup()`, `sanitizePlainText()`, and `normalizeHandle()` (`src/lib/security/sanitize.ts`). All Postgres queries use typed RPCs and explicit `escape '\'` wildcard escaping (`vicelink_admin_list_users_v3`). |
| **Layer 4** | **Cryptographic Payment Webhooks & Replay Lock** | **Yappy Comercial V2 (`src/app/api/webhooks/yappy/route.ts`):** rejects unsigned callbacks (`!params.hash`) with `401 UNAUTHORIZED` *before* environment/config checks, verifies HMAC-SHA256 using `crypto.timingSafeEqual` (`verifyYappyIpnHash`), and blocks duplicate replays (`tx.status === "completed"`) by returning `200 { alreadyProcessed: true }` without re-crediting. **Stripe/Card (`/api/webhooks/card`):** raw-body cryptographic signature check. **Pre-Checkout Waiver:** `waiverAccepted: true` enforced on both client and server. |
| **Layer 5** | **PostgreSQL RLS & Immutable Trigger Guards** | `ENABLE` + `FORCE ROW LEVEL SECURITY` on every `public.vicelink_*` table. `private.vicelink_guard_profile_tier()` and `private.vicelink_guard_community_submission()` check `current_user in ('service_role', 'postgres', 'supabase_admin')` with **zero `session_user` bypasses**, blocking client-side tampering with `access_tier`, `is_admin`, `is_banned`, `stripe_customer_id`, or `verification_code`. All admin actions append immutable records to `public.vicelink_admin_audit_logs`. |

### 8.2 Stage 14 Penetration (`SEC-01`..`SEC-05`) & Staging QA (`QA-01`..`QA-05`) Verification Matrix

Run the complete **22-test automated suite** before every production release:

```bash
npm run typecheck
npm test
```

| ID | Security / QA Domain | Acceptance Criteria | Automated / Staging Verification |
| :---: | :--- | :--- | :--- |
| **`SEC-01`** | **Edge & Auth Brute-Force Rate Limiting** | `/api/auth/*` blocks the 6th rapid request within 15 minutes (`429 RATE_LIMITED` + `Retry-After`); `/api/ai/ask` enforces 10 req/min burst shield + Postgres daily quota; Upstash Redis fails open to in-memory sliding window. | `Test 21` (`checkRateLimit` / `checkRateLimitAsync` / `resetRateLimits`) + `curl` burst test on staging |
| **`SEC-02`** | **PostgreSQL Privilege Escalation & RLS Guard** | Direct `PATCH /api/me` or Supabase REST updates attempting to mutate `access_tier`, `is_admin`, `is_banned`, or `stripe_customer_id` fail with `403`/`42501`; `0` `session_user` bypasses in SQL migrations. | `Test 16` & `Test 21` (`20261121000004_vicelink_stage12_auth_email_security.sql`) |
| **`SEC-03`** | **Yappy & Card Webhook Signature + Replay Lock** | Unsigned `POST`/`GET /api/webhooks/yappy` (`!params.hash`) returns `401 UNAUTHORIZED`; forged/truncated hashes fail constant-time `timingSafeEqual`; replaying a `completed` order returns `200 { alreadyProcessed: true }` without double-crediting. | `Test 6` & `Test 19` (`tests/security-and-logic.test.ts`) |
| **`SEC-04`** | **XSS & SQLi Fuzzing Defense** | `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `<svg/onload=...>`, `javascript:`, and SQLi payloads (`' OR 1=1--`, `'; DROP TABLE ...`) are flagged/stripped of `<`/`>` and rejected by handle validators & parameterized RPCs. | `Test 10`, `Test 12`, & `Test 20` |
| **`SEC-05`** | **Mandatory Co-Founder 2FA (`AAL2`) Admin Gate** | Unauthenticated `/admin` redirects to `/login`; non-admin users receive `403 FORBIDDEN`; Co-Founders at `aal1` receive `403 MFA_AAL2_REQUIRED` across all 11 `/api/admin/*` routes and see the inline TOTP verification gate until elevated to `aal2`. | `Test 15` & `Test 21` + live staging verification on `/admin` |
| **`QA-01`** | **Co-Founder Non-Lockout Login & TOTP Setup** | First login for `mikehevi2003@gmail.com` and `felipedleon@gmail.com` routes to `/?setup2fa=1` without lockout; enrolling TOTP elevates session to `aal2` and unlocks `/admin`. | `Test 11` & `Test 15` |
| **`QA-02`** | **Checkout Waiver Copy & Promo Math Accuracy** | `PricingModal.tsx` displays accurate directional copy (`"box above"` / `"casilla superior"`), blocks checkout until waiver is checked, and calculates `PANAMA50` (`$1.00`/`$2.50`), `LEONIDA25` (`$1.49`/`$3.74`), and `FOUNDERVIP` (`$0.00`). | `Test 18` & `Test 21` |
| **`QA-03`** | **Strict Security Headers & CSP Compliance** | Both `next.config.ts` and `vercel.json` emit `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `Content-Security-Policy` allowing Supabase, Stripe, and Yappy CDN origins only. | `Test 16` & `Test 22` + `curl -I https://vicelink.app` |
| **`QA-04`** | **Deep Links (`/?view=map&pin=rc1`) & Edge OG Cards** | Navigating to `/?view=map&pin=rc1` opens the Tactical Map focused on `rc1`; clicking **Share Pin** copies a canonical deep link; `GET /api/og?view=map&pin=rc1` returns a `1200x630` PNG on Edge runtime without requiring auth. | `Test 22` + OpenGraph debugger preview |
| **`QA-05`** | **PWA Installability & Service Worker Isolation** | `public/manifest.json` passes installability checks (`display: standalone`, `#05070e`, 192/512 icons); `public/sw.js` caches static assets only and strictly bypasses `/api/` and `supabase.co`. | `Test 22` + Chrome Lighthouse PWA audit |

### 8.3 Resend + Cloudflare WAF + `vicelink.app` SSL Cutover

1. **Cloudflare DNS & SSL/TLS Cutover (`vicelink.app`):**
   - Point apex `vicelink.app` (`A` -> `76.76.21.21` or Cloudflare CNAME flattening -> `cname.vercel-dns.com`) and `www.vicelink.app` (`CNAME` -> `cname.vercel-dns.com`) to Vercel.
   - Set **SSL/TLS Encryption Mode** to **Full (Strict)**, enable **Always Use HTTPS**, **TLS 1.3**, and **Automatic HTTPS Rewrites**.
   - Enable **Cloudflare WAF Managed Ruleset** + **Bot Fight Mode** and add a Custom WAF Rate Limiting rule on `/api/auth/*` and `/api/checkout/*` as an additional outer shield above Vercel Edge Middleware.
2. **Resend Domain & Supabase Custom SMTP Cutover:**
   - Publish Resend **SPF**, **DKIM (`resend._domainkey`)**, and **DMARC (`_dmarc`)** `TXT` records in Cloudflare DNS (DNS Only / gray cloud) and confirm `Verified` status in `resend.com/domains`.
   - Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL="ViceLink Leonida Hub <intel@vicelink.app>"` in Vercel Production Environment Variables and configure `smtp.resend.com` in **Supabase → Auth → SMTP Settings**.
   - Run a live inbox deliverability smoke test to both a **Gmail** (`@gmail.com`) and **Apple iCloud** (`@icloud.com`) test address (signup confirmation, password reset to `/reset-password`, and 1-click `/api/unsubscribe`).
3. **Production Origins & Live Payment Webhooks:**
   - Update `NEXT_PUBLIC_APP_URL=https://vicelink.app` and `YAPPY_DOMAIN_URL=https://vicelink.app` in Vercel Production.
   - Update **Supabase → Auth → URL Configuration** (`Site URL`: `https://vicelink.app`, `Redirect URLs`: `https://vicelink.app/api/auth/callback`).
   - Switch **Stripe** webhook endpoint to `https://vicelink.app/api/webhooks/card` and **Banco General Yappy Comercial V2** IPN URL to `https://vicelink.app/api/webhooks/yappy`.
   - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel Production to activate multi-region Edge rate limiting.

### 8.4 Mobile PWA & `@capacitor/core` iOS (StoreKit 2) / Android (Google Play Billing) Packaging

ViceLink ships as an installable **Progressive Web App (PWA)** out of the box (`public/manifest.json`, `public/sw.js`, `src/components/pwa/PwaRegister.tsx`) and includes `capacitor.config.ts` (`appId: "app.vicelink.leonida"`, `appName: "ViceLink"`, `server.url: "https://vicelink.app"`) for App Store and Google Play Store native shell packaging:

1. **PWA Verification:**
   - Confirm `https://vicelink.app/manifest.json` and `https://vicelink.app/sw.js` return `200 OK` without auth redirect (allowlisted in `src/middleware.ts`).
   - Verify iOS Safari **"Add to Home Screen"** launches full-screen (`appleWebApp.statusBarStyle: "black-translucent"`) and Chrome/Android displays the standalone install prompt.
2. **Native Store Wrapper Initialization (Optional App Store / Play Store Build):**
   ```bash
   # Install Capacitor CLI & native platforms in a dedicated mobile release branch
   npm install @capacitor/core @capacitor/ios @capacitor/android
   npm install -D @capacitor/cli
   npx cap add ios
   npx cap add android
   npx cap sync
   ```
3. **iOS App Store — StoreKit 2 In-App Purchase Compliance (App Store Review Guideline 3.1.1):**
   - For digital pass unlocks purchased *inside* the native iOS binary, configure two **Non-Consumable IAP SKUs** in **App Store Connect**:
     - `app.vicelink.street_pass` — **$1.99 USD** (Street Pass Lifetime)
     - `app.vicelink.kingpin_vip` — **$4.99 USD** (Kingpin VIP Lifetime)
   - Integrate StoreKit 2 receipt verification (e.g., `@revenuecat/purchases-capacitor` or Apple App Store Server API JWS verification) forwarding verified transactions to a server webhook that calls `completePaymentAndUpgrade()`.
   - Keep Yappy Comercial & Stripe checkout exclusive to the web storefront (`https://vicelink.app`) unless Apple external link entitlement is approved for the target region.
4. **Android Google Play — Google Play Billing Library v7 Compliance:**
   - Configure matching **One-Time In-App Products** (`app.vicelink.street_pass`, `app.vicelink.kingpin_vip`) in **Google Play Console**.
   - Verify purchase tokens server-side via Google Play Developer API (`purchases.products.get`) and acknowledge within 3 days before calling `completePaymentAndUpgrade()`.
   - Run `npx cap open ios` (Xcode signing & TestFlight upload) and `npx cap open android` (Android Studio signed `.aab` upload to Play Console Internal Testing).

### 8.5 Sentry Crash & Error Observability (Co-Founder Alert Routing)

1. Create a Next.js project in **[Sentry](https://sentry.io/)** (`vicelink-leonida-hub`) and copy the client DSN.
2. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel **Production** (and optionally Preview) Environment Variables. `PwaRegister.tsx` automatically binds `window.addEventListener("error")` and `unhandledrejection` listeners to forward uncaught client errors to the Sentry envelope endpoint without crashing when the DSN is unset locally.
3. Configure **Sentry Alert Rules → Action: Send a notification to Email** routed to both Co-Founders:
   - `mikehevi2003@gmail.com`
   - `felipedleon@gmail.com`
4. Recommended Alert Triggers:
   - **P0 Payment/Auth Alert:** Any `5xx` spike or unhandled exception on `/api/webhooks/*`, `/api/checkout/*`, or `/api/auth/*` (instant email alert).
   - **P1 Runtime Alert:** `>= 10` unhandled frontend crashes affecting `>= 3` distinct users within 5 minutes.
   - **P2 Quota/Edge Alert:** Upstash Redis timeout fallback warnings or Gemini OCR API failures.

### 8.6 Daily Supabase Backup & Disaster Recovery Checklist

- [ ] **Automated Daily Backups:** Confirm Supabase Dashboard → **Database → Backups** shows **Daily Backups** enabled (or enable **Point-in-Time Recovery (PITR)** once on Supabase Pro for 1-minute RPO across payment & profile tables).
- [ ] **Weekly Off-Site Logical Snapshot (`vicelink_*` Schema):** Schedule an encrypted weekly backup job (GitHub Actions / secure cron) exporting only `vicelink_*` tables (excluding secrets) to private object storage:
  ```bash
  pg_dump "$SUPABASE_DB_URL" \
    --schema=public --table='public.vicelink_*' \
    --no-owner --no-privileges --format=custom \
    --file="vicelink-backup-$(date +%Y%m%d).dump"
  ```
- [ ] **Quarterly Restore Drill:** Test restoring a logical backup into a scratch/staging database and verify `vicelink_profiles`, `vicelink_transactions`, `vicelink_promo_codes`, and `vicelink_admin_audit_logs` row counts and RLS policies (`FORCE ROW LEVEL SECURITY`).
- [ ] **90-Day Secret Hygiene:** Rotate `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, and `GEMINI_API_KEY` on a quarterly cadence via Vercel Environment Variables (never commit `.env.local` to git).
- [ ] **Final Go-Live Sign-Off:**
  - [ ] `npm run typecheck` passes with `0` errors.
  - [ ] `npm test` passes **22/22** security, data, bilingual, and Stage 15 PWA/OG tests.
  - [ ] Both Co-Founders (`mikehevi2003@gmail.com` & `felipedleon@gmail.com`) have enrolled TOTP 2FA (`aal2`), downloaded emergency backup codes, and verified `/admin` access on production.
  - [ ] Live `$1.99` Yappy & Card smoke test completed and verified in `vicelink_transactions` + Law 81 JSON export (`/api/me/export`).




