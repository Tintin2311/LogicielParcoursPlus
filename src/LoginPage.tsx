// src/LoginPage.jsx - Composant de la page de connexion et d'inscription

import React, { useState } from 'react';
// Importation pour emailjs (si utilisé pour l'envoi d'emails de confirmation)
import emailjs from "emailjs-com";

// Initialisation de emailjs (assurez-vous que votre clé publique est correcte ici)
// Cette ligne devrait être présente une seule fois dans votre application,
// idéalement au niveau le plus haut ou dans un fichier de configuration.
// Si elle est déjà dans App.tsx ou DashboardProfesseur.jsx, vous pouvez la commenter ici.
emailjs.init("lyiZ-6klparD8KCNw"); // ← votre clé publique emailjs

function LoginPage({ supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(''); // Pour les messages d'erreur spécifiques au formulaire
  const [isSignUp, setIsSignUp] = useState(false); // Pour alterner entre connexion et inscription

  // États pour l'inscription (transférés de l'ancien App.tsx)
  const [newProfName, setNewProfName] = useState("");
  const [newProfPrenom, setNewProfPrenom] = useState("");
  const [newProfPasswordConfirm, setNewProfPasswordConfirm] = useState("");
  const [codeValidationEnvoye, setCodeValidationEnvoye] = useState(""); // Si vous utilisez un code de validation par email

  // NOTE: La fonction genererCodeUnique pour les professeurs est maintenant dans App.tsx (fetchOrCreateProfesseurProfile)
  // ou pourrait être une fonction utilitaire globale si nécessaire ailleurs.

  const handleAuth = async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page
    setLoading(true);
    setMessage('');
    setError('');

    if (isSignUp) {
      // Logique d'inscription
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setLoading(false);
        return;
      }
      // Votre regex de validation de mot de passe de l'ancien App.tsx
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
      if (!regex.test(password)) {
        setError("Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un symbole.");
        setLoading(false);
        return;
      }
      if (password !== newProfPasswordConfirm) {
        setError("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
      }

      // Tenter l'inscription via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError("Erreur d'inscription: " + authError.message);
        console.error('Erreur d\'inscription Supabase:', authError);
      } else if (authData.user && !authData.session) {
        // Inscription réussie, mais confirmation email requise
        setMessage("Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.");
        // Optionnel: Envoyer le code de confirmation par email si vous utilisez emailjs pour cela
        // const codeConfirmation = Math.floor(100000 + Math.random() * 900000).toString();
        // setCodeValidationEnvoye(codeConfirmation);
        // emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
        //   to_email: email,
        //   confirmation_code: codeConfirmation,
        // }, "YOUR_USER_ID")
        // .then(() => console.log("Email envoyé !"))
        // .catch((err) => console.error("Erreur envoi email", err));
      } else if (authData.session) {
        // Inscription réussie avec auto-connexion (l'App.tsx gérera la création du profil)
        setMessage("Inscription réussie et connexion automatique !");
        console.log("Inscription réussie avec auto-connexion.");
      }
    } else {
      // Logique de connexion
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError("Connexion échouée : " + authError.message);
        console.error('Erreur de connexion Supabase:', authError);
      } else if (data.user) {
        setMessage("Connexion réussie !");
        console.log("Connexion réussie. App.tsx va maintenant charger le profil.");
        // App.tsx gérera la redirection vers DashboardProfesseur via le listener onAuthStateChange
      } else {
        setError("Aucune session active après connexion.");
      }
    }
    setLoading(false);
  };

  // Fonction pour gérer le mot de passe oublié (si vous la gardez ici)
  const handleForgotPassword = async () => {
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError("Veuillez saisir votre email pour réinitialiser le mot de passe.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin, // Redirige l'utilisateur vers votre app après le reset
      });
      if (error) {
        setError("Erreur lors de l'envoi de l'email de réinitialisation: " + error.message);
      } else {
        setMessage("Un email de réinitialisation de mot de passe a été envoyé à votre adresse.");
      }
    } catch (e: any) {
      setError("Une erreur inattendue est survenue: " + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '450px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          {isSignUp ? 'Créer un compte Professeur' : 'Connexion Professeur'}
        </h2>

        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
        {message && <p style={{ color: 'green', textAlign: 'center', marginBottom: '15px' }}>{message}</p>}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="newProfPrenom" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénom:</label>
                <input
                  id="newProfPrenom"
                  type="text"
                  value={newProfPrenom}
                  onChange={(e) => setNewProfPrenom(e.target.value)}
                  required={isSignUp}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="newProfName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom:</label>
                <input
                  id="newProfName"
                  type="text"
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  required={isSignUp}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mot de passe:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Confirmer mot de passe:</label>
              <input
                id="confirmPassword"
                type="password"
                value={newProfPasswordConfirm}
                onChange={(e) => setNewProfPasswordConfirm(e.target.value)}
                required={isSignUp}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}
          >
            {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se Connecter')}
          </button>
        </form>

        {!isSignUp && (
          <button
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              width: '100%',
              textAlign: 'center',
              marginTop: '10px'
            }}
          >
            Mot de passe oublié ?
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555' }}>
          {isSignUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail('');
              setPassword('');
              setNewProfName('');
              setNewProfPrenom('');
              setNewProfPasswordConfirm('');
              setMessage('');
              setError('');
            }}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Connectez-vous' : 'Inscrivez-vous'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;