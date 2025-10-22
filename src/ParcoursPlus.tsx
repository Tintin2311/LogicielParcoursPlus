// src/ParcoursPlus.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  Target,
  Award,
  BookOpen,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Compass,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const BG_URL =
  "https://aswhubzprehjnunbpkwc.supabase.co/storage/v1/object/public/background/Accueil%20Parcours%20Plus.png";

const STUDENT_BG_VIDEO_URL =
  "https://aswhubzprehjnunbpkwc.supabase.co/storage/v1/object/public/background/bonhomme%20portail.mp4";

/* =========================
          Types
========================= */
type Mode = "accueil" | "espaceProf" | "espaceEleve";
type PageType =
  | "accueil"
  | "AccueilProf"
  | "CreationCompteProf"
  | "MotDePasseOublie"
  | "AccueilEleve";

interface Partage {
  id: string;
  nom: string;
  type: "dossier" | "parcours";
  date?: number;
  expediteur?: string;
  contenu?: any;
}

interface Professeur {
  id_uuid: string;
  user_id: string;
  code: string;
  nom?: string | null;
  email?: string | null;
  refuserPartage?: boolean;
  partagesRecus: Partage[];
}

interface EleveType {
  id?: string;
  uuid?: string;
  code?: string;
  teacher_id?: string | null;
  group_id?: string | null;
  display_name?: string | null;
}

interface Props {
  setPage: (p: PageType) => void;
  setModeConnexion: (m: "accueil" | "prof" | "eleve") => void;
  setProfesseur: (p: Professeur | null) => void;
  setEleve: (e: EleveType | null) => void;
}

/* =========================
         Utils locaux
========================= */
const j = (v: any) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const pickUuid = (raw: any): string | null => {
  if (!raw) return null;
  if (typeof raw === "string") return /^[0-9a-f-]{36}$/i.test(raw) ? raw : null;
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const k = pickUuid(it);
      if (k) return k;
    }
    return null;
  }
  if (typeof raw === "object") {
    if (typeof (raw as any).id === "string") return (raw as any).id;
    if (typeof (raw as any).uuid === "string") return (raw as any).uuid;
    for (const v of Object.values(raw)) {
      const k =
        typeof v === "string"
          ? /^[0-9a-f-]{36}$/i.test(v)
            ? v
            : null
          : typeof v === "object"
          ? pickUuid(v)
          : null;
      if (k) return k;
    }
  }
  return null;
};

const pickProfUserId = (raw: any): string | null => {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const k = pickProfUserId(it);
      if (k) return k;
    }
    return null;
  }
  if (typeof raw === "object") {
    if (typeof (raw as any).user_id === "string") return (raw as any).user_id;
    if (typeof (raw as any).id === "string") return (raw as any).id;
    for (const v of Object.values(raw)) {
      const k =
        typeof v === "string"
          ? v
          : typeof v === "object"
          ? pickProfUserId(v)
          : null;
      if (k) return k;
    }
  }
  return null;
};

const rpc = async <T = any>(fn: string, params: Record<string, any>) => {
  const res = await supabase.rpc(fn, params);
  console.log(
    `%c[RPC ${fn}]`,
    "background:#111;color:#7dd3fc;padding:2px 6px;border-radius:6px",
    "\nparams =", j(params),
    "\nerror  =", j(res.error),
    "\ndata   =", j(res.data)
  );
  return res as { data: T | null; error: any };
};

/* =========================
   Composants UI utilitaires
========================= */
const HeroIcons: React.FC = () => (
  <div className="flex flex-col items-center mt-8 select-none">
    <div className="flex justify-center items-center gap-8">
      {[Users, Target, Award, BookOpen].map((I, i) => (
        <div
          key={i}
          className="w-10 h-10 grid place-items-center rounded-full
                     bg-black/30 backdrop-blur-[2px]
                     shadow-[0_0_8px_rgba(255,255,255,0.3)]
                     ring-1 ring-white/20 hover:ring-white/40
                     transition-all"
        >
          <I className="w-5 h-5 text-cyan-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
        </div>
      ))}
    </div>
    <div className="h-6 mt-3" />
  </div>
);

const glass =
  "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

