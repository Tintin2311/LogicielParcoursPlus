// App.tsx
import "./index.css";

/* --- Pages / écrans --- */
import ParcoursPlus from "./ParcoursPlus";
import CreationCompteProf from "./CreationCompteProf";
import AccueilProf from "./AccueilProf";
import Parametres from "./Parametres";
import GestionGroupes from "./GestionGroupes";
import GestionEleves from "./GestionEleves";
import GestionBalises from "./GestionBalises";
import GestionParcours from "./GestionParcours";
import CreerUnNouveauParcours from "./CreerUnNouveauParcours";
import MesParcours from "./MesParcours";
import NouveauMotDePasse from "./NouveauMotDePasse";
import GestionResultats from "./GestionResultats";
import GestionResultatsTentatives from "./GestionResultatsTentatives";
import GestionResultatsProgressivite from "./GestionResultatsProgressivite";
import GestionPoints from "./GestionPoints";
import Association from "./Association";
import AccueilEleve from "./AccueilEleve";
import EcrireResultat from "./EcrireResultat";
import StatistiquesEleve from "./StatistiquesEleve";
import MotDePasseOublie from "./MotDePasseOublie";
import PartageParcours from "./PartageParcours";
/* >>> NEW <<< */
import ConfigurationPersonnalisee from "./ConfigurationPersonnalisee";

/* --- Libs --- */
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import emailjs from "emailjs-com";
import { supabase } from "./supabaseClient";

/* --- EmailJS --- */
emailjs.init("lyiZ-6klparD8KCNw");

/* =========================
          TYPES
========================= */
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
  nom?: string;
  email?: string;
  refuserPartage?: boolean;
  partagesRecus?: Partage[];
}

interface Group {
  id: number;
  nom: string;
  eleves: any[];
}

interface EleveType {
  id: string;        // PK students (ou fallback)
  uuid?: string;     // optionnel pour cache
  nom?: string;
  name?: string;
  code?: string;
  group_id?: string | null;
  display_name?: string | null;
}

/* =========================
      NAV / PAGES
========================= */
type PageType =
  | "accueil"
  | "AccueilProf"
  | "Parametres"
  | "gestionGroupes"
  | "GestionEleves"
  | "gestionBalises"
  | "gestionParcours"
  | "CreerUnNouveauParcours"
  | "MesParcours"
  | "gestionResultats"
  | "GestionResultatsTentatives"
  | "GestionResultatsProgressivite"
  | "GestionPoints"
  | "Association"
  | "EcrireResultat"
  | "StatistiquesEleve"
  | "PartageParcours"
  | "CreationCompteProf"
  | "MotDePasseOublie"
  | "nouveauMotDePasse"
  | "AccueilEleve"
  /* >>> NEW <<< */
  | "configurationPersonnalisee"
  | "gestionResultatsTentatives_parcours";

/* =========================
   LOCAL STORAGE KEYS
========================= */
const LS_LAST_PAGE_PROF = "dernierePage";
const LS_LAST_PAGE_ELEVE = "dernierePageEleve";
const LS_ELEVE_CACHE = "eleveCache";
const LS_LAST_MODE = "derniereConnexionMode";

