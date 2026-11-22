"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent
} from "react";
import type {
  AdminUserRecord,
  CheatCategory,
  CheatItem,
  CommunitySubmission,
  DirectionKey,
  GlitchCategory,
  GlitchItem,
  Language,
  MapPin,
  PaymentProvider,
  PinType,
  SubmissionStatus,
  UserTier
} from "@/types/vicelink";
import { ARROW_MAP, REGIONS } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";

export type AdminViewProps = {
  lang: Language;
  isAdmin: boolean;
  onAdminDataChanged: () => Promise<void> | void;
};

type AdminTab = "glitches_cheats" | "pins" | "submissions" | "users";

type OverviewPayload = {
  cheats: CheatItem[];
  glitches: GlitchItem[];
  dynamicPins: MapPin[];
  submissions: CommunitySubmission[];
};

const GLITCH_CAT_OPTIONS: GlitchCategory[] = ["Money", "Camera", "Stealth", "Physics"];
const CHEAT_CAT_OPTIONS: CheatCategory[] = ["Player", "Combat", "Vehicles", "World"];
const PIN_TYPE_OPTIONS: { value: PinType; icon: string; en: string; es: string }[] = [
  { value: "Money", icon: "💰", en: "Money Spot", es: "Zona de Dinero" },
  { value: "ATM", icon: "🏧", en: "Hackable ATM", es: "Cajero ATM" },
  { value: "RareCar", icon: "🏎️", en: "Rare Free Car", es: "Auto Raro Gratis" },
  { value: "Fence", icon: "🤝", en: "Fence Buyer", es: "Comprador Fence" },
  { value: "EasterEgg", icon: "🥚", en: "Easter Egg", es: "Easter Egg" },
  { value: "Collectible", icon: "🦩", en: "Collectible", es: "Coleccionable" }
];
const DIRECTION_KEYS: DirectionKey[] = ["UP", "DOWN", "LEFT", "RIGHT"];
const PROVIDER_OPTIONS: { value: PaymentProvider; label: string }[] = [
  { value: "yappy", label: "Yappy (Banco General)" },
  { value: "paguelofacil", label: "PagueloFacil" },
  { value: "tilopay", label: "Tilopay" },
  { value: "stripe", label: "Stripe" }
];

