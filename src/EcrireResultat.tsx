// src/EcrireResultat.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  ArrowLeft,
  Trophy,
  Folder as FolderIcon,
  ChevronRight,
  Target,
  Lock,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  ListChecks,
  Home,
} from "lucide-react";

/* ========= Types ========= */
type EleveProps = {
  uuid?: string | null;
  code: string;
  display_name?: string | null;
  teacher_id?: string | null;
  group_id?: string | null;
};

type Groupe = { id: string; name: string; teacher_id: string | null; color?: string | null };
type RpcStudentRow = { id: string; code: string; nom: string | null; group_id: string | null; created_at?: string | null };

type BaseFolder = {
  id: string;
  name?: string | null; // parcours_folders
  parent_folder_id?: string | null;

  nom?: string | null; // legacy (compat)
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

/* ========= Utils ========= */
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
  if (p >= 90) return "from-green-500 to-emerald-600";
  if (p >= 75) return "from-blue-500 to-cyan-600";
  if (p >= 60) return "from-yellow-500 to-orange-500";
  return "from-red-500 to-pink-600";
};

/* ========= Page ========= */
const EcrireResultat: React.FC<{ setPage: (p: string) => void; eleveConnecte: EleveProps }> = ({
  setPage,
  eleveConnecte,
}) => {
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const [student, setStudent] = useState<RpcStudentRow | null>(null);
  const [group, setGroup] = useState<Groupe | null>(null);
  const displayName = useMemo(
    () => student?.nom ?? eleveConnecte.display_name ?? "Joueur",
    [student?.nom, eleveConnecte.display_name]
  );

  /** NAVIGATION dossiers */
  const [path, setPath] = useState<BaseFolder[]>([]);
  const currentFolder = path[path.length - 1] || null;

  /** NAVIGATION parcours (vue “détail”) */
  const [selectedParcours, setSelectedParcours] = useState<ParcoursRow | null>(null);

  // Dossiers / parcours
  const [rootFolders, setRootFolders] = useState<BaseFolder[]>([]);
  const [childrenByFolder, setChildrenByFolder] = useState<Record<string, BaseFolder[]>>({});
  const [childrenLoading, setChildrenLoading] = useState<Record<string, boolean>>({});
  const [childrenError, setChildrenError] = useState<Record<string, string | null>>({});
  const [parcoursByFolder, setParcoursByFolder] = useState<Record<string, ParcoursRow[]>>({});
  const [parcoursLoading, setParcoursLoading] = useState<Record<string, boolean>>({});
  const [parcoursError, setParcoursError] = useState<Record<string, string | null>>({});

  // Balises / saisie
  const [balisesByParcours, setBalisesByParcours] = useState<Record<string, BaliseRow[]>>({});
  const [balisesLoading, setBalisesLoading] = useState<Record<string, boolean>>({});
  const [balisesError, setBalisesError] = useState<Record<string, string | null>>({});

  const [answersByParcours, setAnswersByParcours] = useState<Record<string, Record<string, string>>>({});
  const [resultsByParcours, setResultsByParcours] = useState<Record<string, Record<string, boolean>>>({});
  const [lockedByParcours, setLockedByParcours] = useState<Record<string, string[]>>({});
  const [attemptsMap, setAttemptsMap] = useState<Record<string, AttemptInfo>>({});
  const [savingByParcours, setSavingByParcours] = useState<Record<string, boolean>>({}); // anti double-clic

  // ⚠️ Alerte “toutes les cases doivent être remplies”
  const [validationAlert, setValidationAlert] = useState<Record<string, string | null>>({});

  /* ---- init ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setRpcError(null);
      try {
        const { data: sData } = await supabase.rpc("get_student_by_code", { p_code: eleveConnecte.code });
        const sRow = Array.isArray(sData) ? (sData[0] as RpcStudentRow | undefined) : null;
        if (!cancelled) setStudent(sRow ?? null);

        const gid = sRow?.group_id || eleveConnecte.group_id || null;
        if (gid) {
          const { data: gData } = await supabase
            .from("groups")
            .select("id,name,teacher_id,color")
            .eq("id", gid)
            .maybeSingle();
          if (!cancelled) setGroup((gData as any) || null);
        }

        // 📂 Racine — uniquement les dossiers de premier niveau autorisés pour l'élève
        const { data: fData, error: fErr } = await supabase.rpc("get_folders_for_student", {
          p_code: eleveConnecte.code,
          p_parent: null,
        });
        if (fErr) throw new Error(`get_folders_for_student: ${fErr.message}`);

        const rows: BaseFolder[] = ((fData as any[]) || []).map((r) => {
          const src: "parcours_folders" | "folders" = "parcours_folders";
          return { ...r, __source: src } as BaseFolder;
        });
        if (!cancelled) setRootFolders(rows.sort(byOrdreThenName));

        // tentatives / verrous
        const { data: aData } = await supabase
          .from("parcours_attempts")
          .select("parcours_id, attempts, last_score, last_total, last_answers, updated_at")
          .eq("student_code", eleveConnecte.code);

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
  }, [eleveConnecte.code, eleveConnecte.group_id]);

  /* ---- chargements ---- */
  const loadParcoursFor = async (folder: BaseFolder, force = false) => {
    const folderId = folder.id;
    if (!force && parcoursByFolder[folderId]) return;

    setParcoursLoading((s) => ({ ...s, [folderId]: true }));
    setParcoursError((s) => ({ ...s, [folderId]: null }));

    try {
      let rpcErr: any = null;
      let data: any[] | null = null;

      const rpc = await supabase.rpc("get_parcours_for_student_folder", {
        p_code: eleveConnecte.code,
        p_folder_id: folderId,
      });
      if (rpc.error) rpcErr = rpc.error;
      else if (Array.isArray(rpc.data) && rpc.data.length > 0) data = rpc.data as any[];

      if (!data) {
        const sel = await supabase
          .from("parcours")
          .select("id, nom, description, folder_id, balises_ordre, ordre")
          .eq("folder_id", folderId);
        if (sel.error) throw sel.error;
        data = sel.data as any[];
      }

      const rows: ParcoursRow[] = (data || []).slice().sort(byOrdreThenName);
      setParcoursByFolder((s) => ({ ...s, [folderId]: rows }));

      if (!rows.length && rpcErr) {
        setParcoursError((s) => ({
          ...s,
          [folderId]: `0 parcours trouvés (folder_id=${folderId}). RPC a échoué: ${rpcErr.message}`,
        }));
      }
    } catch (err: any) {
      setParcoursError((s) => ({
        ...s,
        [folderId]: `Erreur pour folder_id=${folderId} — ${err?.message || "inconnue"}`,
      }));
      setParcoursByFolder((s) => ({ ...s, [folderId]: [] }));
    } finally {
      setParcoursLoading((s) => ({ ...s, [folderId]: false }));
    }
  };

  const loadChildrenFor = async (folder: BaseFolder) => {
    const id = folder.id;
    if (childrenByFolder[id]) return;

    setChildrenLoading((s) => ({ ...s, [id]: true }));
    setChildrenError((s) => ({ ...s, [id]: null }));

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
    } catch (err: any) {
      setChildrenError((s) => ({ ...s, [id]: `Sous-dossiers — ${err.message || "erreur"}` }));
      setChildrenByFolder((s) => ({ ...s, [id]: [] }));
    } finally {
      setChildrenLoading((s) => ({ ...s, [id]: false }));
    }
  };

  const openFolder = async (folder: BaseFolder) => {
    setSelectedParcours(null);
    setPath((p) => [...p, folder]);
    await Promise.all([loadChildrenFor(folder), loadParcoursFor(folder)]);
  };

  const goBack = () => {
    setSelectedParcours(null);
    setPath((p) => p.slice(0, -1));
  };
  const goRoot = () => {
    setSelectedParcours(null);
    setPath([]);
  };

  /* ---- parcours: ouverture de la vue détail ---- */
  const openParcours = async (p: ParcoursRow) => {
    setSelectedParcours(p);
    const id = p.id;
    if (!balisesByParcours[id]) {
      setBalisesLoading((s) => ({ ...s, [id]: true }));
      setBalisesError((s) => ({ ...s, [id]: null }));
      const { data, error } = await supabase.rpc("get_balises_for_student_parcours", {
        p_code: eleveConnecte.code,
        p_parcours_id: id,
      });
      if (error) {
        setBalisesError((s) => ({ ...s, [id]: error.message }));
      } else {
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

    // ✅ Pré-contrôle : toutes les cases (non verrouillées) doivent être remplies
    const currentLocked = new Set(lockedByParcours[pid] || []);
    const inputAnswers = answersByParcours[pid] || {};
    const unfilled = balises.filter((b) => !currentLocked.has(b.id) && !(inputAnswers[b.id] || "").trim());
    if (unfilled.length > 0) {
      setValidationAlert((s) => ({
        ...s,
        [pid]: "❌ La validation n'est pas possible car tous les codes doivent être remplis.",
      }));
      return;
    }
    setValidationAlert((s) => ({ ...s, [pid]: null }));

    if (!window.confirm("Êtes-vous certain de valider votre saisie ?")) return;

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
    const payload = {
      student_code: eleveConnecte.code,
      parcours_id: pid,
      attempts: prevAttempts + 1,
      last_score: lockedCount,
      last_total: total,
      last_answers: lockedAnswers,
      updated_at: new Date().toISOString(),
    };

    const { data: upData, error: upErr } = await supabase
      .from("parcours_attempts")
      .upsert(payload, { onConflict: "student_code,parcours_id" })
      .select()
      .single();

    if (upErr) {
      alert(`Enregistrement impossible : ${upErr.message}`);
      setSavingByParcours((s) => ({ ...s, [pid]: false }));
      return;
    }

    setAttemptsMap((s) => ({
      ...s,
      [pid]: {
        attempts: upData?.attempts ?? payload.attempts,
        last_score: upData?.last_score ?? payload.last_score,
        last_total: upData?.last_total ?? payload.last_total,
        last_answers: upData?.last_answers ?? payload.last_answers,
        updated_at: upData?.updated_at ?? payload.updated_at,
      },
    }));

    setSavingByParcours((s) => ({ ...s, [pid]: false }));
  };

  /* ========= UI ========= */
  const percentOf = (pid: string) => {
    const a = attemptsMap[pid];
    return a?.last_total ? Math.round((a.last_score / a.last_total) * 100) : 0;
  };

  const renderFolderView = () => (
    <>
      {/* Fil d’Ariane */}
      <nav className="flex items-center gap-2 text-sm text-white/70 mb-5">
        <button onClick={goRoot} className="inline-flex items-center gap-1 hover:text-white transition">
          <Home className="w-4 h-4" /> Racine
        </button>
        {path.map((f, i) => (
          <React.Fragment key={f.id}>
            <ChevronRight className="w-4 h-4 opacity-60" />
            {i === path.length - 1 ? (
              <span className="text-white">{titleOfFolder(f)}</span>
            ) : (
              <button className="hover:text-white transition" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                {titleOfFolder(f)}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Barre locale du dossier */}
      {currentFolder ? (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au dossier précédent
          </button>
          <div className="text-white/80 text-sm">{descOfFolder(currentFolder)}</div>
          <div className="opacity-0 select-none" aria-hidden>
            .
          </div>
        </div>
      ) : null}

      {/* Vue: Racine ou Dossier courant */}
      <div className="relative">
        {/* RACINE */}
        {!currentFolder && (
          <section aria-label="racine" className="animate-[fadeIn_.25s_ease-out] grid grid-cols-1 md:grid-cols-2 gap-6">
            {!loading && rootFolders.length === 0 && (
              <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white/80">
                Aucun dossier disponible.
              </div>
            )}
            {rootFolders.map((f) => (
              <FolderCard key={f.id} folder={f} onOpen={() => openFolder(f)} />
            ))}
          </section>
        )}

        {/* DOSSIER */}
        {currentFolder && (
          <section className="animate-[slideIn_.25s_ease-out] space-y-6">
            {/* sous-dossiers */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Sous-dossiers</h3>
              {childrenLoading[currentFolder.id] && (
                <div className="flex items-center text-white/80">
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Recherche des sous-dossiers…
                </div>
              )}
              {childrenError[currentFolder.id] && (
                <div className="text-amber-300">⚠️ {childrenError[currentFolder.id]}</div>
              )}
              {!childrenLoading[currentFolder.id] && (childrenByFolder[currentFolder.id]?.length ?? 0) === 0 && (
                <div className="text-white/60">Aucun sous-dossier.</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(childrenByFolder[currentFolder.id] || []).slice().sort(byOrdreThenName).map((c) => (
                  <FolderCard key={c.id} folder={c} onOpen={() => openFolder(c)} compact />
                ))}
              </div>
            </div>

            {/* parcours */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-semibold">Parcours</h3>
                {parcoursLoading[currentFolder.id] && (
                  <div className="flex items-center text-white/80">
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Chargement des parcours…
                  </div>
                )}
                {parcoursError[currentFolder.id] && (
                  <div className="text-red-300 text-xs break-all">❌ {parcoursError[currentFolder.id]}</div>
                )}
              </div>

              {!parcoursLoading[currentFolder.id] && (parcoursByFolder[currentFolder.id]?.length ?? 0) === 0 && (
                <div className="text-white/60">Aucun parcours ici.</div>
              )}

              <div className="space-y-3">
                {(parcoursByFolder[currentFolder.id] || [])
                  .slice()
                  .sort(byOrdreThenName)
                  .map((p) => {
                    const a = attemptsMap[p.id];
                    const percent = percentOf(p.id);
                    const done = a?.last_total ? a.last_score === a.last_total : false;

                    return (
                      <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <button
                          onClick={() => openParcours(p)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 grid place-items-center">
                              <ListChecks className="w-4 h-4 text-fuchsia-300" />
                            </div>
                          </div>
                          <div className="flex-1 text-left px-2">
                            <div className="font-semibold text-white">{p.nom || "Parcours"}</div>
                            {p.description && <div className="text-white/70 text-xs line-clamp-1">{p.description}</div>}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="hidden md:block w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${perfGradient(
                                  a?.last_score ?? 0,
                                  a?.last_total ?? 0
                                )}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="text-xs">
                              {done ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-300">
                                  <Lock className="w-4 h-4 mr-1" />
                                  Terminé
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300">
                                  <Target className="w-4 h-4 mr-1" />
                                  {percent}%
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/70" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );

  const renderParcoursDetail = () => {
    if (!selectedParcours) return null;
    const pid = selectedParcours.id;
    const balises = balisesByParcours[pid] || [];
    const bLoading = !!balisesLoading[pid];
    const bError = balisesError[pid] || null;
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
      <section className="animate-[fadeIn_.2s_ease-out]">
        {/* barre de navigation locale */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedParcours(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dossier
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-400 via-fuchsia-500 to-rose-500 rounded-xl mb-3 shadow-xl">
              <ListChecks className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold">{selectedParcours.nom || "Parcours"}</h2>
            {selectedParcours.description && (
              <p className="text-white/75 max-w-2xl mx-auto mt-1">{selectedParcours.description}</p>
            )}
          </div>

          <div className="opacity-0 select-none">.</div>
        </div>

        {/* progression */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${perfGradient(nbLocked, nbTotal)}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="text-sm text-white/90">
            <b>{nbLocked}</b>/<b>{nbTotal}</b> balises
          </div>
          {done && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-300 text-xs">
              <Lock className="w-4 h-4 mr-1" /> Mission terminée
            </span>
          )}
        </div>

        {/* liste verticale des balises — gros numéro + couleurs franches */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          {bLoading && (
            <div className="text-white/80 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Chargement des balises…
            </div>
          )}
          {bError && <div className="text-red-300">❌ {bError}</div>}
          {!bLoading && !bError && balises.length === 0 && <div className="text-white/70">Aucune balise.</div>}

          <ul className="space-y-4">
            {balises.map((b) => {
              const isLocked = lockedIds.has(b.id);
              const ko = results[b.id] === false && !isLocked;
              const disabled = isLocked || done;

              // couleur de carte — franc et visible
              const cardColor =
                isLocked ? "bg-green-600 border-green-700" : ko ? "bg-red-600 border-red-700" : "bg-white/5 border-white/10";

              return (
                <li
                  key={b.id}
                  className={`rounded-2xl border transition shadow-lg ${cardColor} text-white`}
                >
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
                      {/* Gros numéro */}
                      <div
                        aria-hidden
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl grid place-items-center font-black text-3xl border-2 ${
                          isLocked
                            ? "bg-green-700/40 border-white/60"
                            : ko
                            ? "bg-red-700/40 border-white/60"
                            : "bg-sky-500/25 border-white/40"
                        }`}
                      >
                        {b.numero_balise ?? "?"}
                      </div>

                      {/* Zone saisie + puces d'état */}
                      <div className="min-w-0">
                        <input
                          value={disabled ? "" : (answers[b.id] ?? "")}
                          onChange={(e) => setAnswer(pid, b.id, e.target.value)}
                          disabled={disabled}
                          placeholder={isLocked ? "VALIDÉE ✓" : "ENTRER LE CODE DE LA BALISE…"}
                          className={`w-full px-4 py-3 rounded-xl text-base md:text-lg uppercase tracking-wider font-semibold text-center border focus:outline-none transition
                            ${
                              isLocked
                                ? "bg-green-500 text-white border-white/70"
                                : ko
                                ? "bg-red-500 text-white border-white/70"
                                : "bg-black/30 text-white border-white/20 focus:border-blue-300"
                            } ${disabled ? "opacity-90 cursor-not-allowed" : ""}`}
                          aria-label={`Saisie code balise ${b.numero_balise ?? "?"}`}
                        />

                        {/* Puces d'état très visibles */}
                        <div className="mt-2 h-6">
                          {isLocked && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-green-700 font-extrabold text-xs uppercase shadow">
                              <Check className="w-4 h-4 mr-1" /> VALIDÉE
                            </span>
                          )}
                          {ko && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-red-700 font-extrabold text-xs uppercase shadow">
                              <X className="w-4 h-4 mr-1" /> INCORRECT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Icône à droite */}
                      <div className="w-8 flex items-center justify-end">
                        {isLocked && <Check className="w-6 h-6 text-white" />}
                        {ko && <X className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Alerte “toutes les cases” */}
          {alertMsg && (
            <div className="mt-5 rounded-xl border border-red-500 bg-red-600 text-white font-semibold px-4 py-3 text-center">
              {alertMsg}
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => validateParcours(selectedParcours)}
              disabled={done || saving}
              className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 transition shadow"
              title={done ? "Toutes les balises sont validées" : "Valider mes réponses"}
            >
              <Check className="w-4 h-4 mr-2" />
              {done ? "Mission terminée" : saving ? "Enregistrement…" : "Valider mes réponses"}
            </button>
            <div className="flex items-center px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg">
              Essais : <span className="ml-2 font-semibold text-white">{attempts}</span>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header global */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setPage("AccueilEleve")}
            className="group flex items-center px-5 py-2.5 bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/10 transition border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" /> Retour
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-2xl mb-4 shadow-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              Saisir un résultat
            </h1>
            <p className="text-white/70">
              Course d’orientation — {displayName}
              {group?.name ? <span className="opacity-80"> — {group.name}</span> : null}
            </p>
          </div>
          <div className="opacity-0 pointer-events-none">.</div>
        </div>

        {/* états généraux */}
        <div className="mb-6">
          {loading && (
            <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Chargement…
            </div>
          )}
          {rpcError && !loading && (
            <div className="inline-flex items-center px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {rpcError}
            </div>
          )}
        </div>

        {/* Contenu : soit dossiers/parcours, soit détail d’un parcours */}
        {!selectedParcours ? renderFolderView() : renderParcoursDetail()}
      </div>
    </div>
  );
};

/* ========= Cartes de dossier ========= */
function FolderCard({
  folder,
  onOpen,
  compact = false,
}: {
  folder: BaseFolder;
  onOpen: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onOpen}
      className={`group w-full text-left rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/40 to-gray-700/40 hover:border-white/20 hover:from-gray-700/50 hover:to-gray-600/50 transition p-4 ${
        compact ? "" : "py-5"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/40 grid place-items-center">
          <FolderIcon className="w-6 h-6 text-blue-300" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">
            {titleOfFolder(folder)}
          </div>
          <div className="text-white/70 text-sm line-clamp-1">{descOfFolder(folder)}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white" />
      </div>
    </button>
  );
}

export default EcrireResultat;
