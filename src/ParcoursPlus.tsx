// src/ParcoursPlus.tsx
import React, { useEffect, useState } from "react";
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
        Composant
========================= */
const ParcoursPlus: React.FC<Props> = ({
  setPage,
  setModeConnexion,
  setProfesseur,
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
  const [loadingEleve, setLoadingEleve] = useState(false);
  const [errorEleve, setErrorEleve] = useState<string | null>(null);

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
  const fetchProfUserIdFromCode = async (code: string) => {
    const { data, error } = await rpc<any>("validate_prof_code", { p_code: code });
    if (error) throw new Error(error.message || error.details || "validate_prof_code failed");
    return pickProfUserId(data);
  };

  const claimOrCreateStudent = async (code: string, profUserId: string) => {
    let { data, error } = await rpc<any>("claim_or_create_student", {
      p_code: code,
      p_prof_user: profUserId,
    });

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

  const fetchStudentProfileByCode = async (codeElv: string) => {
    const { data, error } = await supabase.rpc("student_name_by_code", { p_code: codeElv });
    if (error) {
      console.warn("[student_name_by_code] profil introuvable :", error);
      return { id: undefined, display_name: null } as EleveType;
    }
    const row = Array.isArray(data) ? data[0] : data;
    const name: string | null = row?.name ?? null;
    return { id: row?.id, display_name: name } as EleveType;
  };

  /* =========================
         Connexions
  ========================= */
  // → PROF : on authentifie seulement. App.tsx s’occupe ensuite de créer/réparer le profil.
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

      // ✅ Laisser App.tsx gérer ensureProfesseurProfile via onAuthStateChange
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

  const handleEleveConnection = async () => {
    if (loadingEleve) return;
    setErrorEleve(null);

    const codeProf = codeProfEleve.trim().toUpperCase();
    const codeElv = codeEleve.trim();

    if (!codeProf || !codeElv) {
      setErrorEleve("Renseigne le code professeur et ton code élève.");
      return;
    }

    setLoadingEleve(true);
    try {
      const profUserId = await fetchProfUserIdFromCode(codeProf);
      if (!profUserId) {
        setErrorEleve("Le code professeur est invalide.");
        return;
      }

      const eleveUuid = await claimOrCreateStudent(codeElv, profUserId);
      if (!eleveUuid) {
        setErrorEleve("Réponse inattendue: pas d'identifiant élève.");
        return;
      }

      const profil = await fetchStudentProfileByCode(codeElv);

      setModeConnexion("eleve");
      setEleve({
        uuid: eleveUuid,
        code: codeElv,
        teacher_id: profUserId,
        group_id: null,
        display_name: profil.display_name ?? null,
      });
      setPage("AccueilEleve");
    } catch (e: any) {
      console.error("❌ Connexion élève — erreur:", e);
      setErrorEleve(e?.message || e?.details || e?.hint || "Une erreur inattendue est survenue.");
    } finally {
      setLoadingEleve(false);
    }
  };

  /* =========================
             UI
  ========================= */
  if (modeConnexionLocal === "accueil") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col">
          <div
            className={`relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col transition-all duration-1000 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
                <Compass className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4 tracking-tight">
                Parcours+
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Plateforme numérique pour l&apos;enseignement de la course d&apos;orientation
              </p>
              <div className="flex justify-center items-center gap-8 mt-8 opacity-60">
                <Users className="w-6 h-6 text-cyan-400" />
                <Target className="w-6 h-6 text-blue-400" />
                <Award className="w-6 h-6 text-purple-400" />
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-6xl w-full">
                <div className="grid grid-cols-2 gap-8">
                  <div
                    className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 transition-all cursor-pointer text-center"
                    onClick={() => setModeConnexionLocal("espaceProf")}
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">👨‍🏫</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Espace Professeur</h2>
                  </div>

                  <div
                    className="group relative bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 transition-all cursor-pointer text-center"
                    onClick={() => setModeConnexionLocal("espaceEleve")}
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">🎓</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">Espace Élève</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-black/20 border-t border-white/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-center items-center gap-16 text-white/80">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">50+</div>
                <div className="text-sm">Élèves</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">5+</div>
                <div className="text-sm">Professeurs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">1000+</div>
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
            <div className="bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-3xl p-8 border border-green-400/30">
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
                      setModeConnexion("accueil"); // on laisse App gérer
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl mb-4 shadow-2xl">
                <span className="text-3xl">🎓</span>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Espace Élève
              </h1>
            </div>
            <div className="w-24" />
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-3xl p-8 border border-blue-400/30">
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Code unique professeur"
                  value={codeProfEleve}
                  onChange={(e) => setCodeProfEleve(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 uppercase tracking-widest font-mono"
                />
                <input
                  type="text"
                  placeholder="Code élève"
                  value={codeEleve}
                  onChange={(e) => setCodeEleve(e.target.value)}
                  maxLength={24}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60"
                />

                {errorEleve && <div className="text-red-300 text-sm -mt-2">{errorEleve}</div>}

                <button
                  onClick={handleEleveConnection}
                  disabled={loadingEleve}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold"
                >
                  {loadingEleve ? "Connexion..." : "Connexion élève"}{" "}
                  <ArrowRight className="inline ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ParcoursPlus;
