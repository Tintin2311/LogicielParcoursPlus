// src/NouveauMotDePasseRecuperation.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Lock, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";

type Props = {
  setPage: (p: string) => void;
};

export default function NouveauMotDePasseRecuperation({ setPage }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [canReset, setCanReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    /**
     * Vérifie si une session "recovery" est active.
     * Supabase crée automatiquement une session temporaire quand l’utilisateur
     * clique sur le lien reçu par e-mail (avec #type=recovery dans l’URL).
     */
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Erreur récupération session:", error);
        setMessage("⚠️ Impossible de vérifier la session.");
        return;
      }

      const session = data?.session;
      if (session?.user) {
        setCanReset(true);
      } else {
        setMessage(
          "❌ Lien invalide ou expiré. Merci de recommencer la procédure de réinitialisation."
        );
      }
    };

    checkSession();
  }, []);

  /** Met à jour le mot de passe de l'utilisateur connecté */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Erreur updateUser:", error);
      setMessage("❌ Erreur : " + error.message);
      return;
    }

    setMessage("✅ Votre mot de passe a été mis à jour avec succès !");
    setTimeout(() => setPage("accueil"), 2000);
  };

  // Si le lien est invalide
  if (!canReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center text-white">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-white/20">
          <p className="mb-4">{message ?? "Chargement..."}</p>
          <button
            onClick={() => setPage("accueil")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Formulaire de saisie du nouveau mot de passe
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full text-white text-center border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setPage("accueil")}
            className="flex items-center text-sm text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Annuler
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Nouveau mot de passe
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-white/70 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="relative mb-6">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-white/70 hover:text-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Mettre à jour le mot de passe
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              message.startsWith("✅") ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