/* =========================
          APP
========================= */
export default function App() {
  /* --- Navigation & session --- */
  const [page, setPage] = useState<PageType>("accueil");
  const [modeConnexion, setModeConnexion] =
    useState<"accueil" | "prof" | "eleve">("accueil");
  const [chargementInitial, setChargementInitial] = useState(true);

  /* --- Utilisateurs --- */
  const [professeur, setProfesseur] = useState<Professeur | null>(null);
  const [eleve, setEleve] = useState<EleveType | null>(null);

  /* --- États métier (conservés) --- */
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [balises, setBalises] = useState<any[]>([]);
  const [parcoursId, setParcoursId] = useState<string | null>(null);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [parcoursGlobaux, setParcoursGlobaux] = useState<any[]>([]);
  const [dossiersParcours, setDossiersParcours] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [parcoursActif, setParcoursActif] = useState<any>(null);
  const [resultatsEleves, setResultatsEleves] = useState<any[]>([]);
  const [parcoursTerminesEleves, setParcoursTerminesEleves] = useState<any[]>(
    []
  );
  const [affichageResultat, setAffichageResultat] = useState(false);
  const [balisesGlobales, setBalisesGlobales] = useState<{ code: string }[]>(
    []
  );
  const [balisesTemp, setBalisesTemp] = useState<any[]>([]);
  const [refuserPartage, setRefuserPartage] = useState(false);
  const [newProfPrenom, setNewProfPrenom] = useState("");
  const [newProfName, setNewProfName] = useState("");
  const [newProfEmail, setNewProfEmail] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");
  const [newProfPasswordConfirm, setNewProfPasswordConfirm] = useState("");
  const [codeValidationEnvoye, setCodeValidationEnvoye] = useState("");
  const [nomGroupe, setNomGroupe] = useState("");
  const [nomEleve, setNomEleve] = useState("");
  const [groupeActif, setGroupeActif] = useState<any>(null);
  const [editParcoursId, setEditParcoursId] = useState<string | null>(null);
  const [dossiersGroupes, setDossiersGroupes] = useState<any[]>([]);
  const [nouveauNomDossier, setNouveauNomDossier] = useState("");
  const [modeCreationBalises, setModeCreationBalises] = useState<
    "manuel" | "automatique" | null
  >(null);
  const [baremeEvaluation, setBaremeEvaluation] = useState<any[]>([
    { type: "=", tentatives: 1, couleur: "green", points: 1 },
    { type: "=", tentatives: 2, couleur: "yellow", points: 0.5 },
    { type: "=", tentatives: 3, couleur: "orange", points: 0 },
    { type: "≥", tentatives: 4, couleur: "red", points: -1 },
  ]);
  const [modePoints, setModePoints] = useState<"cumul" | "best">("cumul");
  const [baremePointsGlobal, setBaremePointsGlobal] = useState({
    pointsParParcours: 0,
    baremeTentatives: [] as any[],
  });
  const [baremePointsParcours, setBaremePointsParcours] = useState<any>({});
  const [ParametresProf, setParametresProf] = useState({
    modeCreationParcours: null as any,
  });

  /* =========================
        HELPERS
  ========================= */
  const handleSelectGroupForStudents = (group: Group) => {
    setSelectedGroup(group);
    setPage("GestionEleves");
  };

  const handleDeconnexion = async () => {
    await supabase.auth.signOut(); // déconnecte un prof s'il y en a un
    setProfesseur(null);
    setEleve(null);
    setModeConnexion("accueil");
    setPage("accueil");
    localStorage.setItem(LS_LAST_MODE, "accueil");
    localStorage.removeItem(LS_LAST_PAGE_PROF);
    localStorage.removeItem(LS_LAST_PAGE_ELEVE);
    console.log("🚪 Déconnexion");
  };

  const setEleveAndCache = (e: EleveType | null) => {
    setEleve(e);
    if (!e) return;
    try {
      localStorage.setItem(LS_ELEVE_CACHE, JSON.stringify(e));
      localStorage.setItem(LS_LAST_PAGE_ELEVE, "AccueilEleve");
      localStorage.setItem(LS_LAST_MODE, "eleve");
    } catch {
      // ignore quota
    }
  };

  // Mémoriser le mode à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(LS_LAST_MODE, modeConnexion);
    } catch {}
  }, [modeConnexion]);

  /* =========================
      RESTAURATION AU DÉMARRAGE
  ========================= */
  useEffect(() => {
    let alive = true;

    // Nettoyage URL (otp/access_denied)
    try {
      const url = new URL(window.location.href);
      const hq = url.hash + url.search;
      if (
        hq.includes("error_code=otp_expired") ||
        hq.includes("error=access_denied")
      ) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}

    const restore = async () => {
      setChargementInitial(true);

      // 1) PROF via session Supabase (prioritaire)
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        const userId = session?.user?.id ?? null;

        if (userId) {
          const { data: prof } = await supabase
            .from("professeurs")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (alive && prof) {
            setProfesseur(prof as Professeur);
            setEleve(null);
            setModeConnexion("prof");
            setPage(
              (localStorage.getItem(LS_LAST_PAGE_PROF) as PageType) ||
                "AccueilProf"
            );
            setChargementInitial(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Restauration prof échouée:", e);
      }

      // 2) ÉLÈVE via cache si dernier mode 'eleve' OU dernière page élève
      try {
        const lastMode = (localStorage.getItem(LS_LAST_MODE) ||
          "accueil") as "accueil" | "prof" | "eleve";
        const lastElevePage = localStorage.getItem(
          LS_LAST_PAGE_ELEVE
        ) as PageType | null;

        const elevePages: PageType[] = [
          "AccueilEleve",
          "EcrireResultat",
          "StatistiquesEleve",
        ];

        const shouldRestoreEleve =
          lastMode === "eleve" ||
          (lastElevePage != null && elevePages.includes(lastElevePage));

        if (shouldRestoreEleve) {
          const raw = localStorage.getItem(LS_ELEVE_CACHE);
          if (raw) {
            const cached = JSON.parse(raw) as EleveType;
            if (cached && (cached.id || cached.code)) {
              if (!alive) return;
              setEleve(cached);
              setProfesseur(null);
              setModeConnexion("eleve");
              setPage(lastElevePage || "AccueilEleve");
              setChargementInitial(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Cache élève illisible:", e);
      }

      // 3) Rien → accueil public
      if (!alive) return;
      setProfesseur(null);
      setEleve(null);
      setModeConnexion("accueil");
      setPage("accueil");
      localStorage.setItem(LS_LAST_MODE, "accueil");
      setChargementInitial(false);
    };

    restore();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, _sess) => {
      restore();
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* =========================
   LIEN /recovery → page
  ========================= */
  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const queryParams = new URLSearchParams(search);

    const isRecovery =
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery" ||
      queryParams.get("from") === "recovery";

    if (isRecovery) {
      setModeConnexion("accueil");
      setPage("nouveauMotDePasse");
    }
  }, []);

  /* =========================
     MÉMO DERN. PAGE
  ========================= */
  useEffect(() => {
    if (professeur) localStorage.setItem(LS_LAST_PAGE_PROF, page);
  }, [page, professeur]);
  useEffect(() => {
    if (eleve) localStorage.setItem(LS_LAST_PAGE_ELEVE, page);
  }, [page, eleve]);

  /* =========================
   RÉCUP PARCOURS CÔTÉ ÉLÈVE
  ========================= */
  useEffect(() => {
    const fetchStudentParcours = async () => {
      if (eleve && modeConnexion === "eleve") {
        const gid = eleve.group_id ?? null;
        if (!gid) {
          setParcoursGlobaux([]);
          return;
        }
        try {
          const { data, error } = await supabase
            .from("parcours")
            .select("*")
            .contains("groupes_associes", [gid]);

          if (error) {
            console.error("Erreur récup parcours élève:", error);
            setParcoursGlobaux([]);
            return;
          }
          setParcoursGlobaux(data || []);
        } catch (e) {
          console.error("Erreur inattendue parcours élève:", e);
          setParcoursGlobaux([]);
        }
      }
    };
    fetchStudentParcours();
  }, [eleve, modeConnexion]);

  /* =========================
             RENDER
  ========================= */
  return (
    <DndProvider backend={HTML5Backend}>
      {chargementInitial ? (
        <div className="text-white p-8">Chargement en cours...</div>
      ) : (
        <div style={{ padding: 20 }}>
          {/* === Accueil public === */}
          {modeConnexion === "accueil" && !professeur && !eleve && page === "accueil" && (
            <ParcoursPlus
              setPage={setPage}
              setModeConnexion={setModeConnexion}
              setProfesseur={setProfesseur}
              setEleve={setEleveAndCache}
            />
          )}

          {/* --- Mot de passe oublié (publique) --- */}
          {modeConnexion === "accueil" && page === "MotDePasseOublie" && (
            <MotDePasseOublie setPage={setPage} setModeConnexion={setModeConnexion} />
          )}

          {/* =====================
                Espace PROF
          ===================== */}
          {professeur && modeConnexion === "prof" && (
            <>
              {page === "AccueilProf" && (
                <AccueilProf
                  setPage={setPage}
                  professeur={professeur}
                  setProfesseur={setProfesseur}
                  setModeConnexion={setModeConnexion}
                  handleDeconnexion={handleDeconnexion}
                />
              )}

              {page === "Parametres" && (
                <Parametres
                  professeur={professeur}
                  setProfesseur={setProfesseur}
                  professeurs={professeurs}
                  setProfesseurs={setProfesseurs}
                  supabase={supabase}
                  ParametresProf={ParametresProf}
                  setParametresProf={setParametresProf}
                  setPage={setPage}
                />
              )}

              {page === "nouveauMotDePasse" && (
                <NouveauMotDePasse setPage={setPage} professeur={professeur} />
              )}

              {page === "Association" && (
                <Association
                  page={page}
                  setPage={setPage}
                  professeur={professeur}
                  groupes={groupes}
                  parcoursGlobaux={parcoursGlobaux}
                  setParcoursGlobaux={setParcoursGlobaux}
                  dossiersParcours={dossiersParcours}
                />
              )}

              {page === "gestionGroupes" && (
                <GestionGroupes
                  setPage={setPage}
                  professeur={professeur}
                  setProfesseur={setProfesseur}
                  setModeConnexion={setModeConnexion}
                  setSelectedGroup={handleSelectGroupForStudents}
                />
              )}

              {page === "GestionEleves" && selectedGroup && (
                <GestionEleves
                  setPage={setPage}
                  professeur={professeur}
                  setModeConnexion={setModeConnexion}
                  selectedGroup={selectedGroup}
                />
              )}

              {page === "GestionEleves" && !selectedGroup && (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex-col p-4">
                  <p className="text-xl mb-4 text-center">
                    Veuillez sélectionner un groupe depuis la page de gestion des groupes pour voir ou ajouter des élèves.
                  </p>
                  <button
                    onClick={() => setPage("gestionGroupes")}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all durée-300 transform hover:scale-105"
                  >
                    Retour à la gestion des groupes
                  </button>
                </div>
              )}

              {page === "gestionBalises" && (
                <GestionBalises setPage={setPage} professeur={professeur} balises={balises} setBalises={setBalises} />
              )}

              {page === "gestionParcours" && <GestionParcours setPage={setPage} professeur={professeur} />}

              {page === "CreerUnNouveauParcours" && (
                <CreerUnNouveauParcours
                  setPage={setPage}
                  professeur={professeur}
                  balisesGlobales={balises}
                  setParcoursGlobaux={setParcoursGlobaux}
                  parcoursId={parcoursId}
                />
              )}

              {page === "MesParcours" && (
                <MesParcours setPage={setPage} professeur={professeur} setParcoursId={setParcoursId} />
              )}

              {page === "gestionResultats" && <GestionResultats setPage={setPage} professeur={professeur} />}

              {page === "GestionResultatsTentatives" && (
                <GestionResultatsTentatives setPage={setPage} professeur={professeur} />
              )}

              {page === "GestionPoints" && <GestionPoints setPage={setPage} professeur={professeur} />}

              {page === "GestionResultatsProgressivite" && (
                <GestionResultatsProgressivite setPage={setPage} professeur={professeur} />
              )}

              {page === "PartageParcours" && <PartageParcours setPage={setPage} professeur={professeur} />}

              {/* >>> NEW <<< — Tableau de config par parcours */}
              {page === "configurationPersonnalisee" && (
                <ConfigurationPersonnalisee setPage={setPage} />
              )}

              {/* >>> NEW <<< — Barème tentatives ciblé pour un parcours */}
              {page === "gestionResultatsTentatives_parcours" && (
                <GestionResultatsTentatives setPage={setPage} professeur={professeur} />
              )}
            </>
          )}

          {/* =====================
               Espace ÉLÈVE
          ===================== */}
          {eleve && modeConnexion === "eleve" && (
            <>
              {page === "AccueilEleve" && (
                <AccueilEleve setPage={setPage} eleveConnecte={eleve} handleDeconnexion={handleDeconnexion} />
              )}

              {page === "EcrireResultat" && (
                <EcrireResultat
                  setPage={setPage}
                  eleveConnecte={eleve}
                  parcoursGlobaux={parcoursGlobaux}
                  groupes={groupes}
                  dossiersParcours={dossiersParcours}
                  parcoursTerminesEleves={parcoursTerminesEleves}
                  setParcoursActif={setParcoursActif}
                  setAffichageResultat={setAffichageResultat}
                />
              )}

              {page === "StatistiquesEleve" && (
                <StatistiquesEleve
                  setPage={setPage}
                  eleveConnecte={eleve}
                  parcoursGlobaux={parcoursGlobaux}
                  groupes={groupes}
                  dossiersParcours={dossiersParcours}
                  parcoursTerminesEleves={parcoursTerminesEleves}
                  setParcoursActif={setParcoursActif}
                  setAffichageResultat={setAffichageResultat}
                  resultatsEleves={resultatsEleves}
                  modePoints={modePoints}
                  baremePointsGlobal={baremePointsGlobal}
                  baremeEvaluation={baremeEvaluation}
                  baremePointsParcours={baremePointsParcours}
                />
              )}
            </>
          )}

          {/* --- Création de compte (publique) --- */}
          {page === "CreationCompteProf" && modeConnexion === "accueil" && (
            <CreationCompteProf
              setPage={setPage}
              setModeConnexion={setModeConnexion}
              newProfName={newProfName}
              setNewProfName={setNewProfName}
              newProfPrenom={newProfPrenom}
              setNewProfPrenom={setNewProfPrenom}
              newProfEmail={newProfEmail}
              setNewProfEmail={setNewProfEmail}
              newProfPassword={newProfPassword}
              setNewProfPassword={setNewProfPassword}
              newProfPasswordConfirm={newProfPasswordConfirm}
              setNewProfPasswordConfirm={setNewProfPasswordConfirm}
              professeurs={professeurs}
              genererCodeUnique={(liste: Professeur[]) => {
                const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                let code: string;
                do {
                  const longueur = Math.floor(Math.random() * 3) + 8; // 8 à 10
                  code = Array.from({ length: longueur })
                    .map(() => lettres[Math.floor(Math.random() * lettres.length)])
                    .join("");
                } while (liste.some((p) => p.code === code));
                return code;
              }}
              setCodeValidationEnvoye={setCodeValidationEnvoye}
              supabase={supabase}
              emailjs={emailjs}
            />
          )}

          {/* --- Lien de récupération (publique) --- */}
          {page === "nouveauMotDePasse" && modeConnexion === "accueil" && (
            <NouveauMotDePasse setPage={setPage} professeur={professeur} />
          )}
        </div>
      )}
    </DndProvider>
  );
}
