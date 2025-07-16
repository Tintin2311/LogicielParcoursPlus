import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { supabase } from "./supabaseClient";

const NouveauMotDePasse = ({
  setPage,
  supabase,
  newProfPassword,
  setNewProfPassword,
  newProfPasswordConfirm,
  setNewProfPasswordConfirm,
}) => {
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h2>🔐 Définir un nouveau mot de passe</h2>
      <p>Entrez votre nouveau mot de passe ci-dessous.</p>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={newProfPassword}
        onChange={(e) => setNewProfPassword(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={newProfPasswordConfirm}
        onChange={(e) => setNewProfPasswordConfirm(e.target.value)}
      />
      <br />
      <button
        onClick={async () => {
          if (newProfPassword !== newProfPasswordConfirm) {
            alert("❌ Les mots de passe ne correspondent pas.");
            return;
          }
          const { error } = await supabase.auth.updateUser({
            password: newProfPassword.trim(),
          });
          if (error) {
            alert("❌ Erreur : " + error.message);
            return;
          }
          alert("✅ Mot de passe mis à jour !");
          setNewProfPassword("");
          setNewProfPasswordConfirm("");
          setPage("connexion");
        }}
      >
        ✅ Valider le nouveau mot de passe
      </button>
    </div>
  );
};

export default NouveauMotDePasse;
