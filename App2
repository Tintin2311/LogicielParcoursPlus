
import "./index.css";
import ParcoursPlus from "./ParcoursPlus";
import CreationCompteProf from "./CreationCompteProf"
import AccueilProf from "./AccueilProf";
import Parametres from "./Parametres";
import GestionGroupes from "./GestionGroupes";
import GestionBalises from "./GestionBalises";
import GestionParcours from "./GestionParcours";
import CreerUnNouveauParcours from "./CreerUnNouveauParcours";
import MesParcours from "./MesParcours";
import NouveauMotDePasse from "./NouveauMotDePasse";

import { createClient } from "@supabase/supabase-js";
import { updateDataWithOwner } from "./supabaseFunctions";

const supabaseUrl = "https://aswhubzprehjnunbpkwc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2h1YnpwcmVoam51bmJwa3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDg5ODcsImV4cCI6MjA2NzU4NDk4N30.rNsW9i0jxtOxHYsoagVXjqz_yMHmVmKumf8c8LKuB0Q"; // Clé publique (anon)

export const supabase = createClient(supabaseUrl, supabaseKey);

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  UserPlus,
  Check,
  X,
} from "lucide-react";

import emailjs from "emailjs-com";
emailjs.init("lyiZ-6klparD8KCNw"); // ← ta clé publique
// Ajouter ces interfaces au début du fichier, après les imports
interface Partage {
  id: string;
  nom: string;
  type: "dossier" | "parcours";
  date?: number;
  expediteur?: string;
  contenu?: any;
}


interface Professeur {
  user_id: string;
  code: string;
  nom?: string;
  email?: string;
  refuserPartage?: boolean;
  partagesRecus: Partage[];
}

function Groupes({
  parcoursGlobaux,
  groupes,
  setGroupes,
  professeurs,
  setProfesseurs,
}) {
  const [nomGroupe, setNomGroupe] = useState("");
  const [eleves, setEleves] = useState([]);
  const [nomEleve, setNomEleve] = useState("");
  const [eleveEditIndex, setEleveEditIndex] = useState(null);
  const [nouveauNomEleve, setNouveauNomEleve] = useState("");
  const [groupeActif, setGroupeActif] = useState(null);
  const [nouveauCodeEleve, setNouveauCodeEleve] = useState("");

  const creerGroupe = () => {
    if (!nomGroupe.trim()) return;
    const nouveau = {
      id: Date.now(),
      nom: nomGroupe.trim(),
      eleves: [],
    };
    setGroupes([...groupes, nouveau]);
    setNomGroupe("");
    setGroupeActif(nouveau.id);
  };

  const genererCode = () => {
    let code;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (groupes.some((g) => g.eleves.some((e) => e.code === code)));
    return code;
  };

  const ajouterEleve = () => {
    if (!nomEleve.trim() || groupeActif === null) return;
    const nouveauxGroupes = groupes.map((g) => {
      if (g.id === groupeActif) {
        return { ...g, eleves: [...g.eleves, nomEleve.trim()] };
      }
      return g;
    });
    setGroupes(nouveauxGroupes);
    setNomEleve("");
  };
}
function genererCodeUnique(professeurs) {
  const lettres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code;
  do {
    const longueur = Math.floor(Math.random() * 3) + 8; // entre 8 et 10
    code = "";
    for (let i = 0; i < longueur; i++) {
      code += lettres[Math.floor(Math.random() * lettres.length)];
    }
  } while (professeurs.some((p) => p.code === code));
  return code;
}
function genererCodeEleveUnique(groupes) {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
  } while (groupes.some((g) => g.eleves.some((e) => e.code === code)));
  return code;
}

