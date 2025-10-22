// src/EcrireResultat.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  ArrowLeft,
  Folder as FolderIcon,
  ChevronRight,
  ScrollText,
  Trophy,
  Target,
  Lock,
  Check,
  X,
  Sparkles,
  Zap,
} from "lucide-react";

/** Visuel de la machine (image ou vidéo) */
const MACHINE_BG =
  "https://aswhubzprehjnunbpkwc.supabase.co/storage/v1/object/public/background/machine%20a%20codes.mp4";

/* ===========================
   Types
   =========================== */
type EleveProps = {
  uuid?: string | null;
  code: string;
  display_name?: string | null;
  teacher_id?: string | null;
  group_id?: string | null;
};

type BaseFolder = {
  id: string;
  name?: string | null;
  parent_folder_id?: string | null;
  nom?: string | null;
  parent_id?: string | null;
  description?: string | null;
  ordre?: number | null;
  __source?: "parcours_folders" | "folders";
};

type ParcoursRow = {
  id: string;
  nom: string | null;
  description: string | null;
  folder_id?: string | null;
  balises_ordre: string[] | null;
  ordre?: number | null;
};

type BaliseRow = { id: string; code: string | null; numero_balise: number | null; points?: number | null };

type AttemptInfo = {
  attempts: number;
  last_score: number;
  last_total: number;
  last_answers?: Record<string, string> | null;
  updated_at?: string | null;
};

/* ===========================
   Utils
   =========================== */
const ROOT_KEY = "__ROOT__";

const norm = (s: string) =>
  (s ?? "").toString().trim().replace(/\s+/g, "").replace(/[-_]/g, "").toUpperCase();

const titleOfFolder = (f: BaseFolder) => f?.name ?? f?.nom ?? "Dossier";
const descOfFolder = (f: BaseFolder) => f?.description ?? "";

const byOrdreThenName = <T extends { ordre?: number | null }>(a: T & any, b: T & any) => {
  const oa = a.ordre ?? 0;
  const ob = b.ordre ?? 0;
  if (oa !== ob) return oa - ob;
  const na = (a.nom ?? a.name ?? "").toString().toLowerCase();
  const nb = (b.nom ?? b.name ?? "").toString().toLowerCase();
  return na.localeCompare(nb);
};

const perfGradient = (n: number, d: number) => {
  const p = d > 0 ? (n / d) * 100 : 0;
  if (p >= 90) return "from-lime-300 to-emerald-600";
  if (p >= 75) return "from-cyan-300 to-sky-600";
  if (p >= 60) return "from-amber-300 to-orange-600";
  return "from-rose-300 to-red-600";
};

/* ===========================
   Composant principal
   =========================== */