/* =========================
        Composant
========================= */
const ParcoursPlus: React.FC<Props> = ({
  setPage,
  setModeConnexion,
  setEleve,
}) => {
  const [modeConnexionLocal, setModeConnexionLocal] = useState<Mode>("accueil");
  const [isLoaded, setIsLoaded] = useState(false);

  // PROF
  const [newProfEmail, setNewProfEmail] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProf, setLoadingProf] = useState(false);

  // ÉLÈVE
  const [codeProfEleve, setCodeProfEleve] = useState("");
  const [codeEleve, setCodeEleve] = useState("");
  const [showStudentCode, setShowStudentCode] = useState(false); // œil pour masquer/afficher
  const [loadingEleve, setLoadingEleve] = useState(false);
  const [errorEleve, setErrorEleve] = useState<string | null>(null);

  // Phase vidéo & données élève
  const [studentPhase, setStudentPhase] = useState<"form" | "playing">("form");
  const [nextEleve, setNextEleve] = useState<EleveType | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* ---------- Anti double rendu si le parent a déjà navigué ---------- */
  const shouldHide =
    typeof window !== "undefined" &&
    (window as any).__PP_PAGE &&
    (window as any).__PP_PAGE !== "accueil";

  useEffect(() => {
    setIsLoaded(true);
    if (typeof window !== "undefined" && !(window as any).__PP_PAGE) {
      (window as any).__PP_PAGE = "accueil";
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && modeConnexionLocal === "accueil") {
      (window as any).__PP_PAGE = "accueil";
    }
  }, [modeConnexionLocal]);

  if (shouldHide) return null;

  /* =========================
         Métiers (élève)
  ========================= */

  // 1) Vérifier que le code professeur est valide -> renvoie user_id
  const fetchProfUserIdFromCode = async (code: string) => {
    const { data, error } = await rpc<any>("validate_prof_code", { p_code: code });
    if (error) throw new Error(error.message || error.details || "validate_prof_code failed");
    return pickProfUserId(data);
  };

  // 2) Vérifier que le code élève EXISTE (sinon on refuse) — aucune création ici
  const getExistingStudentProfileByCode = async (codeElv: string): Promise<EleveType | null> => {
    const { data, error } = await supabase.rpc("student_name_by_code", { p_code: codeElv });
    if (error) {
      console.warn("[student_name_by_code] erreur :", error);
      return null;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) return null;
    return { id: row.id, display_name: row?.name ?? null } as EleveType;
  };

  // 3) Optionnel : revendiquer l'élève s'il existe (ne crée PAS si on garde le contrôle en amont)
  const claimOrCreateStudent = async (code: string, profUserId: string) => {
    let { data, error } = await rpc<any>("claim_or_create_student", {
      p_code: code,
      p_prof_user: profUserId,
    });

    // garde-fou legacy : certaines instances nommaient p_prof
    const notFound =
      error &&
      (/(not\s+found|does\s+not\s+exist)/i.test(error?.message || "") ||
        /PGRST201/.test(error?.code || "") ||
        /not\s+found/i.test(error?.details || ""));

    if (error && notFound) {
      const alt = await rpc<any>("claim_or_create_student", { p_code: code, p_prof: profUserId });
      data = alt.data;
      error = alt.error;
    }

    if (error) throw new Error(error.message || error.details || "claim_or_create_student failed");
    return pickUuid(data);
  };

  /* =========================
         Connexions
  ========================= */
  const handleProfConnection = async () => {
    if (loadingProf) return;
    setLoadingProf(true);
    try {
      const email = newProfEmail.trim().toLowerCase();
      const pwd = newProfPassword;
      if (!email || !pwd) {
        alert("Email et mot de passe requis.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error || !data?.user) {
        alert("Erreur : " + (error?.message ?? "Connexion impossible"));
        return;
      }

      setModeConnexion("accueil");
      setPage("accueil");
      if (typeof window !== "undefined") (window as any).__PP_PAGE = "accueil";
    } catch (err) {
      console.error("❌ Erreur inattendue (prof) :", err);
      alert("Une erreur est survenue lors de la connexion prof.");
    } finally {
      setLoadingProf(false);
    }
  };

  const finalizeStudentNavigation = (payload: EleveType | null) => {
    if (payload) {
      setModeConnexion("eleve");
      setEleve(payload);
    }
    setPage("AccueilEleve");
    if (typeof window !== "undefined") (window as any).__PP_PAGE = "AccueilEleve";
  };

  // Connexion élève (strict) :
  // - Vérifie code prof
  // - Vérifie que le code élève EXISTE (sinon erreur — pas de création)
  // - Revendique l'élève (RPC) puis lance la vidéo
  const handleEleveConnection = async () => {
    if (loadingEleve || studentPhase === "playing") return;
    setErrorEleve(null);

    const codeProf = codeProfEleve.trim().toUpperCase();
    const codeElv = codeEleve.trim();

    if (!codeProf || !codeElv) {
      setErrorEleve("Renseigne le code professeur et ton code élève.");
      return;
    }

    setLoadingEleve(true);
    try {
      // 1) Prof valide ?
      const profUserId = await fetchProfUserIdFromCode(codeProf);
      if (!profUserId) {
        setErrorEleve("Le code professeur est invalide.");
        return;
      }

      // 2) Élève EXISTANT ?
      const existing = await getExistingStudentProfileByCode(codeElv);
      if (!existing?.id) {
        setErrorEleve("Code élève invalide.");
        return;
      }

      // 3) Revendiquer (et non pas créer arbitrairement — on a déjà filtré les faux codes)
      let eleveUuid: string | null = null;
      try {
        eleveUuid = await claimOrCreateStudent(codeElv, profUserId);
      } catch (e: any) {
        // Si le RPC refuse, on renvoie une erreur claire
        setErrorEleve(
          e?.message ||
            e?.details ||
            "Impossible d'associer ce code élève à ce professeur."
        );
        return;
      }

      if (!eleveUuid) {
        setErrorEleve("Réponse inattendue: pas d'identifiant élève.");
        return;
      }

      // 4) Prépare payload + lance vidéo
      const payload: EleveType = {
        uuid: eleveUuid,
        code: codeElv,
        teacher_id: profUserId,
        group_id: null,
        display_name: existing.display_name ?? null,
      };
      setNextEleve(payload);

      setStudentPhase("playing");
      const v = videoRef.current;
      if (v) {
        try {
          await v.play();
        } catch (e) {
          console.warn("Lecture vidéo refusée, fallback navigation immédiate.", e);
          finalizeStudentNavigation(payload);
        }
      } else {
        finalizeStudentNavigation(payload);
      }
    } catch (e: any) {
      console.error("❌ Connexion élève — erreur:", e);
      setErrorEleve(
        e?.message || e?.details || e?.hint || "Une erreur inattendue est survenue."
      );
      setStudentPhase("form");
    } finally {
      setLoadingEleve(false);
    }
  };

  /* =========================
             UI
  ========================= */
  if (modeConnexionLocal === "accueil") {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col text-white"
        style={{
          backgroundImage: `url(${BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Vignette douce */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />
          <div className="absolute inset-0 [background:radial-gradient(120%_90%_at_50%_40%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.45)_100%)]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col">
          <div
            className={`container mx-auto px-4 py-8 flex-1 flex flex-col transition-all duration-1000 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {/* HERO */}
            <div className="relative text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]">
                <Compass className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 tracking-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">
                Parcours+
              </h1>

              <div className="relative w-full flex justify-center mt-2">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-b from-black/25 via-black/20 to-transparent blur-[6px] rounded-full" />
                <p className="relative text-xl text-white font-medium drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] [-webkit-text-stroke:0.5px_rgba(0,0,0,0.5)]">
                  Plateforme numérique pour l&apos;enseignement de la course d&apos;orientation
                </p>
              </div>

              <HeroIcons />
            </div>

            {/* Cartes verre */}
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-6xl w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    className={`group relative rounded-3xl p-8 cursor-pointer text-center ${glass}
                                hover:ring-white/30 hover:bg-white/15 transition`}
                    onClick={() => setModeConnexionLocal("espaceProf")}
                  >
                    <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]">
                      <span className="text-4xl">👨‍🏫</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                      Espace Professeur
                    </h2>
                  </div>

                  <div
                    className={`group relative rounded-3xl p-8 cursor-pointer text-center ${glass}
                                hover:ring-white/30 hover:bg-white/15 transition`}
                    onClick={() => setModeConnexionLocal("espaceEleve")}
                  >
                    <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 shadow-xl drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]">
                      <span className="text-4xl">🎓</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                      Espace Élève
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-16 text-white/90">
              <div className="text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                <div className="text-3xl font-bold text-cyan-300 mb-1">50+</div>
                <div className="text-sm">Élèves</div>
              </div>
              <div className="text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                <div className="text-3xl font-bold text-green-300 mb-1">5+</div>
                <div className="text-sm">Professeurs</div>
              </div>
              <div className="text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                <div className="text-3xl font-bold text-purple-300 mb-1">1000+</div>
                <div className="text-sm">Parcours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (modeConnexionLocal === "espaceProf") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div
          className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => setModeConnexionLocal("accueil")}
              className="flex items-center text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Retour à l&apos;accueil</span>
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-4 shadow-2xl">
                <span className="text-3xl">👨‍🏫</span>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                Espace Professeur
              </h1>
            </div>
            <div className="w-24" />
          </div>

          <div className="max-w-md mx-auto">
            <div className={`${glass} rounded-3xl p-8`}>
              <div className="space-y-6">
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={newProfEmail}
                  onChange={(e) => setNewProfEmail(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={newProfPassword}
                    onChange={(e) => setNewProfPassword(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button
                  onClick={handleProfConnection}
                  disabled={loadingProf}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold"
                >
                  {loadingProf ? "Connexion..." : "Connexion prof"}{" "}
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setPage("MotDePasseOublie")}
                  className="w-full text-white/60 hover:text-white text-sm underline underline-offset-4"
                >
                  Mot de passe oublié ?
                </button>

                <div className="text-center pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setPage("CreationCompteProf");
                      setModeConnexion("accueil");
                      if (typeof window !== "undefined") {
                        (window as any).__PP_PAGE = "CreationCompteProf";
                      }
                    }}
                    className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    🧑‍🏫 Créer un compte professeur
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (modeConnexionLocal === "espaceEleve") {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        {/* --- VIDÉO DE FOND (pause au départ) --- */}
        <div className="absolute inset-0 -z-10">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            onEnded={() => finalizeStudentNavigation(nextEleve)}
          >
            <source src={STUDENT_BG_VIDEO_URL} type="video/mp4" />
          </video>
          {/* voile de lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/55" />
        </div>

        <div
          className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => setModeConnexionLocal("accueil")}
              className="flex items-center text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Retour à l&apos;accueil</span>
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 shadow-2xl">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 drop-shadow">
                Espace Élève
              </h1>
            </div>
            <div className="w-24" />
          </div>

          {/* Carte verre avec saisie codes */}
          <div className="max-w-md mx-auto">
            <div
              className={`${glass} rounded-3xl p-8 transition-all duration-500 ${
                studentPhase === "playing"
                  ? "opacity-0 translate-y-3 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Code unique professeur"
                  value={codeProfEleve}
                  onChange={(e) => setCodeProfEleve(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70 uppercase tracking-widest font-mono"
                  disabled={studentPhase === "playing"}
                />

                {/* Champ code élève + œil */}
                <div className="relative">
                  <input
                    type={showStudentCode ? "text" : "password"}
                    placeholder="Code élève"
                    value={codeEleve}
                    onChange={(e) => setCodeEleve(e.target.value)}
                    maxLength={24}
                    className="w-full px-4 py-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/70"
                    disabled={studentPhase === "playing"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentCode((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80"
                    aria-label={showStudentCode ? "Masquer le code élève" : "Afficher le code élève"}
                    disabled={studentPhase === "playing"}
                  >
                    {showStudentCode ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errorEleve && (
                  <div className="text-red-200/90 text-sm -mt-2">{errorEleve}</div>
                )}

                <button
                  onClick={handleEleveConnection}
                  disabled={loadingEleve || studentPhase === "playing"}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold"
                >
                  {loadingEleve
                    ? "Vérification..."
                    : studentPhase === "playing"
                    ? "Lecture…"
                    : "Connexion élève"}{" "}
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message overlay lorsque la vidéo joue */}
            {studentPhase === "playing" && (
              <div className="mt-6 text-center text-white/90">
                Connexion réussie ✨ La porte s’ouvre…
              </div>
            )}

            <noscript>
              <div className="mt-4 text-center text-white/80 text-sm">
                Astuce : active JavaScript pour profiter de l’animation de fond ✨
              </div>
            </noscript>
          </div>
        </div>

        {/* === Bouton PASSER LA VIDÉO (visible pendant la lecture) === */}
        {studentPhase === "playing" && (
          <div className="fixed right-4 bottom-4 z-20">
            <button
              type="button"
              onClick={() => finalizeStudentNavigation(nextEleve)}
              className="px-4 py-3 rounded-xl font-semibold
                         bg-white/15 hover:bg-white/25 active:bg-white/30
                         backdrop-blur-xl border border-white/25
                         text-white shadow-lg transition"
            >
              PASSER LA VIDÉO
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ParcoursPlus;