export default function App() {
const pages = [
  "accueil",
  "espaceProf",
  "espaceEleve",
  "gestionResultats",
  "nouveauMotDePasse",
  "motDePasseOublie",
  "confirmationEmail",
  "CreationCompteProf",
  "CreerUnNouveauParcours",
  "partageParcours",
  "partageRecevoir",
  "partageEnvoyer",
  "Parametres",
  "modifierMotDePasse",
  "gestionGroupes",
  "gestionBalises",
  "gestionParcours",
  "gestionResultatsTentatives",
  "gestionResultatsProgressivite",
  "personnaliserParParcours",
  "CreerUnGroupe",
  "MesParcours",
  "associationParcoursGroupe",
  "infosGroupe",
  "infosEleve",
  "ecrireResultat",
  "gestionPoints",
  "saisieResultat",
  "statistiquesEleve",
  "mesGroupes",
  "eleve",
  "connexion",
  "temporaire",
] as const;

type PageType = typeof pages[number];


const [page, setPage] = useState<PageType>("accueil");

useEffect(() => {
  if (page) {
    localStorage.setItem("dernierePage", page);
  }
}, [page]);

useEffect(() => {
  const derniere = localStorage.getItem("dernierePage");

  if (derniere) {
    setPage(derniere);
  } else {
    setPage("accueil"); // par défaut
  }
}, []);


  useEffect(() => {
    const hash = window.location.hash; // ex: #access_token=...&type=recovery
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");

    console.log("🔍 Hash détecté :", hash);
    console.log("🔍 Type détecté :", type);

    if (type === "recovery") {
      console.log(
        "✅ Type recovery détecté, redirection vers nouveauMotDePasse"
      );
      setPage("nouveauMotDePasse");
    }
  }, []);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailMotDePasseOublie, setEmailMotDePasseOublie] = useState("");
  const [passwordValide, setPasswordValide] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [modifierCode, setModifierCode] = useState(false);
  const [nouveauCodeUnique, setNouveauCodeUnique] = useState("");
  const [messageErreurCode, setMessageErreurCode] = useState("");
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [professeur, setProfesseur] = useState<Professeur | null>(null);
  const [parcoursGlobaux, setParcoursGlobaux] = useState<any[]>([]);
  const [dossiersParcours, setDossiersParcours] = useState<any[]>([]);
  const [newProfName, setNewProfName] = useState("");
  const [newProfEmail, setNewProfEmail] = useState("");
  const [groupes, setGroupes] = useState([]);
  const [newParcoursNom, setNewParcoursNom] = useState("");
  const [nombreBalises, setNombreBalises] = useState(0);
  const [nomExpediteurPartage, setNomExpediteurPartage] = useState("");
  const [parcoursActif, setParcoursActif] = useState(null);
  const [resultatsEleves, setResultatsEleves] = useState([]);
  const [parcoursTerminesEleves, setParcoursTerminesEleves] = useState([]);
  const [ongletResultats, setOngletResultats] = useState("tentatives"); // "tentatives" ou "progressivite"
  const [affichageResultat, setAffichageResultat] = useState(false);
  const [balisesGlobales, setBalisesGlobales] = useState<{ code: string }[]>(
    []
  );
  const [session, setSession] = useState(null);
  const [balisesTemp, setBalisesTemp] = useState([]);
  const [emailPartage, setEmailPartage] = useState("");
  const [parcoursSelectionnes, setParcoursSelectionnes] = useState([]);
  const [partagesRecus, setPartagesRecus] = useState([]);
  const [renommerParcoursRecu, setRenommerParcoursRecu] = useState({});
  const [refuserPartage, setRefuserPartage] = useState(false);
  const [codeProfEleve, setCodeProfEleve] = useState("");
  const [codeEleve, setCodeEleve] = useState("");
  const [eleveConnecte, setEleveConnecte] = useState(null); // objet { nom, code }
  const [modeConnexion, setModeConnexion] = useState("accueil"); // "accueil", "prof", "eleve"
  const [newProfPrenom, setNewProfPrenom] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");
  const [newProfPasswordConfirm, setNewProfPasswordConfirm] = useState("");
  const [codeValidationEnvoye, setCodeValidationEnvoye] = useState("");
  const [codeEntreParLeProf, setCodeEntreParLeProf] = useState("");
  const [nomGroupe, setNomGroupe] = useState("");
  const [nomEleve, setNomEleve] = useState("");
  const [groupeActif, setGroupeActif] = useState(null);
  const [groupeTemporaire, setGroupeTemporaire] = useState(null);
  const [groupeCree, setGroupeCree] = useState(false);
  const [editParcoursId, setEditParcoursId] = useState(null);
  const termine = false;
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const partages: any[] = [];
  const [ongletPartage, setOngletPartage] = useState("envoyer");
  const [eleveActif, setEleveActif] = useState<EleveType | null>(null);
  
  type EleveType = {
    nom: string;
    code: string;
    // ajouter d'autres propriétés selon tes besoins
  };

  useEffect(() => {
    const restaurerSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        const userId = data.session.user.id;
        // Aller chercher le professeur lié à ce user_id
        const { data: prof, error: profError } = await supabase
          .from("professeurs")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (prof) {
          setProfesseur(prof);
          setModeConnexion("prof");
          setPage("accueil");
          console.log("✅ Session restaurée automatiquement");
        } else {
          console.log("❌ Aucun professeur lié à cet user_id");
        }
      }
    };
    restaurerSession();
  }, []);
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));

    if (params.get("type") === "recovery") {
      console.log("🔑 Lien de récupération détecté");
      setPage("nouveauMotDePasse");
    }
  }, []);
  const [dossiersGroupes, setDossiersGroupes] = useState([]); // Chaque dossier aura {id, nom, groupes: [ids]}
  const [nouveauNomDossier, setNouveauNomDossier] = useState("");
  const [codeProfesseurDestinataire, setCodeProfesseurDestinataire] =
    useState("");
  const [elementsAEnvoyer, setElementsAEnvoyer] = useState([]); // pour stocker les dossiers/parcours sélectionnés
  const [modeCreationBalises, setModeCreationBalises] = useState<
    "manuel" | "automatique" | null
  >(null);
  const [modeCreationParcoursParDefaut, setModeCreationParcoursParDefaut] =
    useState(null); // "manuel", "automatique" ou null

  const [dossierSelectionPourAjout, setDossierSelectionPourAjout] =
    useState(null);
  const [
    dossierSelectionPourAjoutParcours,
    setDossierSelectionPourAjoutParcours,
  ] = useState(null);
  type BaremeEvaluation = {
  type: "=" | "≥" | "≤" | "entre";
  tentatives?: number;
  minTentatives?: number;
  maxTentatives?: number;
  couleur: string;
  points?: number | string;
};

  const [baremeEvaluation, setBaremeEvaluation] = useState<BaremeEvaluation[]>([
  { type: "=", tentatives: 1, couleur: "green", points: 1 },
  { type: "=", tentatives: 2, couleur: "yellow", points: 0.5 },
  { type: "=", tentatives: 3, couleur: "orange", points: 0 },
  { type: "≥", tentatives: 4, couleur: "red", points: -1 },
]);


  const handleConnexion = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail.trim().toLowerCase(),
    password: loginPassword,
  });

  if (error) {
    alert("Email ou mot de passe incorrect.");
    console.error(error);
  } else {
    setSession(data.session);
    console.log("✅ Connexion réussie :", data);

    const { data: prof, error: profError } = await supabase
      .from("professeurs")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (prof) {
      setProfesseur(prof);
      setModeConnexion("prof");
      setPage("accueil");
    } else {
      alert("⚠️ Compte introuvable dans la base professeurs.");
    }
  }
};

  async function creerCompteProfesseur() {
    const password = newProfPassword;
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!regex.test(password)) {
      alert(
        "Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un symbole."
      );
      return;
    }
    if (newProfPassword !== newProfPasswordConfirm) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    const emailExistant = professeurs.some(
      (p) => p.email === newProfEmail.trim().toLowerCase()
    );
    if (emailExistant) {
      alert("Un compte existe déjà avec cette adresse email.");
      return;
    }

    const codeGenere = genererCodeUnique(professeurs);
    const codeConfirmation = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    setCodeValidationEnvoye(codeConfirmation);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newProfEmail.trim().toLowerCase(),
      password: newProfPassword,
    });
    if (authError) {
      alert("Erreur de création de compte: " + authError.message);
      return;
    }

    const nouveauProf = {
      user_id: authData.user.id, // <-- clé pour retrouver le professeur automatiquement
      nom: newProfName,
      prenom: newProfPrenom,
      email: newProfEmail.trim().toLowerCase(),
      code: codeGenere,
      Parametres: {},
      refuserPartage: false,
      partagesRecus: [],
    };

    try {
      const { data, error } = await supabase
        .from("professeurs")
        .insert([nouveauProf])
        .select();

      if (error) {
        console.error(error);
        alert(
          "❌ Erreur lors de la création du compte Supabase : " + error.message
        );
        return;
      }

      console.log("✅ Compte professeur créé dans Supabase :", data);

      // Envoi du mail de confirmation
      emailjs
        .send(
          "service_6dkmtzr",
          "template_g1aj6kg",
          {
            to_email: newProfEmail,
            confirmation_code: codeConfirmation,
          },
          "lyiZ-6klparD8KCNw"
        )
        .then(() => {
          console.log("✅ Email envoyé !");
        })
        .catch((error) => {
          console.error("❌ Erreur envoi email", error);
        });

      setPage("confirmationEmail");
    } catch (err) {
      console.error("❌ Erreur inattendue :", err);
      alert("❌ Une erreur inattendue est survenue.");
    }
  }
  const [prendEnCompteTentatives, setPrendEnCompteTentatives] = useState(true);
  const [priseEnCompteTentatives, setPriseEnCompteTentatives] = useState(true);
  const [modePoints, setModePoints] = useState("cumul"); // "cumul", "parParcours", "parTentatives", "personnalise"
  const [baremePointsGlobal, setBaremePointsGlobal] = useState({
    pointsParParcours: 0,
    baremeTentatives: [],
  });
  const [baremePointsParcours, setBaremePointsParcours] = useState({});
  const [ParametresProf, setParametresProf] = useState({
    modeCreationParcours: null, // "manuel" | "automatique" | null
  });

  // 2️⃣ Effet pour appliquer automatiquement le mode de création de parcours selon les paramètres prof
  useEffect(() => {
    if (
      page === "CreerUnNouveauParcours" && // si on est sur la page de création de parcours
      !modeCreationBalises && // si aucun mode choisi manuellement
      ParametresProf?.modeCreationParcours // si le prof a paramétré "manuel" ou "automatique"
    ) {
      setModeCreationBalises(ParametresProf.modeCreationParcours); // applique automatiquement le mode
    }
  }, [page, ParametresProf, modeCreationBalises]);

  const groupeEstDansUnAutreDossier = (idGroupe) => {
    return dossiersGroupes.some((d) => d.groupes.includes(idGroupe));
  };

  const parcoursEstDansUnAutreDossierParcours = (idParcours) => {
    return dossiersParcours.some((d) => d.parcours.includes(idParcours));
  };

  const creerParcours = () => {
    if (!newParcoursNom.trim() || balisesTemp.length !== nombreBalises) {
      alert("Veuillez remplir correctement le formulaire.");
      return;
    }

    const nomNormalise = newParcoursNom.trim().toLowerCase();

    const existeDeja = parcoursGlobaux.some(
      (p) =>
        p.nom.trim().toLowerCase() === nomNormalise && p.id !== editParcoursId
    );

    if (existeDeja) {
      alert(
        "❌ Un parcours avec ce nom existe déjà. Veuillez choisir un autre nom."
      );
      return;
    }

    if (editParcoursId) {
      // Si on modifie un parcours existant
      setParcoursGlobaux(
        parcoursGlobaux.map((p) =>
          p.id === editParcoursId
            ? { ...p, nom: newParcoursNom, balises: balisesTemp }
            : p
        )
      );
      setEditParcoursId(null); // Réinitialise après modification
    } else {
      // Sinon on en crée un nouveau
      setParcoursGlobaux([
        ...parcoursGlobaux,
        {
          id: Date.now(),
          nom: newParcoursNom,
          balises: balisesTemp,
          groupesAssocies: [],
        },
      ]);
    }
    alert(`✅ "${newParcoursNom}" validé.`);

    // ✅ Demander si l’utilisateur souhaite créer un autre parcours
    if (confirm("Souhaitez-vous créer un autre parcours ?")) {
      // Reset complet en sortant puis revenant pour forcer le rechargement clean
      setPage("temporaire");
      setTimeout(() => {
        setNewParcoursNom("");
        setNombreBalises(0);
        setBalisesTemp([]);
        setModeCreationBalises(null);
        setPage("CreerUnNouveauParcours");
      }, 50);
    } else {
      // Nettoyage et retour à la gestion des parcours
      setNewParcoursNom("");
      setNombreBalises(0);
      setBalisesTemp([]);
      setModeCreationBalises(null);
      setPage("gestionParcours");
    }
  };
  const handleChangePassword = async () => {
    if (!nouveauPassword.trim()) {
      alert("❌ Merci de saisir un mot de passe.");
      return;
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: nouveauPassword.trim(),
      });
      if (authError) {
        console.error(authError);
        alert("❌ Erreur Auth : " + authError.message);
        return;
      }

      const updated = await updateDataWithOwner(
        "professeurs",
        { password: nouveauPassword.trim() },
        {}
      );
      if (!updated) {
        alert("❌ Erreur lors de la mise à jour dans la table professeurs.");
        return;
      }

      alert("✅ Mot de passe modifié avec succès !");
      setNouveauPassword("");
      setPage("Parametres");
    } catch (error) {
      console.error(error);
      alert("❌ Erreur inattendue : " + error.message);
    }
  };

  const [attribuerPointsParBalise, setAttribuerPointsParBalise] =
    useState(false);

  const creerGroupe = () => {
    if (!nomGroupe.trim()) return;
    const nouveau = {
      id: Date.now(),
      nom: nomGroupe.trim(),
      eleves: [],
    };
    setGroupes([...groupes, nouveau]);
    setNomGroupe("");
    setGroupeActif(nouveau.id);
  };

  const addDossier = (parentId) => {
    const nom = prompt("Nom du dossier :");
    if (!nom) return;

    const nouveauDossier = {
      id: Date.now(),
      nom,
      groupes: [],
      sousDossiers: [],
    };

    if (parentId === null) {
      setDossiersGroupes([...dossiersGroupes, nouveauDossier]);
    } else {
      const ajouterSousDossier = (dossiers) =>
        dossiers.map((d) =>
          d.id === parentId
            ? { ...d, sousDossiers: [...d.sousDossiers, nouveauDossier] }
            : { ...d, sousDossiers: ajouterSousDossier(d.sousDossiers) }
        );
      setDossiersGroupes(ajouterSousDossier(dossiersGroupes));
    }
  };
  const supprimerDossier = (id) => {
    const confirmer = window.confirm(
      "Supprimer ce dossier et ses sous-dossiers ?"
    );
    if (!confirmer) return;

    const supprimerRecursif = (dossiers) =>
      dossiers
        .filter((d) => d.id !== id)
        .map((d) => ({
          ...d,
          sousDossiers: supprimerRecursif(d.sousDossiers),
        }));

    setDossiersGroupes(supprimerRecursif(dossiersGroupes));
  };
  const [nouveauPassword, setNouveauPassword] = useState("");

  const renderDossier = (dossier, niveau = 0) => (
    <div
      key={dossier.id}
      style={{
        marginLeft: `${niveau * 20}px`,
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "5px",
        marginTop: "5px",
        background: "#f9f9f9",
      }}
    >
      <strong>{dossier.nom}</strong>
      <button
        onClick={() => addDossier(dossier.id)}
        style={{ marginLeft: "10px" }}
      >
        ➕ Sous-dossier
      </button>
      <button
        onClick={() => supprimerDossier(dossier.id)}
        style={{ marginLeft: "5px", color: "red" }}
      >
        🗑️ Supprimer
      </button>

      {dossier.groupes.map((idGroupe) => {
        const groupe = groupes.find((g) => g.id === idGroupe);
        return (
          <div key={idGroupe} style={{ marginLeft: "15px" }}>
            {groupe ? groupe.nom : "Groupe inconnu"}
          </div>
        );
      })}

      {dossier.sousDossiers.map((sd) => renderDossier(sd, niveau + 1))}
    </div>
  );

  const ajouterEleve = () => {
    if (!nomEleve.trim() || groupeActif === null) return;
    const nouveauxGroupes = groupes.map((g) => {
      if (g.id === groupeActif) {
        return { ...g, eleves: [...g.eleves, nomEleve.trim()] };
      }
      return g;
    });
    setGroupes(nouveauxGroupes);
    setNomEleve("");
  };

  const enregistrerParcoursRecu = (parcours) => {
    const nomFinal =
      (renommerParcoursRecu[parcours.id] || "").trim() || parcours.nom;
    setParcoursGlobaux([...parcoursGlobaux, { ...parcours, nom: nomFinal }]);
    alert(`Parcours "${nomFinal}" enregistré !`);
    setRenommerParcoursRecu((prev) => {
      const updated = { ...prev };
      delete updated[parcours.id];
      return updated;
    });
  };
