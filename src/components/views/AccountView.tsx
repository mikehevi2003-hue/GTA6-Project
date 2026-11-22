"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import type { Language, PaymentReceipt, UserProfile, UserProgress } from "@/types/vicelink";
import { createClient } from "@/lib/supabase/client";
import {
  evaluatePasswordCriteria,
  generateTotpBackupCodes,
  normalizeQrDataUrl
} from "@/lib/qr/totp-qr";

export interface AccountViewProps {
  lang: Language;
  profile: UserProfile;
  progress: UserProgress;
  payments: PaymentReceipt[];
  onSaveProfile: (patch: {
    handle?: string;
    displayName?: string;
    preferredLang?: Language;
    avatarPreset?: string;
    psnId?: string;
    xboxGamertag?: string;
    socialClubHandle?: string;
    mfaEnabled?: boolean;
    marketingOptIn?: boolean;
  }) => Promise<void>;
  onProfileUpdated: (profile: UserProfile) => void;
  onProgressSynced: (foundPins: string[]) => void;
  onTrophiesSynced?: (unlockedTrophies: string[]) => void;
  onOpenPricing: () => void;
  onSignOut: () => Promise<void>;
  onToast?: (kind: "success" | "info" | "error", text: string) => void;
}

export interface AvatarPresetOption {
  id: string;
  icon: string;
  labelEn: string;
  labelEs: string;
  accent: string;
}

export const AVATAR_PRESETS: AvatarPresetOption[] = [
  {
    id: "neon_vice",
    icon: "🌴",
    labelEn: "Neon Vice",
    labelEs: "Neón Vice",
    accent: "#ff2a85"
  },
  {
    id: "lucia_tactical",
    icon: "🎯",
    labelEn: "Lucia Tactical",
    labelEs: "Lucía Táctica",
    accent: "#00e5ff"
  },
  {
    id: "jason_keys",
    icon: "🚤",
    labelEn: "Jason Keys",
    labelEs: "Jason Keys",
    accent: "#38bdf8"
  },
  {
    id: "kingpin_gold",
    icon: "👑",
    labelEn: "Kingpin Gold",
    labelEs: "Kingpin Dorado",
    accent: "#facc15"
  },
  {
    id: "wasted_skull",
    icon: "💀",
    labelEn: "Wasted Skull",
    labelEs: "Calavera Wasted",
    accent: "#f43f5e"
  },
  {
    id: "ufo_kalaga",
    icon: "🛸",
    labelEn: "UFO Kalaga",
    labelEs: "OVNI Kalaga",
    accent: "#a855f7"
  }
];

const TIER_LABELS: Record<UserProfile["tier"], { en: string; es: string }> = {
  free: { en: "FREE RECRUIT", es: "RECLUTA GRATIS" },
  street: { en: "STREET PASS ($1.99)", es: "STREET PASS ($1.99)" },
  kingpin: { en: "👑 KINGPIN VIP ($4.99)", es: "👑 KINGPIN VIP ($4.99)" }
};

