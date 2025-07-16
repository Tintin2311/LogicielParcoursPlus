import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle, GraduationCap, Shield } from 'lucide-react';


const CreationCompteProf = ({ 
  setPage, 
  setModeConnexion, 
  newProfName, 
  setNewProfName,
  newProfPrenom,
  setNewProfPrenom,
  newProfEmail,
  setNewProfEmail,
  newProfPassword,
  setNewProfPassword,
  newProfPasswordConfirm,
  setNewProfPasswordConfirm,
  professeurs,
  genererCodeUnique,
  setCodeValidationEnvoye,
  supabase,
  emailjs
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (newProfPassword) {
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      setPasswordValid(regex.test(newProfPassword));
    } else {
      setPasswordValid(true);
    }
  }, [newProfPassword]);

  const handleCreateAccount = async () => {
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

    try {
      // 1. D'abord créer le compte utilisateur dans Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: newProfEmail.trim().toLowerCase(),
          password: newProfPassword,
        });

      if (authError) {
        console.error(
          "❌ Erreur lors de la création du compte Auth :",
          authError
        );
        alert(
          "❌ Erreur lors de la création du compte : " +
            authError.message
        );
        return;
      }

      // 2. Ensuite créer le profil professeur avec user_id
      const codeGenere = genererCodeUnique(professeurs);
      const codeConfirmation = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      setCodeValidationEnvoye(codeConfirmation);

      const nouveauProf = {
        user_id: authData.user.id, // 🔥 AJOUT IMPORTANT : lier au compte utilisateur
        nom: newProfName,
        prenom: newProfPrenom,
        email: newProfEmail.trim().toLowerCase(),
        password: newProfPassword, // Note: vous devriez éviter de stocker le mot de passe en clair
        code: codeGenere,
        Parametres: {},
        refuserPartage: false,
        partagesRecus: [],
      };

      const { data, error } = await supabase
        .from("professeurs")
        .insert([nouveauProf])
        .select();

      if (error) {
        console.error("❌ Erreur Supabase :", error);
        alert(
          "❌ Erreur lors de la création du profil : " + error.message
        );
        return;
      }

      console.log("✅ Compte professeur créé sur Supabase :", data);

      // 3. Envoyer l'email de confirmation
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
      </div>

      <div
        className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => {
              setPage("accueil");
              setModeConnexion("accueil");
            }}
            className="flex items-center text-white/60 hover:text-white transition-colors duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm">Retour</span>
          </button>
          <div className="text-center">
            <div className="relative group">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full mb-6 shadow-2xl transform group-hover:scale-110 transition-all duration-500 hover:rotate-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-white drop-shadow-lg mr-2" />
                  <Shield className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 mb-3 tracking-tight">
              Création
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mb-4">
              de compte professeur
            </h2>
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-green-400"></div>
              <span className="text-2xl">🧑‍🏫</span>
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-green-400"></div>
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Rejoignez notre plateforme d'enseignement de la course d'orientation
            </p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Formulaire de création de compte */}
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 shadow-2xl">
            <div className="space-y-6">
              {/* Nom */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Nom"
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                />
              </div>

              {/* Prénom */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={newProfPrenom}
                  onChange={(e) => setNewProfPrenom(e.target.value)}
                  className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={newProfEmail}
                  onChange={(e) => setNewProfEmail(e.target.value)}
                  className="w-full px-4 py-4 pl-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                />
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={newProfPassword}
                  onChange={(e) => setNewProfPassword(e.target.value)}
                  className="w-full px-4 py-4 pl-12 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Exigences du mot de passe - apparaît uniquement si non valide */}
              {!passwordValid && newProfPassword && (
                <div className="bg-red-500/10 backdrop-blur-sm rounded-lg p-3 border border-red-400/20 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  <p className="text-red-300 text-xs mb-1">Le mot de passe doit contenir :</p>
                  <ul className="text-red-200/80 text-xs space-y-0.5">
                    <li>• Au moins 6 caractères</li>
                    <li>• Une majuscule</li>
                    <li>• Un chiffre</li>
                    <li>• Un symbole</li>
                  </ul>
                </div>
              )}

              {/* Confirmation mot de passe */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={newProfPasswordConfirm}
                  onChange={(e) => setNewProfPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-4 pl-12 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Bouton de création */}
              <button
                onClick={handleCreateAccount}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center group"
              >
                <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Créer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreationCompteProf;