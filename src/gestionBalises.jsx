import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Snowflake, MapPin, ArrowLeft, Save, Info, Search, Filter } from 'lucide-react';

const GestionBalises = ({ setPage }) => {
  const [balises, setBalises] = useState(() => {
    try {
      const storedBalises = localStorage.getItem('balises');
      // Assurez-vous que chaque balise a un 'id' unique et un état 'active' par défaut
      const parsedBalises = storedBalises ? JSON.parse(storedBalises) : [];
      return parsedBalises.map(b => ({
        id: b.id || Date.now() + Math.random(), // Assurer un ID unique
        code: b.code || '',
        points: b.points || 0,
        frozen: b.frozen || false,
        editing: b.editing || false,
        active: (b.code && b.code.trim() !== '') // Définir 'active' basé sur la présence du code
      })).filter(b => b.code && b.code.trim() !== ''); // Filtre initial pour les balises valides au chargement
    } catch (error) {
      console.error("Erreur lors du chargement des balises depuis localStorage:", error);
      return [];
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingExistingBalise, setIsEditingExistingBalise] = useState(false);

  // Nouveaux états pour la recherche et le filtrage avancés
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('code'); // 'code' ou 'number'
  const [filterFrozenChecked, setFilterFrozenChecked] = useState(false); // Case à cocher pour gelées
  const [filterInactiveChecked, setFilterInactiveChecked] = useState(false); // Case à cocher pour inactives
  const [rangeFilterType, setRangeFilterType] = useState('none'); // 'none', 'range', 'list'
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [listFilter, setListFilter] = useState(''); // Ex: "1; 5; 7"

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('balises', JSON.stringify(balises.map(b => ({
          ...b,
          active: (b.code && b.code.trim() !== '') // Mettre à jour l'état 'active' avant sauvegarde
        }))));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des balises dans localStorage:", error);
      }
    }
    // Met à jour l'état si une balise est en cours d'édition
    setIsEditingExistingBalise(balises.some(balise => balise.editing));
  }, [balises, isLoaded]);

  const handleAddBalise = () => {
    if (balises.some(balise => balise.editing)) {
      alert("Veuillez valider la balise en cours de modification avant d'en créer une nouvelle.");
      return;
    }

    setBalises(prevBalises => [
      ...prevBalises,
      { id: Date.now() + Math.random(), code: '', points: 0, frozen: false, editing: true, active: false } // Nouvelle balise par défaut inactive et en mode édition
    ]);
  };

  const handleChangeBalise = (index, field, value) => {
    const newBalises = [...balises];
    if (field === 'points') {
      const cleanedValue = value.replace(/,/g, '.');
      newBalises[index][field] = (cleanedValue === '.' || cleanedValue === '') ? cleanedValue : (isNaN(parseFloat(cleanedValue)) ? '' : cleanedValue);
    } else {
      newBalises[index][field] = value.toUpperCase().trim();
    }
    setBalises(newBalises);
  };

  const displayPoints = (pointsValue) => {
    if (typeof pointsValue === 'string' && (pointsValue === '' || pointsValue === '.')) {
      return pointsValue;
    }
    try {
      const numValue = parseFloat(String(pointsValue).replace(/,/g, '.'));
      return isNaN(numValue) ? '' : numValue.toLocaleString('fr-FR', {
          minimumFractionDigits: numValue % 1 !== 0 ? 1 : 0,
          maximumFractionDigits: 2
      });
    } catch (e) {
      return '';
    }
  };

  const toggleEditMode = (originalIndex) => {
    const newBalises = [...balises];
    const baliseToEdit = newBalises[originalIndex];

    if (baliseToEdit.editing) {
      if (baliseToEdit.code.trim() === '') {
        alert("Le code de la balise est obligatoire pour valider sa création ou modification.");
        return;
      }
      baliseToEdit.points = parseFloat(String(baliseToEdit.points).replace(/,/g, '.')) || 0;
      baliseToEdit.editing = false;
      baliseToEdit.active = (baliseToEdit.code && baliseToEdit.code.trim() !== ''); // Mettre à jour l'état 'active'
    } else {
      if (balises.some(b => b.editing && b.id !== baliseToEdit.id)) { // Vérifie qu'une autre balise n'est pas en édition
        alert("Veuillez valider la balise en cours de modification avant d'en éditer une autre.");
        return;
      }
      baliseToEdit.editing = true;
    }
    setBalises(newBalises);
  };

  const toggleFreezeBalise = (originalIndex) => {
    const newBalises = [...balises];
    newBalises[originalIndex].frozen = !newBalises[originalIndex].frozen;
    setBalises(newBalises);
  };

  const handleDeleteBalise = (originalIndexToDelete) => {
    const baliseToDelete = balises[originalIndexToDelete];
    if (baliseToDelete.editing || balises.some((b, i) => i !== originalIndexToDelete && b.editing)) {
      alert("Veuillez valider la balise en cours de modification avant de supprimer.");
      return;
    }

    const confirmDelete = window.confirm(`❌ Êtes-vous sûr de vouloir supprimer la balise "${baliseToDelete.code || 'sans code'}" ?`);
    if (!confirmDelete) {
      return;
    }

    const reindexOption = window.confirm(
      "Voulez-vous réindexer les balises suivantes (la balise n° " + (originalIndexToDelete + 2) + " deviendra n° " + (originalIndexToDelete + 1) + ", etc.) ?\n\n" +
      "Cliquez sur OK pour réindexer (oui), ou Annuler pour ne pas modifier la numérotation des balises restantes (non)."
    );

    if (reindexOption) {
      const newBalises = balises.filter((_, i) => i !== originalIndexToDelete);
      setBalises(newBalises);
    } else {
      setBalises(balises.filter((_, i) => i !== originalIndexToDelete));
    }
  };

  // --- LOGIQUE DE FILTRAGE AVANCÉE ---
  const filteredBalises = balises.filter((balise, index) => {
    // 1. Recherche par code ou numéro
    const baliseNumber = index + 1; // Le numéro affiché de la balise
    const searchLower = searchTerm.toLowerCase();
    let matchesSearch = true;
    if (searchTerm) {
      if (searchType === 'code') {
        matchesSearch = balise.code.toLowerCase().includes(searchLower);
      } else { // searchType === 'number'
        matchesSearch = String(baliseNumber).includes(searchLower);
      }
    }

    // 2. Filtre d'état (gelées/inactives)
    let matchesStateFilter = true;
    if (filterFrozenChecked && !balise.frozen) {
      matchesStateFilter = false;
    }
    if (filterInactiveChecked && balise.active) { // 'active' est l'inverse d'inactive
      matchesStateFilter = false;
    }
    // Si aucune case n'est cochée, on ne filtre pas par état (toutes les balises sont affichées quelle que soit leur gel/activité)
    // Pas besoin de condition ici car matchesStateFilter reste true si les conditions précédentes ne sont pas remplies.


    // 3. Filtre par plage de numéros ou liste (R-F-H)
    let matchesRangeFilter = true;
    if (rangeFilterType === 'range' && (rangeStart || rangeEnd)) {
      const startNum = parseInt(rangeStart, 10);
      const endNum = parseInt(rangeEnd, 10);
      matchesRangeFilter = (isNaN(startNum) || baliseNumber >= startNum) &&
                           (isNaN(endNum) || baliseNumber <= endNum);
    } else if (rangeFilterType === 'list' && listFilter) {
      // MODIFICATION ICI : Utilisation du point-virgule et uniquement des numéros uniques
      const parts = listFilter.split(';').map(p => p.trim()).filter(p => p !== '');
      matchesRangeFilter = parts.some(part => {
        const num = Number(part);
        return !isNaN(num) && baliseNumber === num;
      });
    }

    return matchesSearch && matchesStateFilter && matchesRangeFilter;
  });

  const validatedBalises = balises.filter(b => b.code && b.code.trim() !== '' && !b.editing);
  const totalValidBalises = validatedBalises.length;
  // Pour "balises non associées", on peut considérer celles qui ne sont pas gelées et ont un code
  const balisesNonAssociees = validatedBalises.filter(b => !b.frozen).length; // Ceci est une hypothèse si non associées signifie "pas gelées"
  const frozenBalisesCount = validatedBalises.filter(b => b.frozen).length;

  const showNoBaliseMessage = balises.length === 0 && !isEditingExistingBalise;
  const isAnyBaliseBeingEdited = balises.some(balise => balise.editing);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden font-sans pb-32">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-0"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 transform -translate-x-1/2 -translate-y-1/2"
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
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 mb-2 drop-shadow-lg">
            Gestion des Balises
          </h1>
          <p className="text-lg text-white/80 font-light max-w-2xl mx-auto">
            Créez, configurez et organisez vos points de passage numériques pour vos parcours.
          </p>
        </div>

        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            onClick={() => setPage("AccueilProf")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'Accueil
          </button>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Balises Management Section */}
          <div className="group relative bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-xl rounded-3xl p-8 border border-green-400/30 hover:border-green-400/50 shadow-2xl mb-8 overflow-hidden transform transition-all duration-500 ease-out hover:scale-[1.005]">
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Mes Balises ({balises.filter(b => b.code && b.code.trim() !== '').length})
                    </h3>
                    <p className="text-white/70 text-sm">
                      Gérez et modifiez les propriétés de vos balises.
                    </p>
                  </div>
                </div>
                {/* Le bouton "Créer une balise" est désormais flottant en bas */}
              </div>

              {/* Barre de recherche et filtres avancés */}
              {balises.length > 0 && (
                <div className="mb-6 bg-black/10 p-5 rounded-xl border border-white/10">
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Filter className="w-6 h-6 mr-2 text-green-300" /> Options de Filtrage
                  </h4>

                  {/* Recherche par code ou numéro */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                    <div className="relative flex-1 w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={`Rechercher par ${searchType === 'code' ? 'code' : 'numéro'}...`}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none appearance-none cursor-pointer shadow-sm"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                      >
                        <option value="code" className="bg-gray-800 text-white">Code de balise</option>
                        <option value="number" className="bg-gray-800 text-white">Numéro de balise</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Filtres par état (gelées/inactives) */}
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
                    <label className="flex items-center text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-green-500 bg-white/20 border-white/30 rounded focus:ring-green-400 mr-2"
                        checked={filterFrozenChecked}
                        onChange={(e) => setFilterFrozenChecked(e.target.checked)}
                      />
                      Balises gelées
                    </label>
                    <label className="flex items-center text-white/80 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-green-500 bg-white/20 border-white/30 rounded focus:ring-green-400 mr-2"
                        checked={filterInactiveChecked}
                        onChange={(e) => setFilterInactiveChecked(e.target.checked)}
                      />
                      Balises inactives (codes vides)
                    </label>
                  </div>

                  {/* Filtre par plage de numéros ou liste */}
                  <div>
                    <label className="block text-white/80 mb-2">Filtrer par numéro de balise:</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative">
                        <select
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none appearance-none cursor-pointer shadow-sm"
                          value={rangeFilterType}
                          onChange={(e) => {
                            setRangeFilterType(e.target.value);
                            setRangeStart('');
                            setRangeEnd('');
                            setListFilter('');
                          }}
                        >
                          <option value="none" className="bg-gray-800 text-white">Aucun filtre</option>
                          <option value="range" className="bg-gray-800 text-white">Plage (Ex: 10 à 25)</option>
                          <option value="list" className="bg-gray-800 text-white">Liste (Ex: 1; 5; 7)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                        </div>
                      </div>

                      {rangeFilterType === 'range' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            placeholder="De (numéro)"
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="À (numéro)"
                            className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                          />
                        </div>
                      )}

                      {rangeFilterType === 'list' && (
                        <input
                          type="text"
                          placeholder="Ex: 1; 5; 7"
                          className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40 shadow-sm w-full sm:w-auto"
                          value={listFilter}
                          onChange={(e) => setListFilter(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Message si aucune balise validée OU si aucune balise du tout et pas en édition */}
              {showNoBaliseMessage && (
                <div className="text-center py-12 bg-black/10 rounded-2xl border border-white/10">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30">
                    <MapPin className="w-12 h-12 text-green-400 opacity-80" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Aucune balise enregistrée pour le moment.
                  </h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Utilisez le bouton "Créer une balise" en bas pour ajouter votre première balise.
                  </p>
                </div>
              )}

              {/* Message si aucune balise ne correspond aux filtres */}
              {filteredBalises.length === 0 && balises.length > 0 && (
                <div className="text-center py-12 bg-black/10 rounded-2xl border border-white/10">
                  <Info className="w-12 h-12 text-blue-400 opacity-80 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Aucune balise ne correspond à votre recherche ou à vos filtres.
                  </h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Essayez de modifier vos critères de recherche ou de filtre.
                  </p>
                </div>
              )}

              {/* Liste des balises (utilise filteredBalises) */}
              {filteredBalises.length > 0 && (
                <div className="space-y-4">
                  {filteredBalises.map((balise, mapIndex) => { // Utilisez mapIndex pour l'affichage uniquement
                    const baliseClasses = `relative bg-black/20 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 shadow-md
                      ${balise.frozen ? 'border-orange-400/50' : 'border-white/10'}
                      ${balise.editing ? 'ring-2 ring-yellow-400/50' : 'hover:bg-black/30'}`;

                    return (
                      <div
                        key={balise.id} // Clé unique pour React
                        className={baliseClasses}
                      >
                        {balise.frozen && (
                          <div className="absolute inset-0 bg-blue-900/10 rounded-xl flex items-center justify-center">
                            <Snowflake className="w-16 h-16 text-blue-300 opacity-30 animate-pulse" />
                          </div>
                        )}
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
                              {balises.indexOf(balise) + 1} {/* Afficher le numéro original */}
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div className="flex flex-col">
                              <label htmlFor={`code-${balise.id}`} className="text-white/60 text-sm mb-1 font-medium">Code de la balise</label>
                              {balise.editing ? (
                                <input
                                  id={`code-${balise.id}`}
                                  type="text"
                                  placeholder="Ex: A1, B2 (obligatoire)"
                                  value={balise.code}
                                  onChange={(e) => handleChangeBalise(balises.indexOf(balise), 'code', e.target.value)}
                                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white font-mono text-lg border border-white/20 focus:border-green-400 focus:outline-none transition-all duration-300 uppercase placeholder-white/40 shadow-sm"
                                />
                              ) : (
                                <p className="text-white font-mono text-xl font-bold">{balise.code || <span className="text-white/40">Non défini</span>}</p>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <label htmlFor={`points-${balise.id}`} className="text-white/60 text-sm mb-1 font-medium">Points attribués</label>
                              {balise.editing ? (
                                <input
                                  id={`points-${balise.id}`}
                                  type="text"
                                  placeholder="Ex: 10, 5.5"
                                  value={displayPoints(balise.points)}
                                  onChange={(e) => handleChangeBalise(balises.indexOf(balise), 'points', e.target.value)}
                                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white font-mono text-lg border border-white/20 focus:border-green-400 focus:outline-none transition-all duration-300 placeholder-white/40 shadow-sm"
                                />
                              ) : (
                                <p className="text-white font-mono text-xl font-bold">{displayPoints(balise.points)} <span className="text-white/60 font-normal">pts</span></p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
                            {/* Bouton Geler/Dégeler */}
                            <button
                              onClick={() => toggleFreezeBalise(balises.indexOf(balise))}
                              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 hover:scale-110 shadow-md ${
                                balise.frozen
                                  ? 'bg-orange-500/30 text-orange-200 border border-orange-500/40 hover:bg-orange-500/40' // Styles quand gelée (cliquable)
                                  : 'bg-blue-500/30 text-blue-200 border border-blue-500/40 hover:bg-blue-500/40' // Styles quand non gelée (cliquable)
                              } ${isAnyBaliseBeingEdited && !balise.editing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={balise.frozen ? 'Dégeler la balise' : 'Geler la balise (désactive les modifications)'}
                              disabled={isAnyBaliseBeingEdited && !balise.editing}
                            >
                              <Snowflake className="w-5 h-5" />
                            </button>
                            {/* Bouton Modifier/Valider */}
                            <button
                              onClick={() => toggleEditMode(balises.indexOf(balise))}
                              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 hover:scale-110 shadow-md ${
                                balise.editing
                                  ? 'bg-green-500/30 text-green-200 border border-green-500/40 hover:bg-green-500/40'
                                  : 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/40'
                              } ${isAnyBaliseBeingEdited && !balise.editing || balise.frozen ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={balise.editing ? 'Valider les modifications' : 'Modifier la balise'}
                              disabled={isAnyBaliseBeingEdited && !balise.editing || balise.frozen}
                            >
                              {balise.editing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                            </button>
                            {/* Bouton Supprimer */}
                            <button
                              onClick={() => handleDeleteBalise(balises.indexOf(balise))}
                              className={`flex items-center justify-center w-12 h-12 bg-red-500/30 rounded-lg text-red-200 hover:bg-red-500/40 transition-all duration-300 hover:scale-110 shadow-md border border-red-500/40 ${isAnyBaliseBeingEdited || balise.frozen ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Supprimer la balise"
                              disabled={isAnyBaliseBeingEdited || balise.frozen}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Information Tags - Dynamiquement mis à jour en fonction des balises validées */}
          <div className="flex flex-col md:flex-row justify-center items-center text-sm text-white/80 gap-6 mt-12 mb-8">
            {/* Tag 1: Total Balises validées */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md rounded-2xl border border-green-400/30 shadow-xl w-full md:w-1/3 min-h-[120px] transition-all duration-300 hover:scale-105 hover:border-green-400/50">
              <MapPin className="w-8 h-8 mb-3 text-green-300 drop-shadow" />
              <span className="text-3xl font-bold text-white mb-1 drop-shadow-md">{totalValidBalises}</span>
              <p className="text-white/70 text-base text-center">balise(s)</p>
            </div>

            {/* Tag 2: Balises Non Associées (ou non gelées pour cette implémentation) - Logo en rouge */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl border border-red-400/30 shadow-xl w-full md:w-1/3 min-h-[120px] transition-all duration-300 hover:scale-105 hover:border-red-400/50 group relative">
                <Info className="w-8 h-8 mb-3 text-red-300 drop-shadow" /> {/* Icône Info en rouge */}
                <span className="text-3xl font-bold text-white mb-1 drop-shadow-md">{balisesNonAssociees}</span>
                <p className="text-white/70 text-base text-center">balise(s) non associée(s)</p>
                <div className="absolute top-full mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-[200px] text-center">
                    Ces balises ne sont dans aucun parcours
                </div>
            </div>

            {/* Tag 3: Balises Gelées - Logo en bleu */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-md rounded-2xl border border-blue-400/30 shadow-xl w-full md:w-1/3 min-h-[120px] transition-all duration-300 hover:scale-105 hover:border-blue-400/50 group relative">
                <Snowflake className="w-8 h-8 mb-3 text-blue-300 drop-shadow" /> {/* Icône Snowflake en bleu */}
                <span className="text-3xl font-bold text-white mb-1 drop-shadow-md">{frozenBalisesCount}</span>
                <p className="text-white/70 text-base text-center">balise(s) gelée(s)</p>
                <div className="absolute top-full mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-[200px] text-center">
                    Les balises gelées disparaissent temporairement du parcours des élèves
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton Créer une balise flottant en bas de l'écran */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-950/80 to-transparent z-50 flex justify-center">
        <button
          onClick={handleAddBalise}
          className={`flex items-center px-8 py-4 text-white rounded-full transition-all duration-300 shadow-xl font-bold text-lg
            ${
              isAnyBaliseBeingEdited
                ? 'bg-gray-500/60 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105'
            }`}
          disabled={isAnyBaliseBeingEdited}
          title={isAnyBaliseBeingEdited ? "Veuillez valider la balise en cours avant d'en créer une nouvelle." : "Créer une nouvelle balise"}
        >
          <Plus className="w-6 h-6 mr-3" />
          Créer une Balise
        </button>
      </div>
    </div>
  );
};

export default GestionBalises;