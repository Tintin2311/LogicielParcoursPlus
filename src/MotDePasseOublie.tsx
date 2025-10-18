// src/MotDePasseOublie.tsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

type Mode = "accueil" | "prof" | "eleve";

type Props = {
  setPage: (p: string) => void;
  setModeConnexion: (m: Mode) => void;
};

const MotDePasseOublie: React.FC<Props> = ({ setPage, setModeConnexion }) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const value = email.trim().toLowerCase();
    if (!value) {
      alert("❌ Veuillez entrer une adresse email.");
      return;
    }

    setSending(true);
    try {
      // Redirection autorisée dans Supabase > Auth > URL Configuration
      const redirectTo = `${window.location.origin}/auth-callback?from=recovery`;

      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo,
      });

      if (error) {
        // Même message côté UI pour ne pas divulguer d'info
        console.error("[resetPasswordForEmail] erreur :", error);
      }

      alert("✅ Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.");
      setModeConnexion("accueil");
      setPage("accueil");
    } catch (err: any) {
      console.error("Erreur inattendue:", err);
      alert("❌ Erreur inattendue : " + (err?.message ?? "inconnue"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setModeConnexion("accueil");
            setPage("accueil");
          }}
          className="mb-4 text-white/80 hover:text-white"
        >
          ⬅️ Retour
        </button>

        <h2 className="text-2xl font-bold mb-2">🔐 Récupération du mot de passe</h2>
        <p className="text-white/80 mb-6">
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="email"
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full px-4 py-3 rounded-xl font-semibold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? "Envoi..." : "📩 Envoyer le lien de réinitialisation"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MotDePasseOublie;
