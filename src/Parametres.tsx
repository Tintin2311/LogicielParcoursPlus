import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, MapPin, BookOpen, Target, Award, Eye, EyeOff, ArrowLeft, ArrowRight, Compass, Settings, Lock, Edit3, Check, X, Shield, Zap, HelpCircle, Palette, User, FolderOpen, Bell, Globe
} from 'lucide-react';

const Parametres = ({
  professeur,
  setProfesseur,
  professeurs,
  setProfesseurs,
  supabase,
  ParametresProf,
  setParametresProf,
  setPage,
  modifierCode,
  setModifierCode,
  nouveauCodeUnique,
  setNouveauCodeUnique,
  messageErreurCode,
  setMessageErreurCode,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('account'); // Default to 'account'

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handler for updating a professor's property in state and Supabase
  const updateProfessorProperty = async (property, value) => {
    const updatedProf = {
      ...professeur,
      [property]: value,
    };
    setProfesseur(updatedProf);

    // Update in local professors array
    setProfesseurs(
      professeurs.map((p) =>
        p.user_id === updatedProf.user_id ? updatedProf : p
      )
    );

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('professeurs')
        .update({ [property]: value })
        .eq('user_id', professeur?.user_id);

      if (error) {
        console.error(`Error updating ${property}:`, error);
        alert(`❌ Erreur lors de la mise à jour de ${property}.`);
      } else {
        console.log(`✅ ${property} mis à jour avec succès !`);
      }
    } catch (err) {
      console.error(`Unexpected error updating ${property}:`, err);
      alert(`❌ Une erreur inattendue est survenue lors de la mise à jour de ${property}.`);
    }
  };

  // Handler for updating ParametresProf property
  const updateParametresProfProperty = async (property, value) => {
    const updatedParametresProf = {
      ...ParametresProf,
      [property]: value,
    };
    setParametresProf(updatedParametresProf);

    // Update in Supabase (assuming ParametresProf is linked to the professor's user_id)
    try {
      const { error } = await supabase
        .from('parametres_prof') // Assuming a table named 'parametres_prof'
        .update({ [property]: value })
        .eq('user_id', professeur?.user_id); // Link to professor's user_id

      if (error) {
        console.error(`Error updating ParametresProf ${property}:`, error);
        alert(`❌ Erreur lors de la mise à jour du paramètre ${property}.`);
      } else {
        console.log(`✅ Paramètre ${property} mis à jour avec succès !`);
      }
    } catch (err) {
      console.error(`Unexpected error updating ParametresProf ${property}:`, err);
      alert(`❌ Une erreur inattendue est survenue lors de la mise à jour du paramètre ${property}.`);
    }
  };

  const menuItems = [
    { id: 'account', label: 'Compte', icon: User, description: 'Gérer les informations du compte et la sécurité' },
    { id: 'personal', label: 'Données Personnelles', icon: Users, description: 'Mettre à jour votre profil et vos préférences' },
    { id: 'appearance', label: 'Apparence', icon: Palette, description: 'Personnaliser l\'interface utilisateur et les couleurs' },
    { id: 'content', label: 'Contenu Pédagogique', icon: BookOpen, description: 'Gérer les parcours, les leçons et les créations' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Gérer les alertes et les préférences de communication' },
    { id: 'language', label: 'Langue et Région', icon: Globe, description: 'Définir la langue et les formats régionaux' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2"
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
            Paramètres
          </h1>
          <p className="text-xl text-white/80 font-light">
            Configuration et préférences du compte
          </p>
        </div>

        {/* Bouton retour */}
        <div className="absolute top-8 left-8">
          <button
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
            onClick={() => setPage('AccueilProf')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Side Menu */}
          <div className="lg:w-1/4 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden">
            <h2 className="text-3xl font-bold text-white mb-6">Navigation</h2>
            <nav>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center w-full px-5 py-3 mb-3 rounded-xl text-left transition-all duration-300 transform
                    ${selectedMenu === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-white/70 hover:bg-white/15 hover:text-white'
                    }`}
                  onClick={() => setSelectedMenu(item.id)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <span className="block font-semibold text-lg">{item.label}</span>
                    <span className="block text-sm opacity-80">{item.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Display Area */}
          <div className="lg:w-3/4">
            {selectedMenu === 'account' && (
              <div className="space-y-8">
                {/* Section Code Unique */}
                <div className="group relative bg-gradient-to-br from-blue-400/20 to-cyan-600/20 backdrop-blur-xl rounded-3xl p-8 border border-blue-400/30 hover:border-blue-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-blue-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Code Unique</h3>
                        <p className="text-white/70 text-sm">Code d'identification (6 à 20 caractères)</p>
                      </div>
                    </div>

                    {!modifierCode ? (
                      <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center">
                          <div className="text-2xl font-mono text-cyan-400 bg-cyan-400/20 px-4 py-2 rounded-lg mr-4">
                            {professeur?.code || ""}
                          </div>
                          <div className="text-white/60 text-sm">
                            Code actuel
                          </div>
                        </div>
                        <button
                          className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                          onClick={() => {
                            setModifierCode(true);
                            setNouveauCodeUnique(professeur?.code || "");
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier le code
                        </button>
                      </div>
                    ) : (
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              value={nouveauCodeUnique}
                              onChange={(e) => {
                                const code = e.target.value.toUpperCase();
                                if (code.length > 20) return;
                                setNouveauCodeUnique(code.replace(/[^A-Z0-9]/g, ""));
                              }}
                              maxLength={20}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-lg font-mono border border-white/20 focus:border-cyan-400 focus:outline-none transition-all duration-300 uppercase"
                              placeholder="ENTREZ VOTRE CODE"
                            />
                            <div className="text-white/60 text-sm mt-2">
                              {nouveauCodeUnique.length}/20 caractères
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (nouveauCodeUnique.length < 6) {
                                setMessageErreurCode(
                                  "Le code doit contenir au moins 6 caractères."
                                );
                                return;
                              }

                              const { data, error } = await supabase
                                .from("professeurs")
                                .select("*")
                                .eq("code", nouveauCodeUnique);

                              if (error) {
                                console.error(error);
                                setMessageErreurCode(
                                  "Erreur lors de la vérification du code."
                                );
                                return;
                              }

                              if (
                                data.length > 0 &&
                                data[0].user_id !== professeur?.user_id
                              ) {
                                setMessageErreurCode("Code déjà utilisé !");
                                return;
                              }

                              const { error: updateError } = await supabase
                                .from("professeurs")
                                .update({ code: nouveauCodeUnique })
                                .eq("user_id", professeur?.user_id);

                              if (updateError) {
                                console.error(updateError);
                                setMessageErreurCode(
                                  "Erreur lors de la mise à jour du code."
                                );
                                return;
                              }

                              const updatedProf = {
                                ...professeur,
                                code: nouveauCodeUnique,
                              };
                              setProfesseur(updatedProf);
                              setModifierCode(false);
                              setMessageErreurCode("");
                              alert("✅ Code unique mis à jour avec succès !");
                            }}
                            className="flex items-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Valider
                          </button>
                        </div>
                      </div>
                    )}

                    {messageErreurCode && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                        {messageErreurCode}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Mot de passe */}
                <div className="group relative bg-gradient-to-br from-red-400/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 border border-red-400/30 hover:border-red-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-red-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Sécurité</h3>
                        <p className="text-white/70 text-sm">Gestion du mot de passe</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <button
                        onClick={() => setPage("nouveauMotDePasse")}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <Lock className="w-5 h-5 mr-2" />
                        Modifier le mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'personal' && (
              <div className="space-y-8">
                {/* Section Informations Personnelles (Example) */}
                <div className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-purple-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Informations Personnelles</h3>
                        <p className="text-white/70 text-sm">Mettre à jour vos informations de profil.</p>
                      </div>
                    </div>

                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-4">
  <div>
    <label className="block text-white/70 text-sm font-semibold mb-2" htmlFor="professeurNom">Nom</label>
    <input
      id="professeurNom"
      type="text"
      value={professeur?.nom || ''}
      onChange={(e) => updateProfessorProperty('nom', e.target.value)}
      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-lg font-mono border border-white/20 focus:border-purple-400 focus:outline-none transition-all duration-300"
      placeholder="Votre nom"
    />
  </div>
  <div>
    <label className="block text-white/70 text-sm font-semibold mb-2" htmlFor="professeurPrenom">Prénom</label>
    <input
      id="professeurPrenom"
      type="text"
      value={professeur?.prenom || ''}
      onChange={(e) => updateProfessorProperty('prenom', e.target.value)}
      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-lg font-mono border border-white/20 focus:border-purple-400 focus:outline-none transition-all duration-300"
      placeholder="Votre prénom"
    />
  </div>
  <p className="text-white/60 text-sm">Ces informations seront affichées sur votre profil.</p>
</div>

                  </div>
                </div>

                {/* Section Préférences de partage */}
                <div className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 hover:border-purple-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-purple-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Préférences de partage</h3>
                        <p className="text-white/70 text-sm">Contrôlez les partages de contenu</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={professeur?.refuserPartage || false}
                            onChange={(e) => updateProfessorProperty('refuserPartage', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            professeur?.refuserPartage ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                              professeur?.refuserPartage ? 'translate-x-6' : 'translate-x-0.5'
                            } translate-y-0.5`}></div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-white font-semibold">
                            {professeur?.refuserPartage ? 'Partages refusés' : 'Partages autorisés'}
                          </div>
                          <div className="text-white/60 text-sm">
                            {professeur?.refuserPartage
                              ? 'Vous ne recevrez pas de partages de contenu'
                              : 'Vous pouvez recevoir des partages de contenu'
                            }
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'appearance' && (
              <div className="space-y-8">
                {/* Section Thème & Couleurs (Example) */}
                <div className="group relative bg-gradient-to-br from-emerald-400/20 to-lime-600/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-400/30 hover:border-emerald-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-emerald-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Palette className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Thème & Couleurs</h3>
                        <p className="text-white/70 text-sm">Personnaliser l'apparence de l'interface.</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <label className="block text-white/70 text-sm font-semibold mb-2">Couleur principale</label>
                      <input
                        type="color"
                        value={ParametresProf?.mainColor || '#60A5FA'} // Default blue
                        onChange={(e) => updateParametresProfProperty('mainColor', e.target.value)}
                        className="w-full h-12 rounded-lg border-none cursor-pointer"
                        title="Choisissez votre couleur principale"
                      />
                      <p className="text-white/60 text-sm mt-2">Sélectionnez une couleur pour les éléments principaux de l'interface.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'content' && (
              <div className="space-y-8">
               

                {/* Section Gestion des leçons (Sub-menu example) */}
                <div className="group relative bg-gradient-to-br from-orange-400/20 to-red-600/20 backdrop-blur-xl rounded-3xl p-8 border border-orange-400/30 hover:border-orange-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-orange-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Gestion des Leçons</h3>
                        <p className="text-white/70 text-sm">Organisez et modifiez vos leçons existantes.</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <button
                        onClick={() => alert("Fonctionnalité de gestion des leçons à implémenter.")}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Gérer mes leçons
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'notifications' && (
              <div className="space-y-8">
                {/* Section Préférences de Notification (Example) */}
                <div className="group relative bg-gradient-to-br from-yellow-400/20 to-amber-600/20 backdrop-blur-xl rounded-3xl p-8 border border-yellow-400/30 hover:border-yellow-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-yellow-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Notifications</h3>
                        <p className="text-white/70 text-sm">Gérer vos préférences de notification.</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <label className="flex items-center cursor-pointer mb-4">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={ParametresProf?.emailNotifications || false}
                            onChange={(e) => updateParametresProfProperty('emailNotifications', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            ParametresProf?.emailNotifications ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                              ParametresProf?.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            } translate-y-0.5`}></div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-white font-semibold">Notifications par e-mail</div>
                          <div className="text-white/60 text-sm">Recevoir les alertes importantes par e-mail.</div>
                        </div>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={ParametresProf?.inAppNotifications || false}
                            onChange={(e) => updateParametresProfProperty('inAppNotifications', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            ParametresProf?.inAppNotifications ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                              ParametresProf?.inAppNotifications ? 'translate-x-6' : 'translate-x-0.5'
                            } translate-y-0.5`}></div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-white font-semibold">Notifications in-app</div>
                          <div className="text-white/60 text-sm">Recevoir les notifications directement dans l'application.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMenu === 'language' && (
              <div className="space-y-8">
                {/* Section Langue et Région (Example) */}
                <div className="group relative bg-gradient-to-br from-indigo-400/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-8 border border-indigo-400/30 hover:border-indigo-400/50 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-indigo-500/25">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Langue et Région</h3>
                        <p className="text-white/70 text-sm">Définir la langue d'affichage et les formats régionaux.</p>
                      </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <label className="block text-white/70 text-sm font-semibold mb-2" htmlFor="appLanguage">Langue de l'application</label>
                      <select
                        id="appLanguage"
                        value={ParametresProf?.language || 'fr'}
                        onChange={(e) => updateParametresProfProperty('language', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white text-lg border border-white/20 focus:border-indigo-400 focus:outline-none transition-all duration-300"
                      >
                        <option value="fr" className="bg-blue-900 text-white">Français</option>
                        <option value="en" className="bg-blue-900 text-white">English</option>
                        <option value="es" className="bg-blue-900 text-white">Español</option>
                      </select>
                      <p className="text-white/60 text-sm mt-2">Choisissez la langue d'affichage de l'application.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;