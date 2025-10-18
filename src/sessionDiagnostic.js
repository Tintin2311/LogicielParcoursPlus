// sessionDiagnostic.js - Fonction utilitaire pour diagnostiquer les problèmes de session

export const diagnostiquerSession = async (supabase) => {
  console.log("🔍 === DÉBUT DU DIAGNOSTIC DE SESSION SUPABASE ===");

  // 1. Vérifier le Local Storage
  console.log("Vérification du Local Storage pour les clés Supabase...");
  const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
  if (supabaseKeys.length > 0) {
    console.log("Clés Supabase trouvées dans le Local Storage:", supabaseKeys);
    supabaseKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        // Essayer de parser si c'est un JSON, sinon afficher tel quel
        console.log(`- ${key}:`, JSON.parse(value));
      } catch (e) {
        console.log(`- ${key}: (Erreur de parsing ou non-JSON) ${value}`);
      }
    });
  } else {
    console.log("Aucune clé Supabase trouvée dans le Local Storage.");
  }

  // 2. Obtenir la session actuelle de Supabase
  console.log("Tentative de récupération de la session Supabase actuelle...");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("❌ Erreur lors de la récupération de la session:", sessionError.message);
  } else if (session) {
    console.log("✅ Session Supabase actuelle:", session);
    console.log("   - User ID:", session.user.id);
    console.log("   - Email:", session.user.email);
    // Afficher une partie du token pour des raisons de sécurité
    console.log("   - Access Token (début):", session.access_token ? session.access_token.substring(0, 10) + "..." : "N/A");
    console.log("   - Expires At:", session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "N/A");
    console.log("   - Expires In (seconds):", session.expires_in);

    // 3. Vérifier la validité du token localement
    const currentTime = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < currentTime) {
      console.warn("⚠️ Le token de session Supabase semble expiré localement.");
    } else {
      console.log("Le token de session Supabase est valide localement.");
    }

  } else {
    console.log("ℹ️ Aucune session Supabase active ou valide n'a été trouvée via supabase.auth.getSession().");
  }

  // 4. Vérifier l'état de l'utilisateur (si une session a été trouvée)
  if (session && session.user) {
    console.log("Tentative de récupération de l'état de l'utilisateur...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", userError.message);
    } else if (user) {
      console.log("✅ Utilisateur Supabase actuel:", user);
    } else {
      console.log("ℹ️ Aucun utilisateur Supabase actif trouvé.");
    }
  }

  // 5. Tentative de rafraîchissement du token
  console.log("Tentative de rafraîchissement du token...");
  const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError) {
    console.error("❌ Erreur lors du rafraîchissement du token:", refreshError.message);
  } else if (refreshedSession) {
    console.log("✅ Token rafraîchi avec succès. Nouvelle expiration:", new Date(refreshedSession.expires_at * 1000).toLocaleString());
  } else {
    console.log("ℹ️ Pas de rafraîchissement de token nécessaire ou possible à ce stade.");
  }
  
  console.log("✅ === FIN DU DIAGNOSTIC ===");
};