export function AccountView({
  lang,
  profile,
  progress,
  payments,
  onSaveProfile,
  onProfileUpdated,
  onProgressSynced,
  onTrophiesSynced,
  onOpenPricing,
  onSignOut,
  onToast
}: AccountViewProps) {
  const isEs = lang === "es";

  // 1. Identity & Avatar Preset State
  const [handle, setHandle] = useState(profile.handle);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [preferredLang, setPreferredLang] = useState<Language>(profile.preferredLang);
  const [avatarPreset, setAvatarPreset] = useState<string>(profile.avatarPreset || "neon_vice");
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(profile.marketingOptIn ?? true);
  const [savingIdentity, setSavingIdentity] = useState(false);

  // 2. Console Linking & Bio-Code Handshake State
  const [psnId, setPsnId] = useState(profile.psnId || "");
  const [xboxGamertag, setXboxGamertag] = useState(profile.xboxGamertag || "");
  const [socialClubHandle, setSocialClubHandle] = useState(profile.socialClubHandle || "");
  const [verifyingPlatform, setVerifyingPlatform] = useState<
    "psn" | "xbox" | "social_club" | null
  >(null);
  const [bioCodeCopied, setBioCodeCopied] = useState(false);

  // 3. Smart Screenshot Progress OCR Sync State
  const [ocrImageBase64, setOcrImageBase64] = useState<string | null>(null);
  const [ocrMimeType, setOcrMimeType] = useState<string>("image/png");
  const [ocrFileName, setOcrFileName] = useState<string>("");
  const [ocrNotes, setOcrNotes] = useState<string>("");
  const [ocrPlatform, setOcrPlatform] = useState<"ps5" | "xbox">("ps5");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    syncedCount: number;
    totalFound: number;
    method: string;
    summary: string;
  } | null>(null);

  // 4. Two-Step Authentication (2FA / TOTP) & Password State
  const [mfaLoading, setMfaLoading] = useState(true);
  const [currentAal, setCurrentAal] = useState<"aal1" | "aal2">(profile.aal || "aal1");
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollingFactorId, setEnrollingFactorId] = useState<string | null>(null);
  const [enrollQrCode, setEnrollQrCode] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [totpConfirmCode, setTotpConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [secretCopied, setSecretCopied] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [mfaBusy, setMfaBusy] = useState(false);

  // Inline Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  // 5. Law 81 Export & Session Sign Out State
  const [exporting, setExporting] = useState(false);
  const [signingOutGlobal, setSigningOutGlobal] = useState(false);
  const [localBanner, setLocalBanner] = useState<{
    kind: "success" | "info" | "error";
    text: string;
  } | null>(null);

  const notify = useCallback(
    (kind: "success" | "info" | "error", text: string) => {
      setLocalBanner({ kind, text });
      onToast?.(kind, text);
    },
    [onToast]
  );

  useEffect(() => {
    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setPreferredLang(profile.preferredLang);
    setAvatarPreset(profile.avatarPreset || "neon_vice");
    setMarketingOptIn(profile.marketingOptIn ?? true);
    setPsnId(profile.psnId || "");
    setXboxGamertag(profile.xboxGamertag || "");
    setSocialClubHandle(profile.socialClubHandle || "");
    if (profile.aal) setCurrentAal(profile.aal);
  }, [profile]);

  const loadMfaState = useCallback(async () => {
    setMfaLoading(true);
    try {
      if (!profile.mfaEnabled) {
        await fetch("/api/account/mfa-reset", { method: "POST" }).catch(() => null);
      }
      const supabase = createClient();
      const [{ data: aalData }, { data: factorsData }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors()
      ]);

      if (aalData?.currentLevel === "aal2") {
        setCurrentAal("aal2");
      } else if (aalData?.currentLevel === "aal1") {
        setCurrentAal("aal1");
      }

      const verified = factorsData?.totp?.find((f) => f.status === "verified");
      setVerifiedFactorId(verified && profile.mfaEnabled ? verified.id : null);
    } catch {
      // Ignore if MFA inspection fails offline
    } finally {
      setMfaLoading(false);
    }
  }, [profile.mfaEnabled]);

  useEffect(() => {
    void loadMfaState();
  }, [loadMfaState]);

  const pwEval = useMemo(() => evaluatePasswordCriteria(newPassword, lang), [newPassword, lang]);

  // --- Section 1 Handlers: Identity, Avatar & Marketing Opt-In ---
  const handleSelectAvatar = async (presetId: string) => {
    setAvatarPreset(presetId);
    try {
      await onSaveProfile({ avatarPreset: presetId });
      notify(
        "success",
        isEs ? "✓ Avatar táctico actualizado." : "✓ Tactical avatar preset updated."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo guardar el avatar."
            : "Could not save avatar preset."
      );
    }
  };

  const handleToggleMarketingOptIn = async (nextOptIn: boolean) => {
    setMarketingOptIn(nextOptIn);
    try {
      await onSaveProfile({ marketingOptIn: nextOptIn });
      notify(
        "success",
        nextOptIn
          ? isEs
            ? "✓ Suscripción activada para alertas tácticas y códigos promocionales."
            : "✓ Opted in to tactical intel & promotional discount emails."
          : isEs
            ? "✓ Correos promocionales desactivados."
            : "✓ Marketing & promotional emails turned off."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo actualizar tu preferencia de correos."
            : "Could not update marketing email preference."
      );
    }
  };

  const handleSaveIdentity = async (e: FormEvent) => {
    e.preventDefault();
    setSavingIdentity(true);
    setLocalBanner(null);
    try {
      await onSaveProfile({
        handle: handle.trim(),
        displayName: displayName.trim(),
        preferredLang,
        avatarPreset,
        marketingOptIn
      });
      notify(
        "success",
        isEs
          ? "✓ Perfil táctico actualizado y sincronizado en la nube."
          : "✓ Command profile saved and synced to the cloud."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo actualizar tu perfil."
            : "Could not update profile."
      );
    } finally {
      setSavingIdentity(false);
    }
  };

  // --- Section 2 Handlers: Console Linking & Bio-Code Handshake ---
  const verificationCode = profile.verificationCode || "VL-94A2F1";

  const handleCopyBioCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setBioCodeCopied(true);
      window.setTimeout(() => setBioCodeCopied(false), 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleVerifyConsole = async (platform: "psn" | "xbox" | "social_club") => {
    const rawHandle =
      platform === "psn"
        ? psnId.trim()
        : platform === "xbox"
          ? xboxGamertag.trim()
          : socialClubHandle.trim();

    if (rawHandle.length < 3 || rawHandle.length > 24 || !/^[A-Za-z0-9 _-]+$/.test(rawHandle)) {
      notify(
        "error",
        isEs
          ? "El usuario de consola debe tener entre 3 y 24 caracteres (letras, números, espacios, _ o -)."
          : "Console handle must be 3–24 characters (letters, numbers, spaces, _ or -)."
      );
      return;
    }

    setVerifyingPlatform(platform);
    setLocalBanner(null);
    try {
      const res = await fetch("/api/account/console-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle: rawHandle })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (isEs
              ? "No se pudo verificar la cuenta de consola."
              : "Could not verify console account.")
        );
      }
      if (data?.profile) {
        onProfileUpdated(data.profile as UserProfile);
      } else {
        await onSaveProfile(
          platform === "psn"
            ? { psnId: rawHandle }
            : platform === "xbox"
              ? { xboxGamertag: rawHandle }
              : { socialClubHandle: rawHandle }
        );
      }
      notify(
        "success",
        platform === "psn"
          ? isEs
            ? `✓ PSN ID "${rawHandle}" verificado con código ${verificationCode}.`
            : `✓ PSN ID "${rawHandle}" verified via bio handshake ${verificationCode}.`
          : platform === "xbox"
            ? isEs
              ? `✓ Xbox Gamertag "${rawHandle}" verificado con código ${verificationCode}.`
              : `✓ Xbox Gamertag "${rawHandle}" verified via bio handshake ${verificationCode}.`
            : isEs
              ? `✓ Rockstar Social Club "${rawHandle}" vinculado.`
              : `✓ Rockstar Social Club "${rawHandle}" linked.`
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al verificar la consola."
            : "Console verification failed."
      );
    } finally {
      setVerifyingPlatform(null);
    }
  };

  // --- Section 3 Handlers: Smart Screenshot Progress OCR Sync ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify(
        "error",
        isEs
          ? "La captura no debe superar los 5 MB."
          : "Screenshot file size must be under 5 MB."
      );
      return;
    }

    setOcrFileName(file.name);
    setOcrMimeType(file.type || "image/png");

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64Part = result.includes(",") ? result.split(",")[1] : result;
      setOcrImageBase64(base64Part || null);
    };
    reader.readAsDataURL(file);
  };

  const runProgressOcrSync = async (useDemoScan: boolean) => {
    setOcrBusy(true);
    setLocalBanner(null);
    try {
      const payload = useDemoScan
        ? {
            detectedText:
              ocrNotes.trim() ||
              "Vice City, Vice Beach, Little Cuba, Ocean View, Leonida Keys, Grassrivers, Port Gellhorn, Mount Kalaga",
            platform: ocrPlatform
          }
        : {
            imageBase64: ocrImageBase64 || undefined,
            mimeType: ocrMimeType,
            detectedText:
              ocrNotes.trim() ||
              ocrFileName ||
              "Vice City, Leonida Keys, Little Cuba, Ocean View",
            platform: ocrPlatform
          };

      const res = await fetch("/api/sync-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (isEs
              ? "No se pudo sincronizar la captura de progreso."
              : "Could not sync progress screenshot.")
        );
      }

      if (Array.isArray(data.foundPins)) {
        onProgressSynced(data.foundPins as string[]);
      }
      if (Array.isArray(data.unlockedTrophies)) {
        onTrophiesSynced?.(data.unlockedTrophies as string[]);
      }

      const syncedCount = Array.isArray(data.syncedPinIds) ? data.syncedPinIds.length : 0;
      const totalFound =
        typeof data.totalFoundPins === "number"
          ? data.totalFoundPins
          : Array.isArray(data.foundPins)
            ? data.foundPins.length
            : progress.foundPins.length;
      const summary = isEs
        ? data.summaryEs ||
          `Escaneo completado: ${syncedCount} pines detectados (${totalFound} totales en tu mapa).`
        : data.summaryEn ||
          `Scan complete: ${syncedCount} pins matched (${totalFound} total found on your map).`;

      setOcrResult({
        syncedCount,
        totalFound,
        method: data.method || "leonida-ocr",
        summary
      });

      notify("success", `📸 ${summary}`);
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Fallo el escaneo OCR."
            : "OCR progress scan failed."
      );
    } finally {
      setOcrBusy(false);
    }
  };

  // --- Section 4 Handlers: TOTP 2FA Enrollment, Verification & Unenroll ---
  const handleStartEnrollTotp = async () => {
    setMfaBusy(true);
    setLocalBanner(null);
    try {
      // 1. Downgrade any orphaned pre-ViceLink factors on accounts where mfa_enabled = false
      await fetch("/api/account/mfa-reset", { method: "POST" }).catch(() => null);

      const supabase = createClient();

      // 2. Unenroll all unverified TOTP factors so enrollment never collides
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverifiedTotpFactors = (existingFactors?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status !== "verified"
      );
      for (const factor of unverifiedTotpFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => null);
      }

      // 3. Enroll with a timestamp-suffixed friendlyName to guarantee zero collisions in GoTrue
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `ViceLink-${Date.now().toString().slice(-4)}`
      });

      if (error || !data) {
        throw new Error(
          error?.message ||
            (isEs
              ? "No se pudo iniciar el registro TOTP 2FA."
              : "Could not start TOTP 2FA enrollment.")
        );
      }

      setEnrollingFactorId(data.id);
      setEnrollQrCode(data.totp.qr_code);
      setEnrollSecret(data.totp.secret);
      setTotpConfirmCode("");
      setBackupCodes([]);
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al iniciar configuración 2FA."
            : "Failed to start 2FA setup."
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConfirmEnrollTotp = async (e: FormEvent) => {
    e.preventDefault();
    const targetFactorId = enrollingFactorId || verifiedFactorId;
    const cleanCode = totpConfirmCode.replace(/\D/g, "").slice(0, 6);
    if (!targetFactorId || cleanCode.length !== 6) {
      notify(
        "error",
        isEs
          ? "Ingresa el código de 6 dígitos de tu aplicación autenticadora."
          : "Enter the 6-digit code from your authenticator app."
      );
      return;
    }

    setMfaBusy(true);
    setLocalBanner(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: targetFactorId,
        code: cleanCode
      });

      if (error) {
        throw new Error(
          isEs
            ? "Código TOTP inválido. Verifica la hora de tu dispositivo e inténtalo de nuevo."
            : "Invalid TOTP code. Check your device clock and try again."
        );
      }

      const generatedCodes = generateTotpBackupCodes(
        enrollSecret || profile.verificationCode || profile.id,
        8
      );
      setBackupCodes(generatedCodes);
      setVerifiedFactorId(targetFactorId);
      setEnrollingFactorId(null);
      setCurrentAal("aal2");
      setTotpConfirmCode("");

      await onSaveProfile({ mfaEnabled: true });
      notify(
        "success",
        isEs
          ? "🔐 ¡2FA TOTP activado (Nivel AAL2)! Guarda tus 8 códigos de respaldo."
          : "🔐 TOTP 2FA activated (AAL2 Verified)! Save your 8 backup recovery codes below."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo verificar el código TOTP."
            : "Could not verify TOTP code."
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!verifiedFactorId && !profile.mfaEnabled) return;
    setMfaBusy(true);
    setLocalBanner(null);
    try {
      const supabase = createClient();
      if (verifiedFactorId) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
        if (error) {
          throw new Error(error.message);
        }
      }
      setVerifiedFactorId(null);
      setEnrollingFactorId(null);
      setEnrollQrCode(null);
      setEnrollSecret(null);
      setBackupCodes([]);
      setCurrentAal("aal1");

      await onSaveProfile({ mfaEnabled: false });
      notify(
        "info",
        isEs
          ? "Autenticación en dos pasos (2FA) desactivada."
          : "Two-factor authentication (2FA) has been disabled."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo desactivar 2FA."
            : "Could not disable 2FA."
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const handleCopySecret = async () => {
    if (!enrollSecret) return;
    try {
      await navigator.clipboard.writeText(enrollSecret);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleCopyBackupCodes = async () => {
    if (backupCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setBackupCopied(true);
      window.setTimeout(() => setBackupCopied(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const text = [
      "VICELINK // LEONIDA COMMAND HUB — TOTP 2FA BACKUP RECOVERY CODES",
      `Account: ${profile.email} (${profile.handle})`,
      `Generated: ${new Date().toISOString()}`,
      "----------------------------------------------------------------",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "----------------------------------------------------------------",
      "Keep these codes in a safe place. Each code can be used once."
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vicelink-2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // --- Inline Password Change & Global Sign Out ---
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setLocalBanner(null);

    if (newPassword.length < 8) {
      notify(
        "error",
        isEs
          ? "La nueva contraseña debe tener al menos 8 caracteres."
          : "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("error", isEs ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }

    setPwBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message);
      }
      setNewPassword("");
      setConfirmPassword("");
      notify(
        "success",
        isEs
          ? "✓ Contraseña actualizada correctamente."
          : "✓ Password updated successfully."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo actualizar la contraseña."
            : "Could not update password."
      );
    } finally {
      setPwBusy(false);
    }
  };

  const handleGlobalSignOut = async () => {
    setSigningOutGlobal(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" }).catch(() => null);
      await onSignOut();
    } finally {
      setSigningOutGlobal(false);
    }
  };

  // --- Section 5 Handler: Law 81 JSON Export ---
  const handleExportLaw81 = async () => {
    setExporting(true);
    setLocalBanner(null);
    try {
      const res = await fetch("/api/me/export");
      if (!res.ok) {
        throw new Error(
          isEs ? "Error al exportar tus datos." : "Could not export account data."
        );
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vicelink-law81-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      notify(
        "success",
        isEs
          ? "✓ Archivo vicelink-law81-export.json descargado."
          : "✓ Downloaded vicelink-law81-export.json."
      );
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Fallo la exportación de datos."
            : "Data export failed."
      );
    } finally {
      setExporting(false);
    }
  };

  const activePresetObj =
    AVATAR_PRESETS.find((p) => p.id === avatarPreset) || AVATAR_PRESETS[0];
  const isMfaActive = Boolean(verifiedFactorId) || profile.mfaEnabled;

  return (
    <section id="view-account" className="view active" aria-labelledby="account-view-heading">
      <div className="view-header">
        <div>
          <span className="brand-badge" style={{ marginBottom: 6 }}>
            {isEs
              ? "CENTRO DE MANDO DEL JUGADOR • ETAPA 9"
              : "PLAYER COMMAND PROFILE • STAGE 9"}
          </span>
          <h2 id="account-view-heading">
            {isEs
              ? "Perfil Táctico, Consolas, OCR y Bóveda 2FA"
              : "Player Command Profile, Console Link, OCR & 2FA Vault"}
          </h2>
          <p>
            {isEs
              ? "Gestiona tu identidad en Leonida, vincula PSN/Xbox con código de biografía, sincroniza capturas por IA y protege tu cuenta con TOTP 2FA."
              : "Manage your Leonida identity, verify PSN/Xbox via bio-code handshake, sync map screenshots with AI OCR, and lock your account with TOTP 2FA."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            className={`aal-badge ${currentAal === "aal2" && isMfaActive ? "verified" : "warn"}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 99,
              fontSize: 11.5,
              fontWeight: 800,
              background:
                currentAal === "aal2" && isMfaActive
                  ? "rgba(34, 197, 94, 0.16)"
                  : "rgba(250, 204, 21, 0.14)",
              border:
                currentAal === "aal2" && isMfaActive
                  ? "1px solid rgba(34, 197, 94, 0.5)"
                  : "1px solid rgba(250, 204, 21, 0.45)",
              color: currentAal === "aal2" && isMfaActive ? "#4ade80" : "#fde047"
            }}
          >
            {currentAal === "aal2" && isMfaActive
              ? isEs
                ? "🔐 2FA AAL2 VERIFICADO"
                : "🔐 AAL2 2FA VERIFIED"
              : isMfaActive
                ? isEs
                  ? "🛡️ 2FA ACTIVO (AAL1)"
                  : "🛡️ 2FA ENROLLED (AAL1)"
                : isEs
                  ? "⚠️ AAL1 • 2FA DISPONIBLE"
                  : "⚠️ AAL1 • 2FA AVAILABLE"}
          </span>

          <span className={`tier-chip tier-${profile.tier}`}>
            {isEs ? TIER_LABELS[profile.tier].es : TIER_LABELS[profile.tier].en}
          </span>
        </div>
      </div>

      {localBanner && (
        <div
          className={`auth-alert ${
            localBanner.kind === "error" ? "auth-alert-error" : "auth-alert-success"
          }`}
          role="status"
          style={{ marginBottom: 18 }}
        >
          {localBanner.text}
        </div>
      )}

      <div
        className="account-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
          gap: 18
        }}
      >
        {/* =====================================================================
            SECTION 1: Identity, Tier Pass & GTA VI Avatar Preset
           ===================================================================== */}
        <article className="admin-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "rgba(9, 13, 24, 0.9)",
                  border: `2px solid ${activePresetObj.accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  boxShadow: `0 0 18px ${activePresetObj.accent}33`
                }}
              >
                {activePresetObj.icon}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>
                  {isEs ? "1. Identidad, Pase y Avatar GTA VI" : "1. Identity, Tier Pass & GTA VI Avatar"}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {profile.email} •{" "}
                  <strong style={{ color: "var(--accent-cyan)" }}>{profile.handle}</strong>
                </p>
              </div>
            </div>

            {profile.tier !== "kingpin" && (
              <button
                type="button"
                className="copy-combo-btn"
                onClick={onOpenPricing}
                style={{ fontWeight: 800 }}
              >
                {isEs ? "⚡ Mejorar Pase Vitalicio" : "⚡ Upgrade Lifetime Pass"}
              </button>
            )}
          </div>

          {/* 6 Clickable GTA VI Avatar Presets */}
          <div>
            <span
              style={{
                display: "block",
                fontSize: 11.5,
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: 8
              }}
            >
              {isEs ? "Elige tu Avatar Táctico (6 Presets):" : "Choose Your Tactical Avatar (6 Presets):"}
            </span>
            <div
              className="avatar-preset-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8
              }}
            >
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`avatar-preset-btn ${isSelected ? "active" : ""}`}
                    onClick={() => void handleSelectAvatar(preset.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: isSelected ? "rgba(0, 229, 255, 0.14)" : "#090d18",
                      border: isSelected
                        ? `1px solid ${preset.accent}`
                        : "1px solid var(--border)",
                      color: isSelected ? "#ffffff" : "#cbd5e1",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{preset.icon}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isEs ? preset.labelEs : preset.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSaveIdentity}
            style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 4 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#cbd5e1" }}>
                <span>{isEs ? "@Usuario en el Foro" : "Community @Handle"}</span>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@VicePlayer"
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#cbd5e1" }}>
                <span>{isEs ? "Nombre Visible / Callsign" : "Display Name / Callsign"}</span>
                <input
                  type="text"
                  maxLength={60}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={isEs ? "Tu alias en Leonida" : "Your Leonida callsign"}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
                alignItems: "end"
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#cbd5e1" }}>
                <span>{isEs ? "Idioma Preferido (EN / ES)" : "Preferred Language (EN / ES)"}</span>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as Language)}
                >
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </label>

              <button type="submit" className="btn-pro" disabled={savingIdentity}>
                {savingIdentity
                  ? isEs
                    ? "Guardando..."
                    : "Saving..."
                  : isEs
                    ? "💾 Guardar Identidad"
                    : "💾 Save Identity"}
              </button>
            </div>

            {/* Marketing & Promotional Emails Opt-In Toggle */}
            <label
              className="flag-toggle-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: "#090d18",
                border: "1px solid var(--border)",
                cursor: "pointer",
                marginTop: 2
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 12.5, color: "#e2e8f0" }}>
                  📩{" "}
                  {isEs
                    ? "Correos Promocionales y Alertas Tácticas (Opt-In)"
                    : "Marketing & Promotional Emails Opt-In"}
                </strong>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {isEs
                    ? "Recibe códigos de descuento exclusivos, nuevas rutas de dinero y avisos de parches GTA VI."
                    : "Receive exclusive promo discount codes, new Leonida cash routes & GTA VI patch alerts."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => void handleToggleMarketingOptIn(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
              />
            </label>
          </form>

          {/* Cloud Progress Summary Pills */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              paddingTop: 10,
              borderTop: "1px solid rgba(255, 255, 255, 0.07)",
              fontSize: 11.5
            }}
          >
            <div style={{ background: "#090d18", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>
                {isEs ? "Pines Encontrados" : "Map Pins Found"}
              </span>
              <strong style={{ fontSize: 15, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>
                {progress.foundPins.length} / 32
              </strong>
            </div>
            <div style={{ background: "#090d18", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>
                {isEs ? "Trucos Completados" : "Cheats Unlocked"}
              </span>
              <strong style={{ fontSize: 15, color: "var(--accent-pink)", fontVariantNumeric: "tabular-nums" }}>
                {progress.unlockedCheats.length} / 19
              </strong>
            </div>
            <div style={{ background: "#090d18", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>
                {isEs ? "Trofeos Platino" : "Platinum Trophies"}
              </span>
              <strong style={{ fontSize: 15, color: "#facc15", fontVariantNumeric: "tabular-nums" }}>
                {(progress.unlockedTrophies ?? []).length} / 55
              </strong>
            </div>
          </div>
        </article>

        {/* =====================================================================
            SECTION 2: Console Account Linking & Bio-Code Handshake
           ===================================================================== */}
        <article className="admin-card">
          <div>
            <h3>
              {isEs
                ? "2. Vinculación de Consolas (PSN / Xbox / Social Club)"
                : "2. Console Account Linking & Bio-Code Handshake"}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              {isEs
                ? "Copia tu código único de verificación en la biografía de tu perfil PSN o Xbox y presiona Verificar para activar tu insignia oficial en el foro y tarjetas 9:16."
                : "Place your unique verification code in your PSN or Xbox profile bio and click Verify to unlock verified console badges on forum posts and 9:16 cards."}
            </p>
          </div>

          {/* Bio Verification Code Handshake Box */}
          <div
            className="bio-code-box"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              background: "rgba(0, 229, 255, 0.08)",
              border: "1px solid rgba(0, 229, 255, 0.35)",
              borderRadius: 11,
              padding: "11px 14px"
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                {isEs
                  ? "TU CÓDIGO DE BIOGRAFÍA (PSN / XBOX):"
                  : "YOUR BIO VERIFICATION HANDSHAKE CODE:"}
              </span>
              <code
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  color: "var(--accent-cyan)",
                  letterSpacing: 1.5,
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {verificationCode}
              </code>
            </div>

            <button
              type="button"
              className="copy-combo-btn"
              onClick={() => void handleCopyBioCode()}
            >
              {bioCodeCopied
                ? isEs
                  ? "✓ ¡Código Copiado!"
                  : "✓ Code Copied!"
                : isEs
                  ? "📋 Copiar Código"
                  : "📋 Copy Bio Code"}
            </button>
          </div>

          <div
            className="console-link-grid"
            style={{ display: "flex", flexDirection: "column", gap: 11 }}
          >
            {/* PlayStation Network (PS5) */}
            <div
              className="console-link-card"
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                borderRadius: 11,
                padding: "11px 13px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 12.5, color: "#93c5fd" }}>
                  🎮 PlayStation Network (PS5 ID)
                </strong>
                {profile.psnVerified ? (
                  <span
                    className="console-verified-pill"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(34, 197, 94, 0.16)",
                      border: "1px solid rgba(34, 197, 94, 0.45)",
                      color: "#4ade80"
                    }}
                  >
                    PSN ✓ {isEs ? "VERIFICADO" : "VERIFIED"}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {isEs ? "Sin verificar" : "Unverified"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  maxLength={24}
                  value={psnId}
                  onChange={(e) => setPsnId(e.target.value)}
                  placeholder="e.g. ViceKing_PS5"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={verifyingPlatform === "psn" || !psnId.trim()}
                  onClick={() => void handleVerifyConsole("psn")}
                  style={{ whiteSpace: "nowrap", borderColor: "rgba(96, 165, 250, 0.45)", color: "#93c5fd" }}
                >
                  {verifyingPlatform === "psn"
                    ? isEs
                      ? "Verificando..."
                      : "Verifying..."
                    : isEs
                      ? "✓ Verificar PSN"
                      : "✓ Verify PSN"}
                </button>
              </div>
            </div>

            {/* Xbox Series X|S Gamertag */}
            <div
              className="console-link-card"
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                borderRadius: 11,
                padding: "11px 13px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 12.5, color: "#86efac" }}>
                  🟢 Xbox Series X|S (Gamertag)
                </strong>
                {profile.xboxVerified ? (
                  <span
                    className="console-verified-pill"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(34, 197, 94, 0.16)",
                      border: "1px solid rgba(34, 197, 94, 0.45)",
                      color: "#4ade80"
                    }}
                  >
                    XBOX ✓ {isEs ? "VERIFICADO" : "VERIFIED"}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {isEs ? "Sin verificar" : "Unverified"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  maxLength={24}
                  value={xboxGamertag}
                  onChange={(e) => setXboxGamertag(e.target.value)}
                  placeholder="e.g. LeonidaWolf99"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={verifyingPlatform === "xbox" || !xboxGamertag.trim()}
                  onClick={() => void handleVerifyConsole("xbox")}
                  style={{ whiteSpace: "nowrap", borderColor: "rgba(74, 222, 128, 0.45)", color: "#86efac" }}
                >
                  {verifyingPlatform === "xbox"
                    ? isEs
                      ? "Verificando..."
                      : "Verifying..."
                    : isEs
                      ? "✓ Verificar Xbox"
                      : "✓ Verify Xbox"}
                </button>
              </div>
            </div>

            {/* Rockstar Social Club */}
            <div
              className="console-link-card"
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                borderRadius: 11,
                padding: "11px 13px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 12.5, color: "#fde047" }}>
                  ⭐ Rockstar Games Social Club
                </strong>
                {profile.socialClubHandle ? (
                  <span
                    className="console-verified-pill"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(250, 204, 21, 0.16)",
                      border: "1px solid rgba(250, 204, 21, 0.45)",
                      color: "#fde047"
                    }}
                  >
                    R★ {isEs ? "VINCULADO" : "LINKED"}
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  maxLength={24}
                  value={socialClubHandle}
                  onChange={(e) => setSocialClubHandle(e.target.value)}
                  placeholder="e.g. Lucia_Leonida"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={verifyingPlatform === "social_club" || !socialClubHandle.trim()}
                  onClick={() => void handleVerifyConsole("social_club")}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {verifyingPlatform === "social_club"
                    ? isEs
                      ? "Guardando..."
                      : "Saving..."
                    : isEs
                      ? "Vincular R★"
                      : "Link R★"}
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* =====================================================================
            SECTION 3: Smart Screenshot Progress OCR Sync
           ===================================================================== */}
        <article className="admin-card">
          <div>
            <h3>
              {isEs
                ? "3. Sincronización Inteligente de Progreso por Captura (OCR)"
                : "3. Smart Screenshot Progress OCR Sync"}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              {isEs
                ? "Sube una captura del mapa o trofeos de GTA VI (o compártela directo desde la app PS5 / Xbox sin contraseñas) para marcar automáticamente tus ubicaciones y trofeos."
                : "Upload or 1-tap Share a GTA VI map or trophy screenshot from your PS5 / Xbox app (zero credentials needed) to auto-sync discovered pins and trophies."}
            </p>
          </div>

          <div
            style={{
              background: "rgba(0, 229, 255, 0.07)",
              border: "1px solid rgba(0, 229, 255, 0.25)",
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 11.5,
              color: "#cbd5e1",
              lineHeight: 1.5
            }}
          >
            <strong style={{ color: "var(--accent-cyan)", display: "block", marginBottom: 3 }}>
              📱{" "}
              {isEs
                ? "Auto-Sincronización 1-Tap desde PlayStation App / Xbox App:"
                : "1-Tap PS5 / Xbox App Auto-Sync (PWA Share Target):"}
            </strong>
            {isEs
              ? "1) Instala ViceLink en tu teléfono (Agregar a Pantalla de Inicio) • 2) En PlayStation App o Xbox App abre tu captura reciente • 3) Toca Compartir → ViceLink y tu progreso se sincroniza en la nube al instante."
              : "1) Install ViceLink PWA on your phone • 2) Open your latest screenshot in the PlayStation App or Xbox App • 3) Tap Share → ViceLink to auto-check map pins & trophies cleanly."}
          </div>

          <label
            className="ocr-dropzone"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "18px 14px",
              borderRadius: 12,
              border: "1px dashed rgba(0, 229, 255, 0.45)",
              background: "rgba(9, 13, 24, 0.72)",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            <span style={{ fontSize: 24 }}>📸</span>
            <strong style={{ fontSize: 13, color: "#ffffff" }}>
              {ocrFileName
                ? `${isEs ? "Captura lista:" : "Screenshot ready:"} ${ocrFileName}`
                : isEs
                  ? "Haz clic para seleccionar captura PNG / JPG / WEBP (máx. 5 MB)"
                  : "Click to select PS5 / Xbox screenshot PNG / JPG / WEBP (max 5 MB)"}
            </strong>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              {isEs
                ? "Motor Gemini 2.5 Flash Vision + Detector Determinístico de Regiones de Leonida"
                : "Powered by Gemini 2.5 Flash Vision + Deterministic Leonida Region Matcher"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 8,
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={ocrNotes}
              onChange={(e) => setOcrNotes(e.target.value)}
              placeholder={
                isEs
                  ? "Regiones o notas opcionales (ej. Vice Beach, Little Cuba, Mount Kalaga...)"
                  : "Optional region hints (e.g. Vice Beach, Little Cuba, Mount Kalaga...)"
              }
            />
            <select
              value={ocrPlatform}
              onChange={(e) => setOcrPlatform(e.target.value as "ps5" | "xbox")}
              style={{ width: "auto" }}
            >
              <option value="ps5">PS5</option>
              <option value="xbox">Xbox</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-pro"
              style={{ flex: 1 }}
              disabled={ocrBusy || (!ocrImageBase64 && !ocrNotes.trim())}
              onClick={() => void runProgressOcrSync(false)}
            >
              {ocrBusy
                ? isEs
                  ? "Analizando captura..."
                  : "Scanning screenshot..."
                : isEs
                  ? "🔍 Escanear Captura y Sincronizar"
                  : "🔍 Scan Screenshot & Sync Pins"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              disabled={ocrBusy}
              onClick={() => void runProgressOcrSync(true)}
              style={{ borderColor: "rgba(0, 229, 255, 0.45)", color: "var(--accent-cyan)" }}
            >
              {isEs ? "⚡ Ejecutar Escaneo Demo Leonida" : "⚡ Run Demo Leonida Scan"}
            </button>
          </div>

          {ocrResult && (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                borderRadius: 11,
                padding: "11px 13px",
                fontSize: 12.5,
                color: "#bbf7d0",
                display: "flex",
                flexDirection: "column",
                gap: 4
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>
                  ✓ {isEs ? "Sincronización Completada" : "Progress Sync Complete"}
                </strong>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#86efac" }}>
                  {ocrResult.method}
                </span>
              </div>
              <p style={{ margin: 0, color: "#e2e8f0" }}>{ocrResult.summary}</p>
            </div>
          )}
        </article>

        {/* =====================================================================
            SECTION 4: Two-Step Authentication (2FA / TOTP), Password & Sessions
           ===================================================================== */}
        <article className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <h3>
                {isEs
                  ? "4. Bóveda 2FA (TOTP), Contraseña y Sesiones"
                  : "4. Two-Step Authentication (2FA / TOTP) & Security"}
              </h3>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                {isEs
                  ? "Protege tu cuenta y compras con códigos TOTP de 6 dígitos (Google Authenticator, Authy, 1Password)."
                  : "Protect your account and lifetime pass with 6-digit TOTP codes (Google Authenticator, Authy, 1Password)."}
              </p>
            </div>

            {!mfaLoading && (
              <span
                className={`aal-badge ${isMfaActive ? "verified" : "warn"}`}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: isMfaActive ? "rgba(34, 197, 94, 0.16)" : "rgba(244, 63, 94, 0.15)",
                  border: isMfaActive
                    ? "1px solid rgba(34, 197, 94, 0.45)"
                    : "1px solid rgba(244, 63, 94, 0.4)",
                  color: isMfaActive ? "#4ade80" : "#fda4af"
                }}
              >
                {isMfaActive
                  ? isEs
                    ? "✓ 2FA TOTP ACTIVO"
                    : "✓ TOTP 2FA ENABLED"
                  : isEs
                    ? "2FA DESACTIVADO"
                    : "2FA DISABLED"}
              </span>
            )}
          </div>

          {/* First-Time Co-Founder Super Admin QR Setup Auto-Banner */}
          {profile.isAdmin && !verifiedFactorId && (
            <div
              className="cofounder-2fa-banner"
              role="region"
              aria-label="Co-Founder Super Admin 2FA Setup"
              style={{
                background:
                  "linear-gradient(135deg, rgba(250, 204, 21, 0.14), rgba(0, 229, 255, 0.12))",
                border: "1px solid rgba(250, 204, 21, 0.55)",
                borderRadius: 12,
                padding: "13px 15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 0 22px rgba(250, 204, 21, 0.14)"
              }}
            >
              <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 13.5, color: "#fde047" }}>
                  {isEs
                    ? "🛡️ Co-Founder Super Admin Security: Configura tu código QR 2FA justo aquí"
                    : "🛡️ Co-Founder Super Admin Security: Set up your 2FA Authenticator QR Code right here"}
                </strong>
                <span style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.45 }}>
                  {isEs
                    ? `Bienvenido Co-Founder (${profile.email}). Haz clic para limpiar cualquier factor huérfano previo y generar tu nuevo código QR TOTP para Google Authenticator, Authy o 1Password.`
                    : `Welcome Co-Founder (${profile.email}). Click to clear any orphaned factors and generate your fresh TOTP QR code for Google Authenticator, Authy, or 1Password.`}
                </span>
              </div>
              {!enrollingFactorId && (
                <button
                  type="button"
                  className="btn-pro"
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                  disabled={mfaBusy}
                  onClick={() => void handleStartEnrollTotp()}
                >
                  {mfaBusy
                    ? isEs
                      ? "Generando QR..."
                      : "Generating QR..."
                    : isEs
                      ? "📲 Generar Código QR 2FA Ahora"
                      : "📲 Generate 2FA QR Code Now"}
                </button>
              )}
            </div>
          )}

          {/* TOTP Enrollment / Management Card */}
          {!isMfaActive && !enrollingFactorId ? (
            <div
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                borderRadius: 11,
                padding: "13px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10
              }}
            >
              <div style={{ fontSize: 12.5, color: "#cbd5e1", flex: 1, minWidth: 200 }}>
                {isEs
                  ? "Activa 2FA para generar tu código QR TOTP y 8 códigos de recuperación de emergencia."
                  : "Enable 2FA to generate your TOTP QR code and 8 emergency backup recovery codes."}
              </div>
              <button
                type="button"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={mfaBusy}
                onClick={() => void handleStartEnrollTotp()}
              >
                {mfaBusy
                  ? isEs
                    ? "Generando QR..."
                    : "Generating QR..."
                  : isEs
                    ? "🔐 Activar 2FA (TOTP)"
                    : "🔐 Enable 2FA (TOTP)"}
              </button>
            </div>
          ) : enrollingFactorId ? (
            <div
              style={{
                background: "#090d18",
                border: "1px solid rgba(0, 229, 255, 0.45)",
                borderRadius: 12,
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <div
                  className="totp-qr-box"
                  style={{
                    background: "#ffffff",
                    padding: 10,
                    borderRadius: 12,
                    width: 148,
                    height: 148,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <img
                    src={normalizeQrDataUrl(enrollQrCode, enrollSecret || undefined)}
                    alt="TOTP QR Code"
                    width={128}
                    height={128}
                    style={{ width: 128, height: 128, display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 210, display: "flex", flexDirection: "column", gap: 8 }}>
                  <strong style={{ fontSize: 13.5, color: "#ffffff" }}>
                    {isEs
                      ? "Paso 1: Escanea el código QR o copia la clave Base32"
                      : "Step 1: Scan the QR Code or copy the Base32 secret"}
                  </strong>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                    {isEs
                      ? "Abre Google Authenticator, Authy o 1Password, escanea la imagen y confirma el código de 6 dígitos abajo."
                      : "Open Google Authenticator, Authy, or 1Password, scan the QR image, and confirm the 6-digit code below."}
                  </p>
                  {enrollSecret && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <code
                        style={{
                          background: "#05070e",
                          border: "1px solid var(--border)",
                          padding: "5px 9px",
                          borderRadius: 7,
                          color: "var(--accent-cyan)",
                          fontSize: 11.5
                        }}
                      >
                        {enrollSecret}
                      </code>
                      <button
                        type="button"
                        className="copy-combo-btn"
                        onClick={() => void handleCopySecret()}
                      >
                        {secretCopied
                          ? isEs
                            ? "✓ Copiada"
                            : "✓ Copied"
                          : isEs
                            ? "📋 Copiar Clave"
                            : "📋 Copy Secret"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleConfirmEnrollTotp}
                style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={totpConfirmCode}
                  onChange={(e) => setTotpConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={isEs ? "Código de 6 dígitos (000000)" : "6-digit code (000000)"}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    fontFamily: "monospace",
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 4,
                    textAlign: "center"
                  }}
                />
                <button
                  type="submit"
                  className="btn-pro"
                  style={{ width: "auto" }}
                  disabled={mfaBusy || totpConfirmCode.length !== 6}
                >
                  {mfaBusy
                    ? isEs
                      ? "Verificando..."
                      : "Verifying..."
                    : isEs
                      ? "✓ Confirmar y Activar 2FA"
                      : "✓ Verify & Activate 2FA"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={mfaBusy}
                  onClick={() => {
                    setEnrollingFactorId(null);
                    setEnrollQrCode(null);
                    setEnrollSecret(null);
                  }}
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                background: "#090d18",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                borderRadius: 11,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12.5, color: "#bbf7d0" }}>
                  🔐{" "}
                  {isEs
                    ? "Tu cuenta está protegida con autenticación TOTP de 6 dígitos."
                    : "Your account is protected with 6-digit TOTP two-factor authentication."}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={mfaBusy}
                  onClick={() => void handleDisableTotp()}
                  style={{ borderColor: "rgba(244, 63, 94, 0.45)", color: "#fda4af", padding: "6px 11px", fontSize: 12 }}
                >
                  {mfaBusy
                    ? isEs
                      ? "Desactivando..."
                      : "Disabling..."
                    : isEs
                      ? "Desactivar 2FA"
                      : "Disable 2FA"}
                </button>
              </div>

              {currentAal !== "aal2" && verifiedFactorId && (
                <form
                  onSubmit={handleConfirmEnrollTotp}
                  style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totpConfirmCode}
                    onChange={(e) => setTotpConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={isEs ? "Código 6 dígitos para elevar a AAL2" : "Enter 6-digit code to step up to AAL2"}
                    style={{ flex: 1, fontFamily: "monospace" }}
                  />
                  <button
                    type="submit"
                    className="copy-combo-btn"
                    disabled={mfaBusy || totpConfirmCode.length !== 6}
                  >
                    {isEs ? "Elevar a AAL2" : "Verify AAL2"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 8 Backup Recovery Codes Box */}
          {backupCodes.length > 0 && (
            <div
              style={{
                background: "rgba(250, 204, 21, 0.08)",
                border: "1px solid rgba(250, 204, 21, 0.4)",
                borderRadius: 12,
                padding: "13px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontSize: 13, color: "#fde047" }}>
                  🗝️{" "}
                  {isEs
                    ? "8 Códigos de Recuperación de Emergencia (Guárdalos Ahora)"
                    : "8 Emergency Backup Recovery Codes (Save These Now)"}
                </strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="copy-combo-btn"
                    onClick={() => void handleCopyBackupCodes()}
                  >
                    {backupCopied
                      ? isEs
                        ? "✓ Copiados"
                        : "✓ Copied"
                      : isEs
                        ? "📋 Copiar"
                        : "📋 Copy All"}
                  </button>
                  <button
                    type="button"
                    className="copy-combo-btn"
                    onClick={handleDownloadBackupCodes}
                  >
                    {isEs ? "📥 Descargar .TXT" : "📥 Download .TXT"}
                  </button>
                </div>
              </div>

              <div
                className="backup-codes-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6
                }}
              >
                {backupCodes.map((code) => (
                  <code
                    key={code}
                    style={{
                      background: "#05070e",
                      border: "1px solid var(--border)",
                      padding: "6px 10px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#f8fafc",
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums"
                    }}
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Inline Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(255, 255, 255, 0.07)"
            }}
          >
            <strong style={{ fontSize: 13, color: "#ffffff" }}>
              🔑 {isEs ? "Cambiar Contraseña" : "Change Account Password"}
            </strong>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 10
              }}
            >
              <div className="auth-password-wrap" style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isEs ? "Nueva contraseña" : "New password"}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={isEs ? "Mostrar/Ocultar contraseña" : "Toggle password visibility"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="auth-password-wrap" style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isEs ? "Confirmar contraseña" : "Confirm password"}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={isEs ? "Mostrar/Ocultar confirmación" : "Toggle confirm password"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {newPassword.length > 0 && (
              <div
                className="auth-strength-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6
                }}
              >
                {pwEval.criteria.map((c) => (
                  <div
                    key={c.id}
                    className={`auth-strength-item ${c.met ? "met" : ""}`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.met ? "#4ade80" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <span>{c.met ? "✓" : "○"}</span>
                    <span>{isEs ? c.labelEs : c.labelEn}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
              <button
                type="submit"
                className="btn-secondary"
                disabled={pwBusy || !newPassword}
                style={{ borderColor: "rgba(0, 229, 255, 0.4)", color: "var(--accent-cyan)" }}
              >
                {pwBusy
                  ? isEs
                    ? "Actualizando..."
                    : "Updating..."
                  : isEs
                    ? "Actualizar Contraseña"
                    : "Update Password"}
              </button>

              <button
                type="button"
                className="btn-secondary"
                disabled={signingOutGlobal}
                onClick={() => void handleGlobalSignOut()}
                style={{ borderColor: "rgba(244, 63, 94, 0.45)", color: "#fda4af" }}
              >
                {signingOutGlobal
                  ? isEs
                    ? "Cerrando sesiones..."
                    : "Revoking sessions..."
                  : isEs
                    ? "🚪 Cerrar Sesión en Todos los Dispositivos"
                    : "🚪 Sign Out All Devices"}
              </button>
            </div>
          </form>
        </article>
      </div>

      {/* =====================================================================
          SECTION 5: Payment Receipts Ledger & Panama Law 81 Portability
         ===================================================================== */}
      <article className="admin-card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div>
            <h3>
              {isEs
                ? "5. Historial de Recibos Verificados y Portabilidad Ley 81 (Panamá)"
                : "5. Verified Payment Receipts Ledger & Panama Law 81 Data Portability"}
            </h3>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              {isEs
                ? "Consulta tus compras de pago único (Yappy Comercial y Tarjeta) y descarga una copia íntegra de tus datos personales en formato JSON."
                : "Review your one-time lifetime pass receipts (Yappy Comercial & Card) and download a full JSON archive of your account data under Panama Law 81."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={exporting}
              onClick={() => void handleExportLaw81()}
            >
              {exporting
                ? isEs
                  ? "Exportando..."
                  : "Exporting..."
                : isEs
                  ? "📥 Exportar Mis Datos (Ley 81 JSON)"
                  : "📥 Export My Data (Law 81 JSON)"}
            </button>

            {profile.tier !== "kingpin" && (
              <button
                type="button"
                className="btn-pro"
                style={{ width: "auto" }}
                onClick={onOpenPricing}
              >
                {isEs ? "⚡ Desbloquear Pase Vitalicio" : "⚡ Unlock Lifetime Pass"}
              </button>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="unlock-card-step" style={{ color: "#94a3b8" }}>
            {isEs
              ? "Aún no tienes pagos registrados en esta cuenta."
              : "No payment receipts recorded on this account yet."}
          </div>
        ) : (
          <div className="fence-table-wrap">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>{isEs ? "Fecha" : "Date"}</th>
                  <th>{isEs ? "Pasarela" : "Rail"}</th>
                  <th>{isEs ? "ID de Orden" : "Order ID"}</th>
                  <th>{isEs ? "Pase" : "Tier"}</th>
                  <th>{isEs ? "Monto" : "Amount"}</th>
                  <th>{isEs ? "Estado" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textTransform: "uppercase", fontWeight: 700 }}>{p.provider}</td>
                    <td>
                      <code>{p.providerOrderId}</code>
                    </td>
                    <td style={{ textTransform: "uppercase" }}>{p.tier}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      ${Number(p.amountUsd).toFixed(2)} {p.currency}
                    </td>
                    <td style={{ textTransform: "uppercase", fontWeight: 800 }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 10,
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            fontSize: 12,
            color: "var(--text-muted)"
          }}
        >
          <span>
            🇵🇦{" "}
            {isEs
              ? "Derechos ARCO y Portabilidad (Ley 81 de 2019 de la República de Panamá)."
              : "ARCO & Data Portability Rights (Panama Law 81 of 2019)."}
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/privacy" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
              {isEs ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <Link href="/terms" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
              {isEs ? "Términos" : "Terms"}
            </Link>
            <Link href="/refunds" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
              {isEs ? "Reembolsos" : "Refunds"}
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

export default AccountView;
