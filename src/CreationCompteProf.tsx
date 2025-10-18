// src/CreationCompteProf.tsx
import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle, GraduationCap, Shield,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

type ModeConnexion = "accueil" | "prof" | "eleve";
type ProfesseurLight = { email?: string | null; code?: string | null; user_id?: string | null };
type Props = {
  setPage: (p: string) => void;
  setModeConnexion: (m: ModeConnexion) => void;
  newProfName: string; setNewProfName: (v: string) => void;
  newProfPrenom: string; setNewProfPrenom: (v: string) => void;
  newProfEmail: string; setNewProfEmail: (v: string) => void;
  newProfPassword: string; setNewProfPassword: (v: string) => void;
  newProfPasswordConfirm: string; setNewProfPasswordConfirm: (v: string) => void;
  professeurs: ProfesseurLight[];
  genererCodeUnique: (liste: ProfesseurLight[]) => string;
  setCodeValidationEnvoye: (code: string) => void;
  supabase: SupabaseClient;
};

const LS_PENDING_PROF = "pending_prof_profile";

const CreationCompteProf: React.FC<Props> = (props) => {
  const {
    setPage, setModeConnexion,
    newProfName, setNewProfName,
    newProfPrenom, setNewProfPrenom,
    newProfEmail, setNewProfEmail,
    newProfPassword, setNewProfPassword,
    newProfPasswordConfirm, setNewProfPasswordConfirm,
    professeurs, genererCodeUnique, setCodeValidationEnvoye, supabase,
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => setIsLoaded(true), []);
  useEffect(() => {
    setPasswordValid(
      !newProfPassword || /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(newProfPassword)
    );
  }, [newProfPassword]);

  const cleanEmail = (s: string) => s.trim().toLowerCase();

  const validate = (): string | null => {
    if (!newProfName.trim() || !newProfPrenom.trim()) return "Renseigne ton nom et prénom.";
    if (!newProfEmail.trim()) return "Renseigne ton adresse email.";
    if (!passwordValid) return "Mot de passe invalide (6+, 1 maj, 1 chiffre, 1 symbole).";
    if (newProfPassword !== newProfPasswordConfirm) return "Les mots de passe ne correspondent pas.";
    const emailNorm = cleanEmail(newProfEmail);
    if (professeurs.some(p => cleanEmail(p.email || "") === emailNorm))
      return "Un compte existe déjà avec cette adresse email.";
    return null;
  };

  const handleCreateAccount = async () => {
    if (loading) return;
    const err = validate();
    if (err) { alert(err); return; }

    setLoading(true);
    try {
      const email = cleanEmail(newProfEmail);

      // 1) Auth signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: newProfPassword,
      });

      if (authError) {
        if (authError.status === 429) {
          alert("Trop de tentatives de création à la suite. Réessaie dans quelques instants.");
        } else {
          alert("Erreur Auth : " + authError.message);
        }
        console.error("Auth error:", authError);
        return;
      }

      const userId = authData.user?.id ?? null;
      const hasSession = !!authData.session;

      // Prépare la ligne de profil
      const profRow = {
        user_id: userId!,
        nom: newProfName.trim(),
        prenom: newProfPrenom.trim(),
        email,
        code: genererCodeUnique(professeurs),
      };
      const codeConfirmation = Math.floor(100000 + Math.random() * 900000).toString();
      setCodeValidationEnvoye(codeConfirmation);

      if (hasSession && userId) {
        // 2a) Email de confirmation désactivé → on peut insérer tout de suite
        const { error: insertError } = await supabase.from("professeurs").insert([profRow]);
        if (insertError) {
          console.error("Supabase insert error:", insertError);
          alert("Erreur lors de la création du profil : " + insertError.message);
          return;
        }
      } else {
        // 2b) Email de confirmation activé → pas de session
        // On stocke temporairement le profil pour l'insérer AU PREMIER SIGN-IN
        localStorage.setItem(LS_PENDING_PROF, JSON.stringify(profRow));
      }

      alert("✅ Compte créé ! Vérifie ton email pour confirmer l’adresse.");
      setPage("accueil");
      setModeConnexion("accueil");
    } catch (e) {
      console.error("Unexpected error:", e);
      alert("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* décor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }} />
      </div>

      <div className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        {/* header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => { setPage("accueil"); setModeConnexion("accueil"); }}
            className="flex items-center text-white/60 hover:text-white transition-colors duration-200 group"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full mb-6 shadow-2xl">
              <GraduationCap className="w-12 h-12 text-white drop-shadow-lg mr-2" />
              <Shield className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 mb-3 tracking-tight">
              Création
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mb-4">
              de compte professeur
            </h2>
          </div>

          <div className="w-24" />
        </div>

        {/* form */}
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 shadow-2xl">
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><User className="w-5 h-5" /></div>
                <input type="text" placeholder="Nom" value={newProfName} onChange={e => setNewProfName(e.target.value)} className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50" disabled={loading} />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><User className="w-5 h-5" /></div>
                <input type="text" placeholder="Prénom" value={newProfPrenom} onChange={e => setNewProfPrenom(e.target.value)} className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50" disabled={loading} />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><Mail className="w-5 h-5" /></div>
                <input type="email" placeholder="Adresse email" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50" disabled={loading} />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><Lock className="w-5 h-5" /></div>
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={newProfPassword} onChange={e => setNewProfPassword(e.target.value)} className="w-full px-4 py-4 pl-12 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50" disabled={loading} />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" disabled={loading}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {!passwordValid && newProfPassword && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-400/20">
                  <p className="text-red-300 text-xs mb-1">Le mot de passe doit contenir :</p>
                  <ul className="text-red-200/80 text-xs space-y-0.5">
                    <li>• 6 caractères ou plus</li><li>• 1 majuscule</li><li>• 1 chiffre</li><li>• 1 symbole</li>
                  </ul>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><Lock className="w-5 h-5" /></div>
                <input type={showPasswordConfirm ? "text" : "password"} placeholder="Confirmer le mot de passe" value={newProfPasswordConfirm} onChange={e => setNewProfPasswordConfirm(e.target.value)} className="w-full px-4 py-4 pl-12 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50" disabled={loading} />
                <button type="button" onClick={() => setShowPasswordConfirm(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" disabled={loading}>
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button onClick={handleCreateAccount} disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 shadow-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {loading ? "Création en cours..." : "Créer mon compte"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreationCompteProf;
