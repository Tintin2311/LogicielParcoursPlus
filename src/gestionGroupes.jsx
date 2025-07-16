import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  FolderOpen,
  ArrowLeft,
  Edit3,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Save,
  X,
  Folder,
  FolderPlus,
  UserPlus,
  Copy,
  Check,
  ChevronRight,
  Home
} from 'lucide-react';

const GestionGroupes = ({ setPage, professeur, setProfesseur, setModeConnexion }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Pour la fonctionnalité glisser-déposer
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null); // 'folder' ou 'group'
  const [dragOverFolder, setDragOverFolder] = useState(null); // ID du dossier survolé par un élément glissé
  const [dragOverDefaultGroupZone, setDragOverDefaultGroupZone] = useState(false); // État pour la zone de groupes par défaut
  const dragOverTimeout = useRef(null); // Ref pour le timeout d'ouverture de dossier

  // État pour gérer l'affichage des élèves dans un groupe
  const [expandedGroup, setExpandedGroup] = useState(null); // ID du groupe dont les élèves sont affichés

  // Couleurs prédéfinies pour les groupes
  const groupColors = [
    '#FF6F61', // Corail
    '#6B4226', // Marron
    '#1E90FF', // Bleu Doder
    '#FFD700', // Or
    '#32CD32', // Vert Lime
    '#9370DB', // Violet Moyen
    '#FFA500', // Orange
    '#00CED1'  // Cyan Foncé
  ];

  // États pour les données (données d'exemple)
  const [folders, setFolders] = useState([
    { id: 1, name: 'Classe de 6ème', parentId: null, teacherId: professeur.id },
    { id: 2, name: 'Classe de 5ème', parentId: null, teacherId: professeur.id },
    { id: 3, name: 'Groupe A', parentId: 1, teacherId: professeur.id },
    { id: 4, name: 'Groupe B', parentId: 1, teacherId: professeur.id },
    { id: 5, name: 'Sous-groupe A1', parentId: 3, teacherId: professeur.id }
  ]);

  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Groupe Alpha',
      folderId: 3,
      color: '#FF6F61',
      teacherId: professeur.id, // Rattachement au professeur
      students: [
        { id: 1, name: 'Jean Dupont', code: '123456', teacherId: professeur.id },
        { id: 2, name: 'Marie Martin', code: '789012', teacherId: professeur.id },
        { id: 3, name: 'Pierre Durand', code: '345678', teacherId: professeur.id }
      ]
    },
    {
      id: 2,
      name: 'Groupe Beta',
      folderId: 4,
      color: '#1E90FF',
      teacherId: professeur.id, // Rattachement au professeur
      students: [
        { id: 4, name: 'Sophie Leroy', code: '901234', teacherId: professeur.id },
        { id: 5, name: 'Lucas Bernard', code: '567890', teacherId: professeur.id }
      ]
    }
  ]);

  const [newGroup, setNewGroup] = useState({ name: '', folderId: null, color: groupColors[0] });
  const [newFolder, setNewFolder] = useState({ name: '', parentId: null });
  const [newStudent, setNewStudent] = useState({ name: '', groupId: null });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Fonctions utilitaires
  const generateStudentCode = () => {
    let code;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (groups.some(g => g.students.some(s => s.code === code)));
    return code;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Gestion des dossiers
  const createFolder = () => {
    const trimmedName = newFolder.name.trim();
    if (!trimmedName) return;

    // Vérifier l'unicité du nom du dossier dans le dossier parent actuel
    const existingFoldersInParent = folders.filter(f => f.parentId === selectedFolder && f.teacherId === professeur.id);
    if (existingFoldersInParent.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Un dossier avec ce nom existe déjà dans ce répertoire.");
      return;
    }

    const folder = {
      id: Date.now(),
      name: trimmedName,
      parentId: selectedFolder,
      teacherId: professeur.id // Rattachement au professeur
    };

    setFolders([...folders, folder]);
    setNewFolder({ name: '', parentId: null });
    setShowCreateFolder(false);
  };

  const updateFolder = (folderId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        alert("Le nom du dossier ne peut pas être vide.");
        return;
    }

    const folderToUpdate = folders.find(f => f.id === folderId);
    if (!folderToUpdate) return;

    // Vérifier l'unicité du nouveau nom dans le dossier parent actuel
    const existingFoldersInParent = folders.filter(f =>
        f.parentId === folderToUpdate.parentId &&
        f.id !== folderId &&
        f.teacherId === professeur.id
    );
    if (existingFoldersInParent.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert("Un autre dossier avec ce nom existe déjà dans ce répertoire.");
        setEditingFolder(null); // Annuler l'édition
        return;
    }

    setFolders(folders.map(f =>
      f.id === folderId ? { ...f, name: trimmedName } : f
    ));
    setEditingFolder(null);
  };

  const deleteFolder = (folderIdToDelete) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier et tout son contenu (sous-dossiers et groupes) ?')) {
      const foldersToDelete = new Set();
      const groupsToDelete = new Set();

      const findChildrenToDelete = (currentFolderId) => {
        foldersToDelete.add(currentFolderId);

        folders.forEach(f => {
          if (f.parentId === currentFolderId && !foldersToDelete.has(f.id) && f.teacherId === professeur.id) {
            findChildrenToDelete(f.id);
          }
        });

        groups.forEach(g => {
          if (g.folderId === currentFolderId && g.teacherId === professeur.id) {
            groupsToDelete.add(g.id);
          }
        });
      };

      findChildrenToDelete(folderIdToDelete);

      setFolders(prevFolders => prevFolders.filter(f => !foldersToDelete.has(f.id)));
      setGroups(prevGroups => prevGroups.filter(g => !groupsToDelete.has(g.id)));

      if (selectedFolder === folderIdToDelete) {
        const breadcrumb = getBreadcrumb();
        if (breadcrumb.length > 0) {
          setSelectedFolder(breadcrumb[breadcrumb.length - 2]?.id || null);
        } else {
          setSelectedFolder(null);
        }
      }
    }
  };


  // Gestion des groupes
  const createGroup = () => {
    const trimmedName = newGroup.name.trim();
    if (!trimmedName) return;

    // Vérifier l'unicité du nom du groupe dans le dossier parent actuel
    const existingGroupsInFolder = groups.filter(g => g.folderId === selectedFolder && g.teacherId === professeur.id);
    if (existingGroupsInFolder.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Un groupe avec ce nom existe déjà dans ce dossier.");
      return;
    }

    const newGroupId = Date.now();
    const group = {
      id: newGroupId,
      name: trimmedName,
      folderId: selectedFolder,
      color: newGroup.color,
      teacherId: professeur.id, // Rattachement au professeur
      students: []
    };

    setGroups([...groups, group]);
    setNewGroup({ name: '', folderId: null, color: groupColors[0] });
    setShowCreateGroup(false);
    setExpandedGroup(newGroupId); // Développe le groupe nouvellement créé
  };

  const updateGroup = (groupId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        alert("Le nom du groupe ne peut pas être vide.");
        return;
    }

    const groupToUpdate = groups.find(g => g.id === groupId);
    if (!groupToUpdate) return;

    // Vérifier l'unicité du nouveau nom dans le dossier parent actuel
    const existingGroupsInFolder = groups.filter(g =>
        g.folderId === groupToUpdate.folderId &&
        g.id !== groupId &&
        g.teacherId === professeur.id
    );
    if (existingGroupsInFolder.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert("Un autre groupe avec ce nom existe déjà dans ce dossier.");
        setEditingGroup(null); // Annuler l'édition
        return;
    }

    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, name: trimmedName } : g
    ));
    setEditingGroup(null);
  };

  const updateGroupColor = (groupId, newColor) => {
    setGroups(prevGroups => prevGroups.map(g =>
      g.id === groupId ? { ...g, color: newColor } : g
    ));
  };

  const deleteGroup = (groupId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      setGroups(groups.filter(g => g.id !== groupId));
      if (expandedGroup === groupId) {
        setExpandedGroup(null);
      }
    }
  };

  // Gestion des élèves
  const addStudent = (groupId) => {
    const trimmedName = newStudent.name.trim();
    if (!trimmedName) return;

    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    // Vérifier l'unicité du nom de l'élève dans le groupe
    if (targetGroup.students.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Un élève avec ce nom existe déjà dans ce groupe.");
      return;
    }

    const student = {
      id: Date.now(),
      name: trimmedName,
      code: generateStudentCode(),
      teacherId: professeur.id // Rattachement au professeur
    };

    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, students: [...g.students, student] }
        : g
    ));
    setNewStudent({ name: '', groupId: null });
  };

  const updateStudent = (groupId, studentId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
        alert("Le nom de l'élève ne peut pas être vide.");
        return;
    }

    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    // Vérifier l'unicité du nouveau nom dans le groupe
    if (targetGroup.students.some(s => s.id !== studentId && s.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Un autre élève avec ce nom existe déjà dans ce groupe.");
      setEditingStudent(null); // Annuler l'édition
      return;
    }

    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            students: g.students.map(s =>
              s.id === studentId ? { ...s, name: trimmedName } : s
            )
          }
        : g
    ));
    setEditingStudent(null);
  };

  const deleteStudent = (groupId, studentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      setGroups(groups.map(g =>
        g.id === groupId
          ? { ...g, students: g.students.filter(s => s.id !== studentId) }
          : g
      ));
    }
  };

  // Filtrage et affichage
  const getCurrentFolders = () => {
    // Filtrer par parentId et par teacherId du professeur connecté
    return folders.filter(f => f.parentId === selectedFolder && f.teacherId === professeur.id);
  };

  const getCurrentGroups = () => {
    // Filtrer par folderId et par teacherId du professeur connecté
    return groups.filter(g => g.folderId === selectedFolder && g.teacherId === professeur.id);
  };

  const getBreadcrumb = () => {
    const path = [];
    let current = selectedFolder;

    while (current) {
      // Filtrer par teacherId lors de la construction du fil d'Ariane
      const folder = folders.find(f => f.id === current && f.teacherId === professeur.id);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  const filteredGroups = getCurrentGroups().filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.students.some(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const goBack = () => {
    const breadcrumb = getBreadcrumb();
    if (breadcrumb.length > 0) {
      const parentFolder = breadcrumb[breadcrumb.length - 1];
      setSelectedFolder(parentFolder.parentId);
    } else {
      setSelectedFolder(null);
    }
  };

  // --- Fonctions Drag & Drop ---

  const handleDragStart = (e, item, type) => {
    setDraggedItem(item);
    setDraggedItemType(type);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, type: type }));

    // Si c'est un groupe, nous voulons une image de glissement personnalisée (l'icône)
    if (type === 'group') {
      const img = new Image();
      // Utilisez une image existante ou créez une image à la volée.
      // Pour cet exemple, je vais utiliser un div temporaire pour créer l'image.
      // Dans un vrai projet, vous pourriez avoir une icône PNG ou SVG pré-rendue.
      img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'; // SVG pour l'icône Users
      e.dataTransfer.setDragImage(img, 24, 24); // Centre l'image de glissement
    }
  };


  const handleDragOver = (e, folderId = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedItemType === 'folder' || draggedItemType === 'group') {
      if (folderId !== null) { // Si on survole un dossier spécifique (y compris "Racine")
        if (dragOverFolder !== folderId) {
          setDragOverFolder(folderId);
          if (dragOverTimeout.current) {
            clearTimeout(dragOverTimeout.current);
          }
          // Empêche l'ouverture si le dossier cible est le dossier glissé ou un de ses enfants
          if (draggedItemType === 'folder' && draggedItem && isDescendant(draggedItem.id, folderId)) {
            // Ne fait rien, on ne peut pas déplacer un dossier dans lui-même ou son enfant
            return;
          }
          dragOverTimeout.current = setTimeout(() => {
            setSelectedFolder(folderId);
            setDragOverFolder(null); // Réinitialiser le survol après l'ouverture
          }, 700);
        }
        setDragOverDefaultGroupZone(false); // S'assurer que la zone par défaut n'est pas activée
      } else { // Si on survole la zone "Racine" pour les dossiers ou la zone de dépôt générale des groupes
        setDragOverFolder(null); // S'assurer qu'aucun dossier n'est spécifiquement survolé
        if (dragOverTimeout.current) {
          clearTimeout(dragOverTimeout.current);
        }
        // Active la zone de groupes par défaut si c'est un groupe qui est glissé et qu'on n'est pas sur un dossier spécifique
        // Et active "Racine" pour les dossiers aussi
        if (draggedItemType === 'group' || (draggedItemType === 'folder' && folderId === null)) {
          setDragOverDefaultGroupZone(true);
        }
      }
    }
  };

  const handleDragEnter = (e, folderId = null) => {
    e.preventDefault();
    if (folderId !== null) {
      setDragOverFolder(folderId);
      setDragOverDefaultGroupZone(false); // Assurez-vous que l'état de la zone par défaut est désactivé si un dossier est survolé
    } else { // Ceci est pour la zone racine/aucun dossier spécifique
      setDragOverFolder(null);
      if (draggedItemType === 'group' || draggedItemType === 'folder') { // La zone "Racine" doit réagir aussi aux dossiers
        setDragOverDefaultGroupZone(true);
      }
    }
  };

  const handleDragLeave = (e, folderId = null) => {
    // Vérifier si l'élément quitte réellement la zone de dépôt
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (folderId !== null) {
        if (dragOverFolder === folderId) {
          setDragOverFolder(null);
        }
      } else { // Leaving the default zone or root
        setDragOverDefaultGroupZone(false);
      }
      if (dragOverTimeout.current) {
        clearTimeout(dragOverTimeout.current);
      }
    }
  };

  const isDescendant = (folderId, possibleDescendantId) => {
    let current = possibleDescendantId;
    while (current) {
      if (current === folderId) {
        return true;
      }
      const parent = folders.find(f => f.id === current);
      current = parent ? parent.parentId : null;
    }
    return false;
  };


  const handleDrop = (e, targetFolderId = null) => {
    e.preventDefault();
    setDragOverFolder(null); // Réinitialise le survol après le dépôt
    setDragOverDefaultGroupZone(false); // Réinitialise la zone par défaut
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current);
    }

    if (!draggedItem) return;

    if (draggedItemType === 'folder') {
      // Prévention du déplacement d'un dossier dans lui-même ou un de ses sous-dossiers
      if (isDescendant(draggedItem.id, targetFolderId)) {
        alert("Vous ne pouvez pas déplacer un dossier dans lui-même ou dans un de ses sous-dossiers.");
        setDraggedItem(null);
        setDraggedItemType(null);
        return;
      }
      // Empêcher de déposer un dossier sur lui-même (s'il s'agit du même dossier cible)
      if (draggedItem.id === targetFolderId) {
          setDraggedItem(null);
          setDraggedItemType(null);
          return;
      }

      setFolders(prevFolders =>
        prevFolders.map(f =>
          f.id === draggedItem.id ? { ...f, parentId: targetFolderId } : f
        )
      );
    } else if (draggedItemType === 'group') {
      // Si dropped sur un dossier, le mettre dans ce dossier
      // Sinon, le mettre dans le dossier sélectionné (ou racine)
      const finalTargetFolderId = targetFolderId !== null ? targetFolderId : selectedFolder;

      setGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === draggedItem.id ? { ...g, folderId: finalTargetFolderId } : g
        )
      );
    }
    setDraggedItem(null);
    setDraggedItemType(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedItemType(null);
    setDragOverFolder(null); // S'assure que le survol est effacé
    setDragOverDefaultGroupZone(false);
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current);
    }
  };

  // --- Rendu du composant ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40"
            onClick={() => setPage("AccueilProf")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'Accueil
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Gestion des Groupes
            </h1>
            <p className="text-white/80 mt-2">Organisez vos classes et gérez les élèves</p>
          </div>

          <div className="w-24"></div>
        </div>

        {/* Breadcrumb amélioré */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-white/60 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            {/* Bouton Racine */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center px-3 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-all
                ${(dragOverDefaultGroupZone && (draggedItemType === 'folder' || (draggedItemType === 'group' && selectedFolder === null))) ? 'border-2 border-cyan-400 animate-pulse' : ''}`}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragEnter={(e) => handleDragEnter(e, null)}
              onDragLeave={(e) => handleDragLeave(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              <Home className="w-4 h-4 mr-1" />
              Racine
            </button>
            {getBreadcrumb().map((folder) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="w-4 h-4 text-white/40" />
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`px-3 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-all
                    ${dragOverFolder === folder.id && draggedItem ? 'border-2 border-cyan-400 animate-pulse' : ''}`}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragEnter={(e) => handleDragEnter(e, folder.id)}
                  onDragLeave={(e) => handleDragLeave(e, folder.id)}
                  onDrop={(e) => handleDrop(e, folder.id)}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
            {selectedFolder && (
              <>
                <div className="flex-1"></div>
                <button
                  onClick={goBack}
                  className="flex items-center px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour
                </button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un groupe ou un élève..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Nouveau dossier
          </button>

          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau groupe
          </button>
        </div>

        {/* Folders */}
        {getCurrentFolders().length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Dossiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentFolders().map((folder) => {
                const subFoldersCount = folders.filter(f => f.parentId === folder.id && f.teacherId === professeur.id).length;
                const groupsInFolderCount = groups.filter(g => g.folderId === folder.id && g.teacherId === professeur.id).length;
                const isDragOver = dragOverFolder === folder.id && draggedItem;
                const isPulsing = isDragOver && (dragOverTimeout.current !== null);

                return (
                  <div
                    key={folder.id}
                    className={`group relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-105
                      ${isDragOver ? 'border-2 border-cyan-400' : 'border-white/20 hover:border-white/40'}
                      ${isPulsing ? 'animate-pulse' : ''}
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragEnter={(e) => handleDragEnter(e, folder.id)}
                    onDragLeave={(e) => handleDragLeave(e, folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex items-center flex-1 cursor-pointer"
                        onClick={() => setSelectedFolder(folder.id)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                          <Folder className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          {editingFolder === folder.id ? (
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                defaultValue={folder.name}
                                className="flex-1 px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateFolder(folder.id, e.target.value);
                                  }
                                }}
                                onBlur={(e) => updateFolder(folder.id, e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => setEditingFolder(null)}
                                className="p-1 text-white/60 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-semibold text-white text-lg hover:text-cyan-300 transition-colors">
                                {folder.name}
                              </h3>
                              <p className="text-white/60 text-sm">
                                {subFoldersCount} sous-dossier{subFoldersCount !== 1 ? 's' : ''}, {groupsInFolderCount} groupe{groupsInFolderCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-white/60 hover:text-white transition-all hover:bg-white/10 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 transition-all hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Groups Section Container */}
        <div
          className={`relative p-6 rounded-2xl transition-all duration-300 border
            ${dragOverDefaultGroupZone && draggedItemType === 'group' ? 'border-2 border-cyan-400 animate-pulse bg-white/10' : 'border-white/20'}
            ${dragOverDefaultGroupZone && draggedItemType !== 'group' ? 'border-dashed border-red-500' : ''}
          `}
          onDragOver={(e) => handleDragOver(e, selectedFolder)}
          onDragEnter={(e) => handleDragEnter(e, selectedFolder)}
          onDragLeave={(e) => handleDragLeave(e, selectedFolder)}
          onDrop={(e) => handleDrop(e, selectedFolder)}
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Groupes {selectedFolder && `dans ${folders.find(f => f.id === selectedFolder && f.teacherId === professeur.id)?.name}`}
          </h2>
          {filteredGroups.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-12 cursor-pointer
                ${dragOverDefaultGroupZone && draggedItemType === 'group' ? 'text-cyan-400' : 'text-white/60'}
                transition-colors duration-300
              `}
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus className="w-24 h-24 mb-4" />
              <p className="text-lg font-semibold">Créer ou déposer un groupe ici</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gradient-to-br from-slate-800/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                  style={{ borderColor: group.color || 'rgba(255,255,255,0.2)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    >
                      {/* L'icône de glissement/dépose du groupe */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 cursor-grab active:cursor-grabbing"
                        style={{ backgroundColor: group.color || '#999' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, group, 'group')}
                        onDragEnd={handleDragEnd}
                      >
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      {editingGroup === group.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            defaultValue={group.name}
                            className="px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateGroup(group.id, e.target.value);
                              }
                            }}
                            onBlur={(e) => updateGroup(group.id, e.target.value)}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="p-1 text-white/60 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-white text-xl hover:text-purple-300 transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-white/60">{group.students.length} élèves</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={group.color || groupColors[0]}
                        onChange={(e) => updateGroupColor(group.id, e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none"
                        style={{ backgroundColor: group.color || groupColors[0] }}
                      >
                        {groupColors.map(color => (
                          <option key={color} value={color} style={{ backgroundColor: color }}>
                            {color}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setEditingGroup(group.id)}
                        className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Students - Affiché seulement si le groupe est développé */}
                  {expandedGroup === group.id && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                      {group.students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                        >
                          {editingStudent === student.id ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                defaultValue={student.name}
                                className="flex-1 px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateStudent(group.id, student.id, e.target.value);
                                  }
                                }}
                                onBlur={(e) => updateStudent(group.id, student.id, e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => setEditingStudent(null)}
                                className="p-1 text-white/60 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-white font-medium hover:text-cyan-300 transition-colors">
                                {student.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1">
                              <span className="text-white/80 font-mono">{student.code}</span>
                              <button
                                onClick={() => copyToClipboard(student.code)}
                                className="p-1 text-white/60 hover:text-white transition-colors"
                              >
                                {copiedCode === student.code ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => setEditingStudent(student.id)}
                              className="p-1 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteStudent(group.id, student.id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Student */}
                      {newStudent.groupId === group.id ? (
                        <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                          <input
                            type="text"
                            placeholder="Nom de l'élève"
                            className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addStudent(group.id);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => addStudent(group.id)}
                            className="p-2 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setNewStudent({name: '', groupId: null})}
                            className="p-2 text-white/60 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNewStudent({name: '', groupId: group.id})}
                          className="w-full p-3 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:text-white hover:border-white/40 transition-all flex items-center justify-center space-x-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Ajouter un élève</span>
                        </button>
                      )}
                      {/* Bouton Valider pour replier le groupe */}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setExpandedGroup(null)}
                          className="px-4 py-2 bg-blue-500 rounded-xl text-white hover:bg-blue-600 transition-all"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-purple-800 p-6 rounded-2xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Créer un dossier</h3>
            <input
              type="text"
              placeholder="Nom du dossier"
              className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none mb-4"
              value={newFolder.name}
              onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={createFolder}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-purple-800 p-6 rounded-2xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Créer un groupe</h3>
            <input
              type="text"
              placeholder="Nom du groupe"
              className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none mb-4"
              value={newGroup.name}
              onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && createGroup()}
              autoFocus
            />
            <div className="mb-4">
              <label htmlFor="groupColor" className="block text-white/80 text-sm font-medium mb-2">
                Couleur du groupe
              </label>
              <select
                id="groupColor"
                value={newGroup.color}
                onChange={(e) => setNewGroup({...newGroup, color: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white border border-white/20 focus:border-white/40 focus:outline-none"
                style={{ backgroundColor: newGroup.color }}
              >
                {groupColors.map(color => (
                  <option key={color} value={color} style={{ backgroundColor: color }}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createGroup}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionGroupes;