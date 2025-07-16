import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

<div
          style={{
            padding: 20,
            maxWidth: 400,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2>🔐 Modification du mot de passe</h2>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            Le mot de passe doit contenir entre 6 et 20 caractères, une
            majuscule, un chiffre et un symbole.
          </p>

          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPasswordInput}
            onChange={(e) => setCurrentPasswordInput(e.target.value)}
            style={{ width: "300px" }}
          />

          <br />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newProfPassword}
            onChange={(e) => {
              const value = e.target.value;
              setNewProfPassword(value);
              const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
              setPasswordValide(
                regex.test(value) && value === newProfPasswordConfirm
              );
            }}
            style={{ width: "300px" }}
          />

          <br />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={newProfPasswordConfirm}
            onChange={(e) => {
              const value = e.target.value;
              setNewProfPasswordConfirm(value);
              const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
              setPasswordValide(
                regex.test(newProfPassword) && newProfPassword === value
              );
            }}
            style={{ width: "300px" }}
          />

          <br />
          <button
            disabled={!passwordValide}
            onClick={async () => {
              const password = newProfPassword.trim();
              const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

              if (!regex.test(password)) {
                alert(
                  "❌ Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un symbole."
                );
                return;
              }

              if (newProfPassword !== newProfPasswordConfirm) {
                alert("❌ Les mots de passe ne correspondent pas.");
                return;
              }

              try {
                // ✅ Vérifier la session utilisateur avant updateUser
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.getSession();
                if (sessionError || !sessionData.session) {
                  alert(
                    "❌ Session expirée ou utilisateur non connecté, veuillez vous reconnecter."
                  );
                  setPage("connexion"); // renvoie vers ta page de connexion
                  return;
                }

                // ✅ Modifier le mot de passe dans Supabase Auth
                const { error: authError } = await supabase.auth.updateUser({
                  password,
                });
                if (authError) {
                  console.error(authError);
                  alert(
                    "❌ Erreur lors de la mise à jour du mot de passe : " +
                      authError.message
                  );
                  return;
                }

                alert("✅ Mot de passe modifié avec succès !");
                setNewProfPassword("");
                setNewProfPasswordConfirm("");
                setPasswordValide(false);
                setPage("parametres");
              } catch (error) {
                console.error(error);
                alert("❌ Erreur inattendue : " + error.message);
              }
            }}
          >
            ✅ Valider le changement
          </button>
        </div>

export default modifierMotDePasse;