console.log("modeConnexion =", modeConnexion);
console.log("professeur =", professeur);
 return (
  <div style={{ padding: 20 }}>
    {/* Page d'accueil avant connexion */}
    {modeConnexion === "accueil" && !professeur && (
      <ParcoursPlus
        setPage={setPage}
        setModeConnexion={setModeConnexion}
        setProfesseur={setProfesseur}
      />
    )}

    {/* Pages visibles seulement après connexion */}
    {professeur && (
      <>
{page === "AccueilProf" && (
  <AccueilProf
    setPage={setPage}
    setProfesseur={setProfesseur}
    setModeConnexion={setModeConnexion}
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
            modifierCode={modifierCode}
            setModifierCode={setModifierCode}
            nouveauCodeUnique={nouveauCodeUnique}
            setNouveauCodeUnique={setNouveauCodeUnique}
            messageErreurCode={messageErreurCode}
            setMessageErreurCode={setMessageErreurCode}
          />
        )}

        {page === "CreationCompteProf" && (
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
            genererCodeUnique={genererCodeUnique}
            setCodeValidationEnvoye={setCodeValidationEnvoye}
            supabase={supabase}
            emailjs={emailjs}
          />
        )}


        {page === "nouveauMotDePasse" && (
          <NouveauMotDePasse
            setPage={setPage}
            setNouveauPassword={setNouveauPassword}
            nouveauPassword={nouveauPassword}
            handleChangePassword={handleChangePassword}
          />
        )}

        {page === "gestionGroupes" && professeur && (
  <GestionGroupes
    setPage={setPage}
    professeur={professeur}
    // ... autres props nécessaires
  />
)}
  {page === "gestionBalises" && professeur && (
  <GestionBalises
    setPage={setPage}
    professeur={professeur}
   
  />
)}

{page === "gestionParcours" && professeur && (
  <GestionParcours
    setPage={setPage}
    professeur={professeur}
   
  />
)}

{page === "CreerUnNouveauParcours" && professeur && (
  <CreerUnNouveauParcours
    setPage={setPage}
    professeur={professeur}
   
  />
)}

{page === "MesParcours" && professeur && (
  <MesParcours
    setPage={setPage}
    professeur={professeur}
   
  />
)}


        {page === "gestionResultatsTentatives" && (
          <div>Page gestionResultatsTentatives à implémenter</div>
        )}

        {page === "gestionPoints" && (
          <div>Page gestionPoints à implémenter</div>
        )}

        {page === "motDePasseOublie" && (
          <div>Page motDePasseOublie à implémenter</div>
        )}
      </>
    )}
    </div>
);
}