function formatDateTime(iso: string, isEs: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(isEs ? "es-PA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function AdminView({ lang, isAdmin, onAdminDataChanged }: AdminViewProps) {
  const isEs = lang === "es";

  const [activeTab, setActiveTab] = useState<AdminTab>("glitches_cheats");
  const [forbidden, setForbidden] = useState(!isAdmin);
  const [loading, setLoading] = useState(isAdmin);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [overview, setOverview] = useState<OverviewPayload>({
    cheats: [],
    glitches: [],
    dynamicPins: [],
    submissions: []
  });

  // Tab 1: Glitch & Cheat manager state
  const [togglingGlitchId, setTogglingGlitchId] = useState<string | null>(null);
  const [savingGlitch, setSavingGlitch] = useState(false);
  const [glitchId, setGlitchId] = useState("");
  const [glitchCategory, setGlitchCategory] = useState<GlitchCategory>("Money");
  const [glitchIsPatched, setGlitchIsPatched] = useState(false);
  const [glitchPatchStatus, setGlitchPatchStatus] = useState("WORKING ON PATCH 01.002.001");
  const [glitchTitleEn, setGlitchTitleEn] = useState("");
  const [glitchTitleEs, setGlitchTitleEs] = useState("");
  const [glitchStepsEn, setGlitchStepsEn] = useState("");
  const [glitchStepsEs, setGlitchStepsEs] = useState("");
  const [glitchWarningEn, setGlitchWarningEn] = useState("");
  const [glitchWarningEs, setGlitchWarningEs] = useState("");

  const [savingCheat, setSavingCheat] = useState(false);
  const [cheatId, setCheatId] = useState("");
  const [cheatTitleEn, setCheatTitleEn] = useState("");
  const [cheatTitleEs, setCheatTitleEs] = useState("");
  const [cheatCategory, setCheatCategory] = useState<CheatCategory>("Player");
  const [cheatUnlockEn, setCheatUnlockEn] = useState("");
  const [cheatUnlockEs, setCheatUnlockEs] = useState("");
  const [cheatHowEn, setCheatHowEn] = useState("");
  const [cheatHowEs, setCheatHowEs] = useState("");
  const [cheatDescEn, setCheatDescEn] = useState("");
  const [cheatDescEs, setCheatDescEs] = useState("");
  const [cheatSeq, setCheatSeq] = useState<DirectionKey[]>([]);

  // Tab 2: Map Pin Publisher state
  const [pinTier, setPinTier] = useState<UserTier>("street");
  const [pinType, setPinType] = useState<PinType>("Money");
  const [pinRegion, setPinRegion] = useState<string>(REGIONS[0] ?? "Vice City");
  const [pinIcon, setPinIcon] = useState("💰");
  const [pinX, setPinX] = useState<number>(68.5);
  const [pinY, setPinY] = useState<number>(42.0);
  const [pinNameEn, setPinNameEn] = useState("");
  const [pinNameEs, setPinNameEs] = useState("");
  const [pinNoteEn, setPinNoteEn] = useState("");
  const [pinNoteEs, setPinNoteEs] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null);

  // Tab 3: Submissions Moderation Queue state
  const [subFilter, setSubFilter] = useState<"all" | SubmissionStatus>("pending");
  const [adminNotesDraft, setAdminNotesDraft] = useState<Record<string, string>>({});
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  // Tab 4: Manual VIP Pass Granter state
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [grantTier, setGrantTier] = useState<UserTier>("street");
  const [grantProvider, setGrantProvider] = useState<PaymentProvider>("yappy");
  const [grantReference, setGrantReference] = useState("");
  const [grantingPass, setGrantingPass] = useState(false);

  const showBanner = useCallback((kind: "success" | "error", text: string) => {
    setBanner({ kind, text });
  }, []);

  const loadOverview = useCallback(async () => {
    if (!isAdmin) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "Error al cargar el panel de administración." : "Failed to load admin overview.")
        );
      }

      const nextOverview: OverviewPayload = {
        cheats: Array.isArray(data.cheats) ? (data.cheats as CheatItem[]) : [],
        glitches: Array.isArray(data.glitches) ? (data.glitches as GlitchItem[]) : [],
        dynamicPins: Array.isArray(data.dynamicPins) ? (data.dynamicPins as MapPin[]) : [],
        submissions: Array.isArray(data.submissions)
          ? (data.submissions as CommunitySubmission[])
          : []
      };
      setOverview(nextOverview);
      setAdminNotesDraft((prev) => {
        const merged = { ...prev };
        for (const s of nextOverview.submissions) {
          if (!(s.id in merged)) {
            merged[s.id] = s.adminNotes || "";
          }
        }
        return merged;
      });
      setForbidden(false);
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo cargar el panel admin."
            : "Could not load admin workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isEs, showBanner]);

  const searchUsers = useCallback(
    async (queryText: string) => {
      if (!isAdmin) return;
      setSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/admin/users?q=${encodeURIComponent(queryText.trim())}`,
          { cache: "no-store" }
        );
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              (isEs ? "Error al buscar usuarios." : "Could not search users.")
          );
        }
        const found = Array.isArray(data.users) ? (data.users as AdminUserRecord[]) : [];
        setUsers(found);
      } catch (err) {
        showBanner(
          "error",
          err instanceof Error
            ? err.message
            : isEs
              ? "No se pudo consultar la lista de usuarios."
              : "Failed to search user accounts."
        );
      } finally {
        setSearchingUsers(false);
      }
    },
    [isAdmin, isEs, showBanner]
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "users" && !forbidden && isAdmin && users.length === 0) {
      void searchUsers("");
    }
  }, [activeTab, forbidden, isAdmin, users.length, searchUsers]);

  // --- Tab 1 Handlers: Glitches & Cheats ---
  const handleToggleGlitchStatus = async (glitch: GlitchItem) => {
    setTogglingGlitchId(glitch.id);
    setBanner(null);
    const nextPatched = !Boolean(glitch.isPatched);
    try {
      const res = await fetch("/api/admin/glitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: glitch.id,
          category: glitch.category,
          isPatched: nextPatched,
          patchStatus: nextPatched ? "PATCHED" : "WORKING ON PATCH 01.002.001",
          titleEn: glitch.title.en,
          titleEs: glitch.title.es,
          stepsEn: glitch.steps.en,
          stepsEs: glitch.steps.es,
          warningEn: glitch.warning.en,
          warningEs: glitch.warning.es
        })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el estado del glitch." : "Failed to update glitch status.")
        );
      }
      showBanner(
        "success",
        nextPatched
          ? isEs
            ? `🔴 Glitch marcado como PARCHEADO: ${tField(glitch.title, lang)}`
            : `🔴 Glitch marked PATCHED: ${tField(glitch.title, lang)}`
          : isEs
            ? `🟢 Glitch marcado como ACTIVO: ${tField(glitch.title, lang)}`
            : `🟢 Glitch marked WORKING: ${tField(glitch.title, lang)}`
      );
      await loadOverview();
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al actualizar glitch." : "Glitch update failed."
      );
    } finally {
      setTogglingGlitchId(null);
    }
  };

  const populateGlitchForm = (g: GlitchItem) => {
    setGlitchId(g.id);
    setGlitchCategory(g.category);
    setGlitchIsPatched(Boolean(g.isPatched));
    setGlitchPatchStatus(g.status.en || "WORKING ON PATCH 01.002.001");
    setGlitchTitleEn(g.title.en);
    setGlitchTitleEs(g.title.es);
    setGlitchStepsEn((g.steps.en || []).join("\n"));
    setGlitchStepsEs((g.steps.es || []).join("\n"));
    setGlitchWarningEn(g.warning.en || "");
    setGlitchWarningEs(g.warning.es || "");
  };

  const resetGlitchForm = () => {
    setGlitchId("");
    setGlitchCategory("Money");
    setGlitchIsPatched(false);
    setGlitchPatchStatus("WORKING ON PATCH 01.002.001");
    setGlitchTitleEn("");
    setGlitchTitleEs("");
    setGlitchStepsEn("");
    setGlitchStepsEs("");
    setGlitchWarningEn("");
    setGlitchWarningEs("");
  };

  const handleSaveGlitch = async (e: FormEvent) => {
    e.preventDefault();
    if (!glitchTitleEn.trim()) {
      showBanner("error", isEs ? "Ingresa al menos el título en inglés." : "Title (EN) is required.");
      return;
    }
    setSavingGlitch(true);
    setBanner(null);
    try {
      const stepsEnArr = glitchStepsEn
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const stepsEsArr = glitchStepsEs
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/glitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: glitchId.trim() || undefined,
          category: glitchCategory,
          isPatched: glitchIsPatched,
          patchStatus: glitchPatchStatus.trim() || (glitchIsPatched ? "PATCHED" : "WORKING ON PATCH 01.002.001"),
          titleEn: glitchTitleEn.trim(),
          titleEs: glitchTitleEs.trim() || glitchTitleEn.trim(),
          stepsEn: stepsEnArr,
          stepsEs: stepsEsArr.length > 0 ? stepsEsArr : stepsEnArr,
          warningEn: glitchWarningEn.trim(),
          warningEs: glitchWarningEs.trim() || glitchWarningEn.trim()
        })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo guardar el glitch." : "Could not save glitch.")
        );
      }
      showBanner(
        "success",
        isEs
          ? "✓ Glitch publicado y sincronizado en vivo con el Hub."
          : "✓ Glitch saved and synced live to the Hub."
      );
      resetGlitchForm();
      await loadOverview();
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al guardar el glitch." : "Failed to save glitch."
      );
    } finally {
      setSavingGlitch(false);
    }
  };

  const populateCheatForm = (c: CheatItem) => {
    setCheatId(c.id);
    setCheatTitleEn(c.title.en);
    setCheatTitleEs(c.title.es);
    setCheatCategory(c.category);
    setCheatUnlockEn(c.unlock.en);
    setCheatUnlockEs(c.unlock.es);
    setCheatHowEn(c.howToUnlock.en);
    setCheatHowEs(c.howToUnlock.es);
    setCheatDescEn(c.desc.en);
    setCheatDescEs(c.desc.es);
    setCheatSeq([...c.seq]);
  };

  const resetCheatForm = () => {
    setCheatId("");
    setCheatTitleEn("");
    setCheatTitleEs("");
    setCheatCategory("Player");
    setCheatUnlockEn("");
    setCheatUnlockEs("");
    setCheatHowEn("");
    setCheatHowEs("");
    setCheatDescEn("");
    setCheatDescEs("");
    setCheatSeq([]);
  };

  const handleSaveCheat = async (e: FormEvent) => {
    e.preventDefault();
    if (!cheatTitleEn.trim()) {
      showBanner("error", isEs ? "El título del truco (EN) es obligatorio." : "Cheat title (EN) is required.");
      return;
    }
    setSavingCheat(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/cheats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cheatId.trim() || undefined,
          titleEn: cheatTitleEn.trim(),
          titleEs: cheatTitleEs.trim() || cheatTitleEn.trim(),
          category: cheatCategory,
          unlockEn: cheatUnlockEn.trim(),
          unlockEs: cheatUnlockEs.trim() || cheatUnlockEn.trim(),
          howToUnlockEn: cheatHowEn.trim(),
          howToUnlockEs: cheatHowEs.trim() || cheatHowEn.trim(),
          descEn: cheatDescEn.trim(),
          descEs: cheatDescEs.trim() || cheatDescEn.trim(),
          seq: cheatSeq
        })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo guardar el truco." : "Could not save cheat.")
        );
      }
      showBanner(
        "success",
        isEs
          ? "✓ Truco y secuencia D-Pad publicados en vivo."
          : "✓ Cheat code & D-Pad sequence published live."
      );
      resetCheatForm();
      await loadOverview();
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al publicar el truco." : "Failed to publish cheat."
      );
    } finally {
      setSavingCheat(false);
    }
  };

  // --- Tab 2 Handlers: Interactive Leonida Map Pin Publisher ---
  const handleRadarClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, Number(rawX.toFixed(1))));
    const clampedY = Math.max(0, Math.min(100, Number(rawY.toFixed(1))));
    setPinX(clampedX);
    setPinY(clampedY);
  };

  const handlePublishPin = async (e: FormEvent) => {
    e.preventDefault();
    if (!pinNameEn.trim()) {
      showBanner("error", isEs ? "Ingresa el nombre del pin (EN)." : "Pin name (EN) is required.");
      return;
    }
    setSavingPin(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: pinTier,
          type: pinType,
          region: pinRegion,
          icon: pinIcon.trim() || "📍",
          x: Number(pinX),
          y: Number(pinY),
          nameEn: pinNameEn.trim(),
          nameEs: pinNameEs.trim() || pinNameEn.trim(),
          noteEn: pinNoteEn.trim(),
          noteEs: pinNoteEs.trim() || pinNoteEn.trim()
        })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo publicar el pin." : "Failed to publish pin.")
        );
      }
      showBanner(
        "success",
        isEs
          ? `✓ Pin publicado en (${pinX}%, ${pinY}%) y sincronizado en el Mapa Táctico.`
          : `✓ Map pin published at (${pinX}%, ${pinY}%) and synced live to Tactical Map.`
      );
      setPinNameEn("");
      setPinNameEs("");
      setPinNoteEn("");
      setPinNoteEs("");
      await loadOverview();
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al publicar pin." : "Could not publish pin."
      );
    } finally {
      setSavingPin(false);
    }
  };

  const handleDeletePin = async (id: string) => {
    setDeletingPinId(id);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/pins?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo eliminar el pin." : "Could not delete pin.")
        );
      }
      showBanner(
        "success",
        isEs ? "✓ Pin dinámico eliminado del mapa." : "✓ Dynamic map pin deleted."
      );
      await loadOverview();
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al eliminar el pin." : "Delete failed."
      );
    } finally {
      setDeletingPinId(null);
    }
  };

  // --- Tab 3 Handlers: Submissions Moderation ---
  const handleModerateSubmission = async (
    subId: string,
    status: "approved" | "implemented" | "rejected"
  ) => {
    setUpdatingSubId(subId);
    setBanner(null);
    const adminNotes = (adminNotesDraft[subId] ?? "").trim();
    try {
      const res = await fetch(`/api/admin/submissions/${encodeURIComponent(subId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el envío." : "Could not update submission.")
        );
      }
      setOverview((prev) => ({
        ...prev,
        submissions: prev.submissions.map((item) =>
          item.id === subId
            ? { ...item, status: (data.status as SubmissionStatus) ?? status, adminNotes: data.adminNotes ?? adminNotes }
            : item
        )
      }));
      showBanner(
        "success",
        isEs
          ? `✓ Envío actualizado a "${status}".`
          : `✓ Submission updated to "${status}".`
      );
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al moderar envío." : "Moderation update failed."
      );
    } finally {
      setUpdatingSubId(null);
    }
  };

  // --- Tab 4 Handlers: Manual VIP Pass Granter ---
  const handleUserSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    void searchUsers(userQuery);
  };

  const handleGrantPass = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showBanner(
        "error",
        isEs
          ? "Selecciona primero un usuario de la lista."
          : "Please select a user account from the search results first."
      );
      return;
    }
    setGrantingPass(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/users/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          targetTier: grantTier,
          provider: grantProvider,
          reference: grantReference.trim() || undefined
        })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo otorgar el pase." : "Failed to grant VIP pass.")
        );
      }
      const selectedUser = users.find((u) => u.userId === selectedUserId);
      showBanner(
        "success",
        isEs
          ? `✓ Pase actualizado a ${(data.tier || grantTier).toUpperCase()} para ${selectedUser?.handle || selectedUserId}.`
          : `✓ Tier updated to ${(data.tier || grantTier).toUpperCase()} for ${selectedUser?.handle || selectedUserId}.`
      );
      setGrantReference("");
      await searchUsers(userQuery);
      await onAdminDataChanged();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al otorgar el pase." : "Pass grant failed."
      );
    } finally {
      setGrantingPass(false);
    }
  };

  const submissionCounts = useMemo(() => {
    const counts = { all: overview.submissions.length, pending: 0, approved: 0, implemented: 0, rejected: 0 };
    for (const s of overview.submissions) {
      if (s.status in counts) {
        counts[s.status] += 1;
      }
    }
    return counts;
  }, [overview.submissions]);

  const filteredSubmissions = useMemo(() => {
    if (subFilter === "all") return overview.submissions;
    return overview.submissions.filter((s) => s.status === subFilter);
  }, [overview.submissions, subFilter]);

  const selectedUserRecord = useMemo(
    () => users.find((u) => u.userId === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  // Graceful 403 / non-admin guard
  if (!isAdmin || forbidden) {
    return (
      <section id="view-admin" className="view active">
        <div className="paywall-box">
          <span className="status-patched">403 • {isEs ? "ACCESO DENEGADO" : "ACCESS DENIED"}</span>
          <h3 style={{ marginTop: 12 }}>
            🛡️ {isEs ? "Área Exclusiva de Administradores" : "Admin Command Center Restricted"}
          </h3>
          <p>
            {isEs
              ? "Tu cuenta no tiene permisos de administrador (is_admin). Todas las rutas administrativas están protegidas en el servidor con RBAC y Row-Level Security."
              : "Your account does not hold administrator privileges (is_admin). All admin API routes are strictly protected server-side via RBAC and Postgres RLS."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="view-admin" className="view active">
      <header className="view-header">
        <div>
          <span className="brand-badge">
            🛡️ {isEs ? "CENTRO DE COMANDO VICELINK" : "VICELINK ADMIN COMMAND CENTER"}
          </span>
          <h2 style={{ marginTop: 6 }}>
            {isEs ? "Panel de Administración en Vivo" : "Live CMS, Moderation & VIP Pass Manager"}
          </h2>
          <p>
            {isEs
              ? "Marca glitches parcheados, publica códigos D-Pad, coloca pines en Leonida, modera intel y aprueba pagos manuales Yappy."
              : "Toggle patched glitches, publish cracked D-Pad cheats, drop live Leonida map pins, moderate community intel, and grant manual Yappy VIP passes."}
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() => void loadOverview()}
        >
          {loading
            ? isEs
              ? "Sincronizando..."
              : "Syncing..."
            : isEs
              ? "↻ Recargar Datos"
              : "↻ Reload Overview"}
        </button>
      </header>

      {banner && (
        <div
          className={`auth-alert ${banner.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
          role={banner.kind === "error" ? "alert" : "status"}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 16
          }}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontWeight: 800,
              cursor: "pointer"
            }}
            aria-label={isEs ? "Cerrar aviso" : "Dismiss"}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Admin Tabs */}
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "glitches_cheats"}
          className={`admin-tab ${activeTab === "glitches_cheats" ? "active" : ""}`}
          onClick={() => setActiveTab("glitches_cheats")}
        >
          ⚡ {isEs ? "Glitches y Trucos" : "Glitches & Cheats"} ({overview.glitches.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pins"}
          className={`admin-tab ${activeTab === "pins" ? "active" : ""}`}
          onClick={() => setActiveTab("pins")}
        >
          🗺️ {isEs ? "Publicar Pines" : "Map Pin Publisher"} ({overview.dynamicPins.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "submissions"}
          className={`admin-tab ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          📥 {isEs ? "Cola de Intel" : "Intel & Feedback Queue"} ({submissionCounts.pending})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👑 {isEs ? "Pases VIP Manuales" : "Manual VIP Granter"}
        </button>
      </div>

      {/* =================================================================
          TAB 1: LIVE GLITCH & CHEAT MANAGER
         ================================================================= */}
      {activeTab === "glitches_cheats" && (
        <div className="admin-grid">
          {/* Glitch Status Live Toggle List */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span className="cat-tag">
                  {isEs ? "ESTADO EN VIVO (1 CLIC)" : "1-CLICK PATCH STATUS"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 4 }}>
                  ⚡ {isEs ? "Glitches Activos vs. Parcheados" : "Active vs. Patched Glitches"}
                </h3>
              </div>
              <button type="button" className="btn-secondary" onClick={resetGlitchForm}>
                + {isEs ? "Nuevo Glitch" : "New Glitch"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {overview.glitches.length === 0 ? (
                <p className="muted-sub">
                  {isEs ? "No hay glitches cargados todavía." : "No glitches loaded yet."}
                </p>
              ) : (
                overview.glitches.map((g) => {
                  const patched = Boolean(g.isPatched);
                  return (
                    <div
                      key={g.id}
                      className="admin-user-row"
                      style={{ flexWrap: "wrap", gap: 10 }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className={patched ? "status-patched" : "status-working"}>
                            ● {patched ? (isEs ? "PARCHEADO" : "PATCHED") : (isEs ? "ACTIVO" : "WORKING")}
                          </span>
                          <span className="cat-tag">{g.category}</span>
                        </div>
                        <strong style={{ display: "block", marginTop: 5, fontSize: 13.5 }}>
                          {tField(g.title, lang)}
                        </strong>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          ID: {g.id} • 👍 {g.votes}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={togglingGlitchId === g.id}
                          style={{
                            borderColor: patched ? "#22c55e" : "#f43f5e",
                            color: patched ? "#4ade80" : "#fda4af",
                            fontSize: 12,
                            padding: "7px 10px"
                          }}
                          onClick={() => void handleToggleGlitchStatus(g)}
                        >
                          {togglingGlitchId === g.id
                            ? "..."
                            : patched
                              ? isEs
                                ? "Marcar ACTIVO"
                                : "Mark WORKING"
                              : isEs
                                ? "Marcar PARCHEADO"
                                : "Mark PATCHED"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "7px 10px" }}
                          onClick={() => populateGlitchForm(g)}
                        >
                          ✏️ {isEs ? "Editar" : "Edit"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add / Edit Glitch Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleSaveGlitch}>
            <span className="cat-tag">
              {glitchId
                ? isEs
                  ? `EDITANDO GLITCH: ${glitchId}`
                  : `EDITING GLITCH: ${glitchId}`
                : isEs
                  ? "PUBLICAR NUEVO GLITCH"
                  : "ADD / EDIT GLITCH"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              {isEs ? "Editor de Glitch (EN / ES)" : "Glitch Editor (Bilingual EN / ES)"}
            </h3>

            <div className="composer-row">
              <input
                type="text"
                value={glitchId}
                onChange={(e) => setGlitchId(e.target.value)}
                placeholder={isEs ? "ID opcional (vacío = nuevo)" : "Optional ID (blank = new)"}
              />
              <select
                value={glitchCategory}
                onChange={(e) => setGlitchCategory(e.target.value as GlitchCategory)}
              >
                {GLITCH_CAT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="composer-row" style={{ alignItems: "center" }}>
              <input
                type="text"
                value={glitchPatchStatus}
                onChange={(e) => setGlitchPatchStatus(e.target.value)}
                placeholder="WORKING ON PATCH 01.002.001"
              />
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: glitchIsPatched ? "#fda4af" : "#86efac",
                  cursor: "pointer"
                }}
              >
                <input
                  type="checkbox"
                  checked={glitchIsPatched}
                  onChange={(e) => setGlitchIsPatched(e.target.checked)}
                />
                {isEs ? "Marcar como PATCHED" : "Mark as PATCHED"}
              </label>
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={glitchTitleEn}
                onChange={(e) => setGlitchTitleEn(e.target.value)}
                placeholder="Title (EN)"
              />
              <input
                type="text"
                value={glitchTitleEs}
                onChange={(e) => setGlitchTitleEs(e.target.value)}
                placeholder="Título (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={3}
                value={glitchStepsEn}
                onChange={(e) => setGlitchStepsEn(e.target.value)}
                placeholder={isEs ? "Pasos EN (uno por línea)" : "Steps EN (one step per line)"}
              />
              <textarea
                rows={3}
                value={glitchStepsEs}
                onChange={(e) => setGlitchStepsEs(e.target.value)}
                placeholder={isEs ? "Pasos ES (uno por línea)" : "Steps ES (one step per line)"}
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={glitchWarningEn}
                onChange={(e) => setGlitchWarningEn(e.target.value)}
                placeholder="Warning / Risk note (EN)"
              />
              <input
                type="text"
                value={glitchWarningEs}
                onChange={(e) => setGlitchWarningEs(e.target.value)}
                placeholder="Advertencia / Riesgo (ES)"
              />
            </div>

            <div className="composer-actions">
              {glitchId && (
                <button type="button" className="btn-secondary" onClick={resetGlitchForm}>
                  {isEs ? "Cancelar" : "Clear"}
                </button>
              )}
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingGlitch}
              >
                {savingGlitch
                  ? isEs
                    ? "Guardando..."
                    : "Saving..."
                  : isEs
                    ? "Guardar Glitch en Vivo"
                    : "Save Glitch Live"}
              </button>
            </div>
          </form>

          {/* Cheat Code + D-Pad Sequence Publisher */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleSaveCheat}>
            <span className="cat-tag">
              {cheatId
                ? isEs
                  ? `EDITANDO TRUCO: ${cheatId}`
                  : `EDITING CHEAT: ${cheatId}`
                : isEs
                  ? "PUBLICAR CÓDIGO DE TRUCO"
                  : "PUBLISH CRACKED CHEAT CODE"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              🎮 {isEs ? "Editor de Truco + Secuencia D-Pad" : "Cheat Code & D-Pad Sequence Publisher"}
            </h3>

            <div className="composer-row">
              <input
                type="text"
                value={cheatId}
                onChange={(e) => setCheatId(e.target.value)}
                placeholder={isEs ? "ID opcional (ej. money-250k)" : "Optional ID (e.g., money-250k)"}
              />
              <select
                value={cheatCategory}
                onChange={(e) => setCheatCategory(e.target.value as CheatCategory)}
              >
                {CHEAT_CAT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={cheatTitleEn}
                onChange={(e) => setCheatTitleEn(e.target.value)}
                placeholder="Cheat Title (EN)"
              />
              <input
                type="text"
                value={cheatTitleEs}
                onChange={(e) => setCheatTitleEs(e.target.value)}
                placeholder="Título del Truco (ES)"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={cheatUnlockEn}
                onChange={(e) => setCheatUnlockEn(e.target.value)}
                placeholder="Unlock Challenge (EN)"
              />
              <input
                type="text"
                value={cheatUnlockEs}
                onChange={(e) => setCheatUnlockEs(e.target.value)}
                placeholder="Desafío de Desbloqueo (ES)"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={cheatHowEn}
                onChange={(e) => setCheatHowEn(e.target.value)}
                placeholder="How to Unlock Guide (EN)"
              />
              <input
                type="text"
                value={cheatHowEs}
                onChange={(e) => setCheatHowEs(e.target.value)}
                placeholder="Cómo Desbloquearlo (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={2}
                value={cheatDescEn}
                onChange={(e) => setCheatDescEn(e.target.value)}
                placeholder="Effect Description (EN)"
              />
              <textarea
                rows={2}
                value={cheatDescEs}
                onChange={(e) => setCheatDescEs(e.target.value)}
                placeholder="Descripción del Efecto (ES)"
              />
            </div>

            {/* Interactive D-Pad Sequence Builder */}
            <div className="combo-visual-wrap">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent-cyan)" }}>
                  {isEs ? "CONSTRUCTOR DE SECUENCIA D-PAD" : "D-PAD SEQUENCE BUILDER"} ({cheatSeq.length})
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                    onClick={() => setCheatSeq((prev) => prev.slice(0, -1))}
                    disabled={cheatSeq.length === 0}
                  >
                    ⌫ {isEs ? "Borrar Último" : "Undo"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                    onClick={() => setCheatSeq([])}
                    disabled={cheatSeq.length === 0}
                  >
                    {isEs ? "Limpiar" : "Clear"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DIRECTION_KEYS.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    className="ctrl-key dpad"
                    style={{ cursor: "pointer" }}
                    onClick={() => setCheatSeq((prev) => (prev.length < 16 ? [...prev, dir] : prev))}
                  >
                    {ARROW_MAP[dir]}
                  </button>
                ))}
              </div>

              <div className="combo-keys-row" style={{ minHeight: 30 }}>
                {cheatSeq.length === 0 ? (
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {isEs
                      ? "Toca ↑ ↓ ← → arriba para armar la secuencia (déjalo vacío si sigue en búsqueda)."
                      : "Click ↑ ↓ ← → above to build the button combo (leave empty if combo is still pending)."}
                  </span>
                ) : (
                  cheatSeq.map((dir, idx) => (
                    <span key={`${dir}-${idx}`} className="ctrl-key dpad">
                      {ARROW_MAP[dir]}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="composer-actions">
              {cheatId && (
                <button type="button" className="btn-secondary" onClick={resetCheatForm}>
                  {isEs ? "Cancelar" : "Clear"}
                </button>
              )}
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingCheat}
              >
                {savingCheat
                  ? isEs
                    ? "Publicando..."
                    : "Publishing..."
                  : isEs
                    ? "Publicar Truco en Vivo"
                    : "Publish Cheat Live"}
              </button>
            </div>
          </form>

          {/* Existing Cheats Quick-Edit List */}
          <div className="admin-card">
            <span className="cat-tag">
              {isEs ? "TRUCOS PUBLICADOS" : "PUBLISHED CHEAT CODES"} ({overview.cheats.length})
            </span>
            <h3 style={{ fontSize: 17, marginTop: 4 }}>
              {isEs ? "Seleccionar para Editar o Añadir Combo" : "Quick-Select to Edit or Add Cracked Combo"}
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
                maxHeight: 420,
                overflowY: "auto"
              }}
            >
              {overview.cheats.map((c) => (
                <div key={c.id} className="admin-user-row">
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <strong style={{ fontSize: 13 }}>{tField(c.title, lang)}</strong>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {c.category} •{" "}
                      {c.seq.length > 0
                        ? c.seq.map((k) => ARROW_MAP[k]).join(" ")
                        : isEs
                          ? "Combo pendiente"
                          : "Combo pending"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11.5, padding: "6px 10px" }}
                    onClick={() => populateCheatForm(c)}
                  >
                    ✏️ {isEs ? "Editar" : "Edit"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 2: MAP PIN PUBLISHER (INTERACTIVE LEONIDA SVG RADAR PICKER)
         ================================================================= */}
      {activeTab === "pins" && (
        <div className="admin-grid">
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10
              }}
            >
              <div>
                <span className="cat-tag">
                  {isEs ? "RADAR INTERACTIVO DE LEONIDA" : "INTERACTIVE LEONIDA RADAR PICKER"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 3 }}>
                  🗺️ {isEs ? "Haz Clic en el Mapa para Fijar Coordenadas" : "Click Anywhere on Radar to Set Coordinates"}
                </h3>
              </div>
              <span className="verified-badge">
                X: {pinX}% • Y: {pinY}%
              </span>
            </div>

            <div
              className="admin-map-picker"
              onClick={handleRadarClick}
              role="button"
              tabIndex={0}
              aria-label={
                isEs
                  ? "Selector interactivo de coordenadas del mapa de Leonida"
                  : "Interactive Leonida map coordinate picker"
              }
            >
              <svg viewBox="0 0 900 680" className="leonida-svg" style={{ display: "block" }}>
                <defs>
                  <pattern id="adminGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#16223b" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="adminOceanGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#060b16" />
                    <stop offset="100%" stopColor="#091326" />
                  </linearGradient>
                  <linearGradient id="adminLandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18243d" />
                    <stop offset="60%" stopColor="#142036" />
                    <stop offset="100%" stopColor="#111b2e" />
                  </linearGradient>
                </defs>
                <rect width="900" height="680" fill="url(#adminOceanGrad)" />
                <rect width="900" height="680" fill="url(#adminGrid)" />
                <path
                  d="M165,30 L615,30 L685,210 L725,425 L675,525 L555,585 L370,635 L220,665 L205,645 L350,605 L465,550 L395,485 L295,455 L235,345 L145,255 L125,130 Z"
                  fill="rgba(0, 229, 255, 0.05)"
                />
                <path
                  d="M185,40 L595,40 L645,165 L675,310 L692,415 L665,485 L620,518 L555,535 L490,515 L440,468 L360,445 L290,415 L258,340 L215,318 L185,250 L160,150 Z"
                  fill="url(#adminLandGrad)"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
                <path
                  d="M706,335 L722,338 L715,438 L698,435 Z"
                  fill="#1b2947"
                  stroke="#ff2a85"
                  strokeWidth="1.5"
                />
                <path
                  d="M455,255 Q515,245 535,288 Q525,335 475,332 Q435,320 455,255 Z"
                  fill="#070d19"
                  stroke="#00e5ff"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
                <path
                  d="M565,535 Q485,585 375,615 Q290,635 225,650"
                  fill="none"
                  stroke="#ff2a85"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  strokeOpacity="0.75"
                />
                <text x="365" y="82" className="region-label">MOUNT KALAGA</text>
                <text x="245" y="245" className="region-label">PORT GELLHORN</text>
                <text x="490" y="232" className="region-label">AMBROSIA</text>
                <text x="615" y="378" className="region-label">VICE CITY</text>
                <text x="485" y="492" className="region-label">GRASSRIVERS</text>
                <text x="385" y="655" className="region-label">LEONIDA KEYS</text>
              </svg>

              {/* Existing Dynamic Pins */}
              {overview.dynamicPins.map((p) => (
                <span
                  key={p.id}
                  title={`${p.icon} ${tField(p.name, lang)} (${p.x}%, ${p.y}%)`}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: 13,
                    opacity: 0.72,
                    pointerEvents: "none"
                  }}
                >
                  {p.icon}
                </span>
              ))}

              {/* Active Clicked Preview Dot */}
              <div
                className="admin-map-dot"
                style={{ left: `${pinX}%`, top: `${pinY}%` }}
                title={`(${pinX}%, ${pinY}%)`}
              >
                {pinIcon}
              </div>
            </div>

            <p className="muted-sub" style={{ marginTop: 8 }}>
              {isEs
                ? "El punto brillante marca exactamente dónde aparecerá el nuevo pin en el Mapa Táctico."
                : "The glowing marker previews the exact location where your new pin will appear on the Tactical Map."}
            </p>
          </div>

          {/* New Pin Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handlePublishPin}>
            <span className="cat-tag">{isEs ? "PUBLICAR NUEVO PIN" : "PUBLISH DYNAMIC MAP PIN"}</span>
            <h3 style={{ fontSize: 17 }}>
              📍 {isEs ? "Detalles del Pin Táctico" : "Tactical Pin Details"}
            </h3>

            <div className="composer-row">
              <select
                value={pinType}
                onChange={(e) => {
                  const nextType = e.target.value as PinType;
                  setPinType(nextType);
                  const found = PIN_TYPE_OPTIONS.find((opt) => opt.value === nextType);
                  if (found) setPinIcon(found.icon);
                }}
              >
                {PIN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {isEs ? opt.es : opt.en}
                  </option>
                ))}
              </select>

              <select value={pinTier} onChange={(e) => setPinTier(e.target.value as UserTier)}>
                <option value="free">Free ($0)</option>
                <option value="street">Street Pass ($1.99)</option>
                <option value="kingpin">Kingpin VIP ($4.99)</option>
              </select>
            </div>

            <div className="composer-row">
              <select value={pinRegion} onChange={(e) => setPinRegion(e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                maxLength={8}
                value={pinIcon}
                onChange={(e) => setPinIcon(e.target.value)}
                placeholder="Icon (e.g. 💰)"
                style={{ maxWidth: 120 }}
              />
            </div>

            <div className="composer-row">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pinX}
                onChange={(e) => setPinX(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                placeholder="X %"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pinY}
                onChange={(e) => setPinY(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                placeholder="Y %"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={pinNameEn}
                onChange={(e) => setPinNameEn(e.target.value)}
                placeholder="Pin Name (EN)"
              />
              <input
                type="text"
                value={pinNameEs}
                onChange={(e) => setPinNameEs(e.target.value)}
                placeholder="Nombre del Pin (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={2}
                value={pinNoteEn}
                onChange={(e) => setPinNoteEn(e.target.value)}
                placeholder="Tactical Note / Loot Details (EN)"
              />
              <textarea
                rows={2}
                value={pinNoteEs}
                onChange={(e) => setPinNoteEs(e.target.value)}
                placeholder="Nota Táctica / Botín (ES)"
              />
            </div>

            <div className="composer-actions">
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingPin}
              >
                {savingPin
                  ? isEs
                    ? "Publicando..."
                    : "Publishing..."
                  : isEs
                    ? "Publicar Pin en el Mapa"
                    : "Publish Pin to Live Map"}
              </button>
            </div>

            {/* Dynamic Pins List with Delete */}
            <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span className="cat-tag">
                {isEs ? "PINES DINÁMICOS PUBLICADOS" : "CUSTOM DYNAMIC PINS"} ({overview.dynamicPins.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {overview.dynamicPins.length === 0 ? (
                  <p className="muted-sub">
                    {isEs
                      ? "Aún no has publicado pines dinámicos personalizados."
                      : "No custom dynamic pins published yet."}
                  </p>
                ) : (
                  overview.dynamicPins.map((p) => (
                    <div key={p.id} className="admin-user-row">
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <strong style={{ fontSize: 13 }}>
                          {p.icon} {tField(p.name, lang)}
                        </strong>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {p.region} • {p.type} • {p.tier.toUpperCase()} • ({p.x}%, {p.y}%)
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={deletingPinId === p.id}
                        style={{
                          borderColor: "rgba(244, 63, 94, 0.55)",
                          color: "#fda4af",
                          fontSize: 11.5,
                          padding: "6px 10px"
                        }}
                        onClick={() => void handleDeletePin(p.id)}
                      >
                        {deletingPinId === p.id
                          ? "..."
                          : isEs
                            ? "🗑️ Eliminar"
                            : "🗑️ Delete"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================
          TAB 3: COMMUNITY INTEL & FEEDBACK QUEUE
         ================================================================= */}
      {activeTab === "submissions" && (
        <div>
          <div className="map-layer-chips">
            {(
              [
                { id: "pending", en: `⏳ Pending (${submissionCounts.pending})`, es: `⏳ Pendientes (${submissionCounts.pending})` },
                { id: "approved", en: `✓ Approved (${submissionCounts.approved})`, es: `✓ Aprobados (${submissionCounts.approved})` },
                { id: "implemented", en: `🚀 Implemented (${submissionCounts.implemented})`, es: `🚀 Implementados (${submissionCounts.implemented})` },
                { id: "rejected", en: `✕ Rejected (${submissionCounts.rejected})`, es: `✕ Rechazados (${submissionCounts.rejected})` },
                { id: "all", en: `📋 All (${submissionCounts.all})`, es: `📋 Todos (${submissionCounts.all})` }
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`layer-chip ${subFilter === chip.id ? "active" : ""}`}
                onClick={() => setSubFilter(chip.id)}
              >
                {isEs ? chip.es : chip.en}
              </button>
            ))}
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="paywall-box" style={{ maxWidth: 480 }}>
              <h3>{isEs ? "Cola Limpia" : "Queue Is Clear"}</h3>
              <p>
                {isEs
                  ? "No hay envíos de la comunidad en este estado."
                  : "There are no community submissions matching this status filter."}
              </p>
            </div>
          ) : (
            <div className="forum-feed">
              {filteredSubmissions.map((sub) => (
                <div key={sub.id} className="admin-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        className={
                          sub.status === "approved"
                            ? "verified-badge"
                            : sub.status === "implemented"
                              ? "implemented-badge"
                              : sub.status === "rejected"
                                ? "status-patched"
                                : "submission-badge"
                        }
                      >
                        {sub.status.toUpperCase()}
                      </span>
                      <span className="submission-badge">{sub.submissionType}</span>
                      {sub.regionOrCategory && (
                        <span className="coord-pill">📍 {sub.regionOrCategory}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      <strong style={{ color: "var(--accent-cyan)" }}>{sub.authorHandle}</strong> • ▲{" "}
                      {sub.votes} • {formatDateTime(sub.createdAt, isEs)}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{sub.title}</h4>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#cbd5e1",
                      lineHeight: 1.5,
                      marginTop: 6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}
                  >
                    {sub.details}
                  </p>

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <label
                      htmlFor={`admin-note-${sub.id}`}
                      style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}
                    >
                      {isEs
                        ? "Nota Pública del Equipo ViceLink (visible para el jugador)"
                        : "ViceLink Admin Notes (shown on card)"}
                    </label>
                    <input
                      id={`admin-note-${sub.id}`}
                      type="text"
                      className="auth-input"
                      value={adminNotesDraft[sub.id] ?? sub.adminNotes ?? ""}
                      onChange={(e) =>
                        setAdminNotesDraft((prev) => ({ ...prev, [sub.id]: e.target.value }))
                      }
                      placeholder={
                        isEs
                          ? "ej., ¡Verificado en el parche 01.002.001 y añadido al mapa!"
                          : "e.g., Verified on Patch 01.002.001 and added to the Tactical Map!"
                      }
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={updatingSubId === sub.id}
                      style={{ borderColor: "#22c55e", color: "#4ade80" }}
                      onClick={() => void handleModerateSubmission(sub.id, "approved")}
                    >
                      ✓ {isEs ? "Aprobar" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={updatingSubId === sub.id}
                      style={{ borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
                      onClick={() => void handleModerateSubmission(sub.id, "implemented")}
                    >
                      🚀 {isEs ? "Marcar Implementado" : "Mark Implemented"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={updatingSubId === sub.id}
                      style={{ borderColor: "#f43f5e", color: "#fda4af" }}
                      onClick={() => void handleModerateSubmission(sub.id, "rejected")}
                    >
                      ✕ {isEs ? "Rechazar" : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 4: MANUAL VIP PASS GRANTER (YAPPY / PAGUELOFACIL / TILOPAY / STRIPE)
         ================================================================= */}
      {activeTab === "users" && (
        <div className="admin-grid">
          <div className="admin-card">
            <span className="cat-tag">
              {isEs ? "DIRECTORIO DE CUENTAS" : "USER ACCOUNT DIRECTORY"}
            </span>
            <h3 style={{ fontSize: 17, marginTop: 4 }}>
              🔎 {isEs ? "Buscar por @usuario o Correo" : "Search Users by @username or Email"}
            </h3>

            <form
              onSubmit={handleUserSearchSubmit}
              className="controls-bar"
              style={{ marginTop: 12, marginBottom: 12 }}
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={isEs ? "Buscar @usuario o correo..." : "Search @handle or email..."}
              />
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={searchingUsers}
              >
                {searchingUsers
                  ? isEs
                    ? "Buscando..."
                    : "Searching..."
                  : isEs
                    ? "Buscar"
                    : "Search"}
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
              {users.length === 0 ? (
                <p className="muted-sub">
                  {searchingUsers
                    ? isEs
                      ? "Consultando usuarios..."
                      : "Loading users..."
                    : isEs
                      ? "Sin resultados. Intenta buscar por correo o @handle."
                      : "No matching accounts. Try searching by email or @handle."}
                </p>
              ) : (
                users.map((u) => {
                  const selected = u.userId === selectedUserId;
                  return (
                    <div
                      key={u.userId}
                      className="admin-user-row"
                      style={
                        selected
                          ? { borderColor: "var(--accent-cyan)", background: "rgba(0, 229, 255, 0.08)" }
                          : undefined
                      }
                    >
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <strong style={{ color: "var(--accent-cyan)", fontSize: 13 }}>
                            {u.handle}
                          </strong>
                          <span className={`tier-chip tier-${u.tier}`}>
                            {u.tier.toUpperCase()}
                          </span>
                          {u.isAdmin && <span className="verified-badge">ADMIN</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                          {u.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={selected ? "btn-pro" : "btn-secondary"}
                        style={{ width: "auto", fontSize: 11.5, padding: "6px 10px" }}
                        onClick={() => {
                          setSelectedUserId(u.userId);
                          setGrantTier(u.tier === "free" ? "street" : u.tier);
                        }}
                      >
                        {selected
                          ? isEs
                            ? "✓ Seleccionado"
                            : "✓ Selected"
                          : isEs
                            ? "Seleccionar"
                            : "Select"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grant Pass Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleGrantPass}>
            <span className="cat-tag">
              {isEs ? "OTORGAR PASE DE POR VIDA" : "MANUAL VIP PASS GRANTER"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              👑 {isEs ? "Aprobar Pago Manual / Yappy QR" : "Grant Pass / Approve Yappy Receipt"}
            </h3>

            {selectedUserRecord ? (
              <div className="unlock-pill">
                <strong>{selectedUserRecord.handle}</strong> ({selectedUserRecord.email}) —{" "}
                {isEs ? "Nivel actual:" : "Current tier:"}{" "}
                <strong>{selectedUserRecord.tier.toUpperCase()}</strong>
              </div>
            ) : (
              <p className="muted-sub">
                {isEs
                  ? "Selecciona una cuenta a la izquierda para cambiar su nivel de acceso y registrar la referencia de pago."
                  : "Select a user account on the left to update their lifetime tier and log an optional receipt reference."}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-tier" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Nivel de Pase Objetivo" : "Target Access Tier"}
              </label>
              <select
                id="grant-tier"
                value={grantTier}
                onChange={(e) => setGrantTier(e.target.value as UserTier)}
              >
                <option value="free">Free Recruit ($0)</option>
                <option value="street">Street Pass ($1.99 One-Time)</option>
                <option value="kingpin">Kingpin VIP ($4.99 One-Time)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-provider" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Método de Pago" : "Payment Provider"}
              </label>
              <select
                id="grant-provider"
                value={grantProvider}
                onChange={(e) => setGrantProvider(e.target.value as PaymentProvider)}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-ref" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs
                  ? "Referencia de Recibo / Comprobante (Opcional)"
                  : "Receipt / Reference Number (Optional)"}
              </label>
              <input
                id="grant-ref"
                type="text"
                maxLength={100}
                value={grantReference}
                onChange={(e) => setGrantReference(e.target.value)}
                placeholder={isEs ? "ej., YAPPY-QR-984321" : "e.g., YAPPY-QR-984321"}
              />
            </div>

            <div className="composer-actions">
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={!selectedUserId || grantingPass}
              >
                {grantingPass
                  ? isEs
                    ? "Aplicando Pase..."
                    : "Granting Pass..."
                  : isEs
                    ? "Otorgar Pase Ahora ➤"
                    : "Grant Pass Now ➤"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default AdminView;
