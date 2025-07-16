import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";


<div style={{ textAlign: "center", marginTop: 100 }}>
          <button
            onClick={() => {
              setPage("accueil");
              setModeConnexion("accueil");
            }}
            style={{ position: "absolute", top: 10, left: 10 }}
          >
            ⬅️ Retour
          </button>
          <h2>🔐 Récupération du mot de passe</h2>
          <p>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
            de mot de passe.
          </p>
          <input
            type="email"
            placeholder="Votre adresse email"
            value={emailMotDePasseOublie}
            onChange={(e) => setEmailMotDePasseOublie(e.target.value)}
            style={{ width: "300px" }}
          />
          <br />
          <button
            onClick={async () => {
              const email = emailMotDePasseOublie.trim().toLowerCase();
              if (!email) {
                alert("❌ Veuillez entrer une adresse email.");
                return;
              }

              try {
                const { data, error } =
                  await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: "https://x7623y.csb.app",
                  });

                if (error) {
                  console.error(error);
                  alert("❌ Erreur : " + error.message);
                  return;
                }

                alert(
                  "✅ Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
                );
                setPage("connexion"); // redirige vers la page de connexion
              } catch (err) {
                console.error(err);
                alert("❌ Erreur inattendue : " + err.message);
              }
            }}
            style={{ marginTop: 10 }}
          >
            📩 Envoyer le lien de réinitialisation
          </button>
        </div>
        export default motDePasseOublie;