const EcrireResultat: React.FC<{ setPage: (p: string) => void; eleveConnecte: EleveProps }> = ({
  setPage,
  eleveConnecte,
}) => {
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);

  // Navigation dossiers / parcours
  const [path, setPath] = useState<BaseFolder[]>([]);
  const currentFolder = path[path.length - 1] || null;

  const [selectedParcours, setSelectedParcours] = useState<ParcoursRow | null>(null);
  const [rootFolders, setRootFolders] = useState<BaseFolder[]>([]);
  const [childrenByFolder, setChildrenByFolder] = useState<Record<string, BaseFolder[]>>({});
  const [childrenLoading, setChildrenLoading] = useState<Record<string, boolean>>({});

  const [parcoursByFolder, setParcoursByFolder] = useState<Record<string, ParcoursRow[]>>({});
  const [parcoursLoading, setParcoursLoading] = useState<Record<string, boolean>>({});

  const [balisesByParcours, setBalisesByParcours] = useState<Record<string, BaliseRow[]>>({});
  const [balisesLoading, setBalisesLoading] = useState<Record<string, boolean>>({});

  const [answersByParcours, setAnswersByParcours] = useState<Record<string, Record<string, string>>>({});
  const [resultsByParcours, setResultsByParcours] = useState<Record<string, Record<string, boolean>>>({});
  const [lockedByParcours, setLockedByParcours] = useState<Record<string, string[]>>({});
  const [attemptsMap, setAttemptsMap] = useState<Record<string, AttemptInfo>>({});
  const [savingByParcours, setSavingByParcours] = useState<Record<string, boolean>>({});
  const [validationAlert, setValidationAlert] = useState<Record<string, string | null>>({});

  /* -------- Data loaders -------- */

  // Charge les parcours d'un dossier via RPC (SECURITY DEFINER)
  const loadParcoursFor = async (folder: BaseFolder, force = false) => {
    const folderId = folder.id;
    if (!force && parcoursByFolder[folderId]) return;

    setParcoursLoading((s) => ({ ...s, [folderId]: true }));
    try {
      const rpc = await supabase.rpc("get_parcours_for_student_folder", {
        p_code: eleveConnecte.code,
        p_folder_id: folderId,
      });
      const rows: ParcoursRow[] = ((rpc.data as any[]) || []).slice().sort(byOrdreThenName);
      setParcoursByFolder((s) => ({ ...s, [folderId]: rows }));
    } catch {
      setParcoursByFolder((s) => ({ ...s, [folderId]: [] }));
    } finally {
      setParcoursLoading((s) => ({ ...s, [folderId]: false }));
    }
  };

  const loadChildrenFor = async (folder: BaseFolder) => {
    const id = folder.id;
    if (childrenByFolder[id]) return;

    setChildrenLoading((s) => ({ ...s, [id]: true }));
    try {
      const { data, error } = await supabase.rpc("get_folders_for_student", {
        p_code: eleveConnecte.code,
        p_parent: id,
      });
      if (error) throw error;

      const children: BaseFolder[] = ((data as any[]) || []).map((r) => ({
        ...r,
        __source: "parcours_folders" as const,
      }));
      children.sort(byOrdreThenName);
      setChildrenByFolder((s) => ({ ...s, [id]: children }));
    } catch {
      setChildrenByFolder((s) => ({ ...s, [id]: [] }));
    } finally {
      setChildrenLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // ✅ Parcours au niveau racine (folder_id NULL) via RPC uniquement
  const loadRootParcours = async () => {
    if (parcoursByFolder[ROOT_KEY]) return;
    setParcoursLoading((s) => ({ ...s, [ROOT_KEY]: true }));
    try {
      const rpc = await supabase.rpc("get_parcours_for_student_folder", {
        p_code: eleveConnecte.code,
        p_folder_id: null,
      });
      const rows: ParcoursRow[] = ((rpc.data as any[]) || []).slice().sort(byOrdreThenName);
      setParcoursByFolder((s) => ({ ...s, [ROOT_KEY]: rows }));
    } catch {
      setParcoursByFolder((s) => ({ ...s, [ROOT_KEY]: [] }));
    } finally {
      setParcoursLoading((s) => ({ ...s, [ROOT_KEY]: false }));
    }
  };

  /* -------- Chargement initial -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setRpcError(null);
      try {
        // Dossiers racine
        const { data: fData, error: fErr } = await supabase.rpc("get_folders_for_student", {
          p_code: eleveConnecte.code,
          p_parent: null,
        });
        if (fErr) throw new Error(`get_folders_for_student: ${fErr.message}`);
        const rows: BaseFolder[] = ((fData as any[]) || []).map((r) => ({
          ...r,
          __source: "parcours_folders" as const,
        }));
        if (!cancelled) setRootFolders(rows.sort(byOrdreThenName));

        // Tentatives existantes
        const { data: aData, error: aErr } = await supabase.rpc("get_attempts_for_student", {
          p_student_code: eleveConnecte.code,
        });
        if (aErr) throw aErr;

        if (!cancelled && Array.isArray(aData)) {
          const map: Record<string, AttemptInfo> = {};
          for (const r of aData as any[]) {
            map[r.parcours_id] = {
              attempts: r.attempts ?? 0,
              last_score: r.last_score ?? 0,
              last_total: r.last_total ?? 0,
              last_answers: r.last_answers ?? null,
              updated_at: r.updated_at ?? null,
            };
          }
          setAttemptsMap(map);
        }

        // ✅ Parcours affichés directement à l'accueil
        await loadRootParcours();
      } catch (e: any) {
        if (!cancelled) {
          setRpcError(e?.message ?? "Erreur inconnue.");
          setRootFolders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eleveConnecte.code]);

  /* -------- Navigation -------- */
  const openFolder = async (folder: BaseFolder) => {
    setSelectedParcours(null);
    setPath((p) => [...p, folder]);
    await Promise.all([loadChildrenFor(folder), loadParcoursFor(folder)]);
  };
  const goBack = () => {
    setSelectedParcours(null);
    setPath((p) => p.slice(0, -1));
  };

  /* -------- Parcours -------- */
  const openParcours = async (p: ParcoursRow) => {
    setSelectedParcours(p);
    const id = p.id;
    if (!balisesByParcours[id]) {
      setBalisesLoading((s) => ({ ...s, [id]: true }));
      const { data, error } = await supabase.rpc("get_balises_for_student_parcours", {
        p_code: eleveConnecte.code,
        p_parcours_id: id,
      });
      if (!error) {
        const list: BaliseRow[] = ((data as any[]) || [])
          .slice()
          .sort((a, b) => (a.numero_balise ?? 0) - (b.numero_balise ?? 0));
        setBalisesByParcours((s) => ({ ...s, [id]: list }));
        setAnswersByParcours((s) => (s[id] ? s : { ...s, [id]: Object.fromEntries(list.map((b) => [b.id, ""])) }));

        const attempt = attemptsMap[id];
        const locked = new Set<string>();
        if (attempt?.last_answers) {
          for (const b of list) {
            const prev = attempt.last_answers[b.id];
            if (prev && norm(prev) === norm(b.code || "")) locked.add(b.id);
          }
        }
        if (locked.size > 0) setLockedByParcours((s) => ({ ...s, [id]: Array.from(locked) }));
      }
      setBalisesLoading((s) => ({ ...s, [id]: false }));
    }
  };

  const setAnswer = (pid: string, bid: string, v: string) => {
    if ((lockedByParcours[pid] || []).includes(bid)) return;
    setAnswersByParcours((s) => ({ ...s, [pid]: { ...(s[pid] || {}), [bid]: v } }));
    setResultsByParcours((s) => {
      const prev = { ...(s[pid] || {}) };
      delete prev[bid];
      return { ...s, [pid]: prev };
    });
  };

  const validateParcours = async (p: ParcoursRow) => {
    const pid = p.id;
    if (savingByParcours[pid]) return;
    const balises = balisesByParcours[pid] || [];
    if (balises.length === 0) return;

    // Pré-contrôle
    const currentLocked = new Set(lockedByParcours[pid] || []);
    const inputAnswers = answersByParcours[pid] || {};
    const unfilled = balises.filter((b) => !currentLocked.has(b.id) && !(inputAnswers[b.id] || "").trim());
    if (unfilled.length > 0) {
      setValidationAlert((s) => ({
        ...s,
        [pid]: "❌ Remplis tous les codes avant de valider.",
      }));
      return;
    }
    setValidationAlert((s) => ({ ...s, [pid]: null }));

    if (!window.confirm("Valider tes runes ?")) return;

    setSavingByParcours((s) => ({ ...s, [pid]: true }));

    const newResults: Record<string, boolean> = {};
    const newLocked = new Set(currentLocked);

    for (const b of balises) {
      if (currentLocked.has(b.id)) {
        newResults[b.id] = true;
        continue;
      }
      const ok = norm(inputAnswers[b.id] || "") === norm(b.code || "");
      newResults[b.id] = ok;
      if (ok) newLocked.add(b.id);
    }

    setResultsByParcours((s) => ({ ...s, [pid]: newResults }));
    setLockedByParcours((s) => ({ ...s, [pid]: Array.from(newLocked) }));
    setAnswersByParcours((s) => {
      const next = { ...(s[pid] || {}) };
      for (const b of balises) if (newLocked.has(b.id)) next[b.id] = "";
      return { ...s, [pid]: next };
    });

    const lockedAnswers: Record<string, string> = {};
    for (const b of balises) if (newLocked.has(b.id)) lockedAnswers[b.id] = b.code || "";

    const lockedCount = newLocked.size;
    const total = balises.length;

    const prevAttempts = attemptsMap[pid]?.attempts ?? 0;

    // ✅ Enregistrement via RPC SECURITY DEFINER (pas d'upsert direct → pas de RLS)
    const { data: upData, error: upErr } = await supabase.rpc("record_parcours_attempt", {
      p_student_code: eleveConnecte.code,
      p_parcours_id: pid,
      p_attempts: prevAttempts + 1,
      p_last_score: lockedCount,
      p_last_total: total,
      p_last_answers: lockedAnswers,
    });

    if (upErr) {
      alert(`Enregistrement impossible : ${upErr.message}`);
      setSavingByParcours((s) => ({ ...s, [pid]: false }));
      return;
    }

    const updated = Array.isArray(upData) ? upData[0] : null;

    setAttemptsMap((s) => ({
      ...s,
      [pid]: {
        attempts: updated?.attempts ?? prevAttempts + 1,
        last_score: updated?.last_score ?? lockedCount,
        last_total: updated?.last_total ?? total,
        last_answers: updated?.last_answers ?? lockedAnswers,
        updated_at: updated?.updated_at ?? new Date().toISOString(),
      },
    }));

    setSavingByParcours((s) => ({ ...s, [pid]: false }));
  };

  /* -------- Helpers UI -------- */
  const percentOf = (pid: string) => {
    const a = attemptsMap[pid];
    return a?.last_total ? Math.round((a.last_score / a.last_total) * 100) : 0;
    };

  /* -------- Présentations UI -------- */
  const FolderPlaquette: React.FC<{ folder: BaseFolder; onOpen: () => void; isRoot?: boolean }> = ({
    folder,
    onOpen,
    isRoot = false,
  }) => (
    <button
      onClick={onOpen}
      className={`group w-full text-left rounded-xl px-4 py-3 
                ${isRoot
                  ? "bg-violet-900/40 border border-violet-500/50 hover:border-violet-300/80 hover:bg-violet-800/50"
                  : "bg-purple-950/40 border border-purple-500/40 hover:border-purple-300/80 hover:bg-purple-900/50"}
                transition shadow-[0_0_12px_rgba(180,90,255,.25)] backdrop-blur-sm`}
      title={descOfFolder(folder)}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-9 h-9 grid place-items-center rounded-full border ${
            isRoot ? "border-violet-300/60 bg-violet-400/20" : "border-purple-300/60 bg-purple-400/20"
          }`}
        >
          <FolderIcon className="w-5 h-5 text-violet-200" />
        </span>
        <span className="flex-1 font-semibold text-violet-50 truncate">{titleOfFolder(folder)}</span>
        <ChevronRight className="w-4 h-4 text-violet-200/80" />
      </div>
    </button>
  );

  const ParcoursRowCard: React.FC<{ p: ParcoursRow }> = ({ p }) => {
    const a = attemptsMap[p.id];
    const percent = percentOf(p.id);
    const done = a?.last_total ? a.last_score === a.last_total : false;

    return (
      <button
        onClick={() => openParcours(p)}
        className="w-full rounded-lg px-4 py-3 bg-sky-950/40 border border-sky-500/40 hover:border-sky-300/80 hover:bg-sky-900/50 transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 grid place-items-center rounded-full border ${
              done ? "border-lime-300/70 bg-lime-400/20" : "border-yellow-300/70 bg-yellow-400/20"
            }`}
          >
            <Trophy className={`w-5 h-5 ${done ? "text-lime-200" : "text-yellow-200"}`} />
          </span>
          <span className="font-semibold text-cyan-50 truncate">{p.nom || "Parcours"}</span>
        </div>
        <div className="text-xs font-bold">
          {done ? (
            <span className="text-lime-300 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SCELLÉ
            </span>
          ) : (
            <span className="text-cyan-200 inline-flex items-center gap-1">
              <Target className="w-3 h-3" />
              {percent}%
            </span>
          )}
        </div>
      </button>
    );
  };

  /* -------- Vues -------- */
  const currentChildren = currentFolder ? childrenByFolder[currentFolder.id] || [] : [];
  const currentParcours = currentFolder ? parcoursByFolder[currentFolder.id] || [] : [];
  const rootParcours = parcoursByFolder[ROOT_KEY] || [];
  const showChildren = currentFolder && currentChildren.length > 0;
  const showParcours = currentFolder && currentParcours.length > 0;

  const renderFoldersScreen = () => (
    <div className="h-full flex flex-col">
      {/* Header écran */}
      {!currentFolder ? (
        <div className="flex justify-center mb-6">
          <div className="px-8 py-3 rounded-full bg-cyan-900/60 border border-cyan-300/40 shadow-[0_0_24px_rgba(0,255,255,.35)] backdrop-blur-sm">
            <span className="text-white font-extrabold uppercase tracking-wide text-[clamp(18px,2.2vw,12px)] [text-shadow:0_2px_0_#093a3a,0_0_14px_rgba(0,255,255,.9),0_0_28px_rgba(0,255,255,.35)]">
  Quel parcours as-tu terminé ?
</span>

          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-cyan-50">{titleOfFolder(currentFolder)}</div>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-2 py-1 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-100 hover:bg-cyan-800/50 ml-[-8px]"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      )}

      {/* Listes */}
      <div className="flex-1 overflow-auto pr-1 space-y-6">
        {/* Racine → dossiers */}
        {!currentFolder && (
          <div>
            {loading && (
              <div className="text-cyan-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" /> Chargement…
              </div>
            )}
            {!loading && rootFolders.length === 0 && (
              <div className="text-cyan-200/80">Aucune aventure disponible.</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rootFolders.map((f) => (
                <FolderPlaquette key={f.id} folder={f} onOpen={() => openFolder(f)} isRoot />
              ))}
            </div>

            {/* ✅ Parcours au niveau racine */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-cyan-200 mb-2">
                <ScrollText className="w-4 h-4" /> Missions (niveau racine)
              </div>
              {parcoursLoading[ROOT_KEY] && (
                <div className="text-cyan-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" /> Chargement…
                </div>
              )}
              <div className="space-y-2">
                {rootParcours.map((p) => (
                  <ParcoursRowCard key={p.id} p={p} />
                ))}
                {rootParcours.length === 0 && !parcoursLoading[ROOT_KEY] && (
                  <div className="text-cyan-200/80">Aucune mission au niveau racine.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sous-dossiers */}
        {showChildren && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentChildren.slice().sort(byOrdreThenName).map((c) => (
                <FolderPlaquette key={c.id} folder={c} onOpen={() => openFolder(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Parcours */}
        {showParcours && (
          <div>
            <div className="flex items-center gap-2 text-cyan-200 mb-2">
              <ScrollText className="w-4 h-4" /> Missions
            </div>
            <div className="space-y-2">
              {currentParcours.slice().sort(byOrdreThenName).map((p) => (
                <ParcoursRowCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}

        {/* Rien dans le dossier courant */}
        {currentFolder &&
          !showChildren &&
          !showParcours &&
          !childrenLoading[currentFolder.id] &&
          !parcoursLoading[currentFolder.id] && (
            <div className="text-cyan-200/80 italic">Ce dossier ne contient rien pour l’instant.</div>
          )}
      </div>
    </div>
  );

  const renderParcoursScreen = () => {
    if (!selectedParcours) return null;
    const pid = selectedParcours.id;
    const balises = balisesByParcours[pid] || [];
    const bLoading = !!balisesLoading[pid];
    const attempts = attemptsMap[pid]?.attempts ?? 0;
    const nbLocked = attemptsMap[pid]?.last_score ?? 0;
    const nbTotal = attemptsMap[pid]?.last_total ?? balises.length;
    const lockedIds = new Set(lockedByParcours[pid] || []);
    const answers = answersByParcours[pid] || {};
    const results = resultsByParcours[pid] || {};
    const saving = !!savingByParcours[pid];
    const percent = percentOf(pid);
    const done = nbTotal > 0 && nbLocked === nbTotal;
    const alertMsg = validationAlert[pid] || null;

    return (
      <div className="h-full flex flex-col">
        {/* Titre parcours */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedParcours(null)}
            className="inline-flex items-center gap-2 px-2 py-1 rounded bg-cyan-900/40 border border-cyan-500/40 text-cyan-100 hover:bg-cyan-800/50"
          >
            <ArrowLeft className="w-4 h-4" /> Missions
          </button>
          <div className="relative flex justify-center mb-4">
            <div className="px-6 py-1.5 rounded-full bg-cyan-900/70 border border-cyan-300/60 shadow-[0_0_24px_rgba(0,255,255,.35)] backdrop-blur-sm">
              <span className="text-white text-2xl md:text-3xl font-extrabold uppercase tracking-wide [text-shadow:0_2px_0_#093a3a,0_0_14px_rgba(0,255,255,.9),0_0_28px_rgba(0,255,255,.35)]">
                {selectedParcours.nom || "Parcours"}
              </span>
            </div>
          </div>
          <div className="opacity-0">.</div>
        </div>

        {/* Barre de progression */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-56 h-3 rounded-full bg-cyan-900/40 border border-cyan-600/40 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${perfGradient(nbLocked, nbTotal)}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="text-cyan-100 text-sm font-semibold">
            {nbLocked}/{nbTotal} codes
          </div>
          {done && (
            <span className="text-lime-300 text-xs font-bold inline-flex items-center gap-1">
              <Lock className="w-4 h-4" /> Scellé
            </span>
          )}
        </div>

        {/* Liste des entrées */}
        <div className="flex-1 overflow-auto pr-1">
          {bLoading && (
            <div className="text-cyan-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" /> Préparation des emplacements…
            </div>
          )}

          <ul className="space-y-3">
            {balises.map((b) => {
              const isLocked = lockedIds.has(b.id);
              const ko = results[b.id] === false && !isLocked;
              const disabled = isLocked || done;
              const num = b.numero_balise ?? "?";

              const slotGlow = isLocked
                ? "ring-1 ring-lime-400/60"
                : ko
                ? "ring-1 ring-rose-400/60"
                : "ring-1 ring-cyan-400/50";

              return (
                <li key={b.id} className={`rounded-lg bg-cyan-950/30 border border-cyan-500/30 p-3 ${slotGlow}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full grid place-items-center border ${
                        isLocked ? "border-lime-300/70 bg-lime-400/20" : ko ? "border-rose-300/70 bg-rose-400/20" : "border-cyan-300/70 bg-cyan-400/20"
                      }`}
                    >
                      {isLocked ? <Check className="w-6 h-6 text-lime-200" /> : ko ? <X className="w-6 h-6 text-rose-200" /> : <Zap className="w-6 h-6 text-cyan-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-cyan-200/90 block mb-1">RUNE n°{num}</label>
                      <input
                        value={disabled ? "" : (answers[b.id] ?? "")}
                        onChange={(e) => setAnswer(pid, b.id, e.target.value)}
                        disabled={disabled}
                        placeholder={isLocked ? "Code accepté" : "Inscris la rune…"}
                        className={`w-full px-4 py-2 rounded-md text-base uppercase tracking-wider font-semibold text-center 
                                    bg-cyan-950/40 border ${
                                      isLocked
                                        ? "border-lime-400/70 text-lime-200"
                                        : ko
                                        ? "border-rose-400/70 text-rose-100"
                                        : "border-cyan-500/50 text-cyan-50 focus:border-cyan-300"
                                    } 
                                    outline-none`}
                        aria-label={`Saisie code balise ${num}`}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {alertMsg && (
            <div className="mt-4 rounded-md border border-rose-400/60 bg-rose-900/40 text-rose-100 px-4 py-3 text-center">
              <X className="w-4 h-4 inline mr-2" />
              {alertMsg}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => validateParcours(selectedParcours)}
            disabled={done || saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md font-extrabold 
               bg-amber-400 text-stone-900 border border-amber-700 shadow-lg 
               hover:bg-amber-300 disabled:opacity-50 transition-transform active:scale-95"
            title={done ? "Le parchemin est scellé" : "Valider mes réponses"}
          >
            <Check className="w-5 h-5" />
            {done ? "Quête terminée" : saving ? "Gravure…" : "Valider les runes"}
          </button>

          {/* Nombre de tentatives */}
          <div className="mt-2 text-sm font-semibold text-cyan-200 bg-cyan-950/40 px-4 py-2 rounded-full border border-cyan-600/40 shadow-md">
            🔁 Tentatives effectuées : <span className="text-white">{attempts}</span>
          </div>
        </div>
      </div>
    );
  };

  /* -------- Rendu global : Machine + Écran -------- */
  const isVideo = /\.mp4(\?|$)/i.test(MACHINE_BG);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white font-serif">
      {/* Conteneur de la machine */}
      <div className="relative max-w-[1600px] mx-auto px-2 md:px-4 py-6">
        {/* Image/vidéo de fond (la machine) */}
        {isVideo ? (
          <video
            key={MACHINE_BG} // force le reload si l’URL change
            src={MACHINE_BG}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-auto block rounded-lg shadow-2xl pointer-events-none select-none"
          />
        ) : (
          <img
            src={MACHINE_BG}
            alt=""
            className="w-full h-auto block rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}

        {/* Bouton retour global */}
        <button
          className="return-button absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-900/60 border border-cyan-400/60 text-cyan-50 hover:bg-cyan-800/70"
          onClick={() => setPage("AccueilEleve")}
        >
          <ArrowLeft className="w-4 h-4" />
          RETOUR
        </button>

        {/* Zone d'écran (fenêtre centrale de la machine) */}
        <div
          className="absolute overflow-hidden rounded-[18px] bg-transparent z-10"
          style={{ left: "27%", right: "27%", top: "18%", bottom: "29%" }}
        >
          {/* Si tu veux aussi une vidéo de fond DANS l’écran, place-la ici.
              Ex: <video className="absolute inset-0 w-full h-full object-cover opacity-40" ... /> */}

          {/* Couche UI */}
          <div className="absolute inset-0 p-4 md:p-6 text-cyan-50">
            {rpcError && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-2 rounded bg-rose-900/40 border border-rose-600/50">
                <X className="w-4 h-4" /> {rpcError}
              </div>
            )}
            {loading && !rpcError && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-2 rounded bg-cyan-900/40 border border-cyan-600/50">
                <Sparkles className="w-4 h-4 animate-pulse" /> Chargement…
              </div>
            )}
            {!selectedParcours ? renderFoldersScreen() : renderParcoursScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcrireResultat;
