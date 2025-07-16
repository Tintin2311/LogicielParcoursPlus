import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ArrowLeft, Plus, Target, Folder, FolderOpen, Edit3, Trash2 } from 'lucide-react';

// --- src/ItemTypes.js ---
// Définit les types d'éléments glissables/déposables pour React DND.
export const ItemTypes = {
  COURSE: 'course', // Représente un parcours
  FOLDER: 'folder', // Représente un dossier (utilisé pour les cibles de dépôt, et potentiellement pour glisser des dossiers plus tard)
};

// --- src/data.js ---
// Données initiales pour les dossiers et les parcours.
// La structure est récursive : chaque dossier peut contenir des enfants (autres dossiers ou parcours).
export const initialItems = [
  {
    id: 'folder-1',
    type: 'folder',
    nom: 'Parcours de Randonnée',
    children: [
      { id: 'course-1', type: 'course', nom: 'Circuit du Grand Pic', balises: 5 },
      { id: 'course-2', type: 'course', nom: 'Sentier des Cascades', balises: 3 },
      {
        id: 'folder-1-1',
        type: 'folder',
        nom: 'Petites Boucles',
        children: [
          { id: 'course-3', type: 'course', nom: 'Boucle du Chêne', balises: 2 },
          { id: 'course-4', type: 'course', nom: 'Promenade Rivage', balises: 3 }
        ]
      },
    ],
  },
  {
    id: 'folder-2',
    type: 'folder',
    nom: 'Parcours VTT',
    children: [
      { id: 'course-5', type: 'course', nom: 'Descente du Dragon', balises: 7 },
      { id: 'course-6', type: 'course', nom: 'Forêt Noire', balises: 4 },
    ],
  },
  // Parcours qui ne sont pas classés dans un dossier au démarrage (à la racine de l'application)
  { id: 'course-7', type: 'course', nom: 'Course d\'Orientation Urbaine', balises: 6 },
  { id: 'course-8', type: 'course', nom: 'Parcours Enfant', balises: 2 },
];

// --- src/CourseItem.js ---
// Composant représentant un élément de parcours individuel. Il est "glissable".
const CourseItem = ({ course, parentFolderId, onEdit, onDelete, onRemoveFromFolder }) => {
  // `useDrag` rend ce composant glissable.
  // `type` indique le type d'élément glissé (ici, un parcours).
  // `item` contient les données à transférer pendant le glisser-déposer (id du parcours et de son dossier parent).
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.COURSE,
    item: { id: course.id, parentFolderId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(), // `isDragging` est vrai si cet élément est en cours de glissement.
    }),
  }));

  return (
    <div
      ref={drag} // Attache la référence de glissement au div
      className={`
        bg-white/10 rounded-lg p-3 border border-white/20
        hover:border-white/40 transition-all duration-200
        flex items-center justify-between mt-2
        ${isDragging ? 'opacity-50 border-dashed border-purple-400' : ''}
      `}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-md flex items-center justify-center mr-3">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-white font-medium text-base">{course.nom}</h4>
          <p className="text-white/60 text-xs">{course.balises} balises</p>
        </div>
      </div>
      <div className="flex space-x-2">
        {/* Bouton pour modifier le parcours */}
        <button
          onClick={() => onEdit(course.id)}
          className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-all duration-200"
          title="Modifier le parcours"
        >
          <Edit3 className="w-4 h-4 text-white" />
        </button>
        {/* Bouton pour retirer le parcours du dossier (visible seulement s'il est dans un dossier) */}
        {parentFolderId && (
            <button
                onClick={() => onRemoveFromFolder(parentFolderId, course.id)}
                className="p-1.5 bg-orange-500/20 rounded-md hover:bg-orange-500/30 transition-all duration-200"
                title="Retirer du dossier"
            >
                <Trash2 className="w-4 h-4 text-orange-300" />
            </button>
        )}
        {/* Bouton pour supprimer définitivement le parcours */}
        <button
          onClick={() => onDelete(course.id, course.nom)}
          className="p-1.5 bg-red-500/20 rounded-md hover:bg-red-500/30 transition-all duration-200"
          title="Supprimer définitivement"
        >
          <Trash2 className="w-4 h-4 text-red-300" />
        </button>
      </div>
    </div>
  );
};

// --- src/FolderItem.js ---
// Composant représentant un dossier. Il est une "cible de dépôt" et contient récursivement d'autres FolderItem ou CourseItem.
const FolderItem = ({ folder, onAddFolder, onEditFolder, onDeleteFolder, onMoveItem, onEditCourse, onDeleteCourse, onRemoveCourseFromFolder, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false); // État pour gérer l'ouverture/fermeture du dossier.

  // `useDrop` rend ce composant une cible de dépôt.
  // `accept` spécifie les types d'éléments que ce dossier peut accepter.
  // `drop` est la fonction qui est appelée lorsque un élément est déposé.
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.COURSE], // Ce dossier accepte seulement les parcours pour le moment
    drop: (item, monitor) => {
      // Si l'élément glissé est relâché sur ce dossier, on appelle `onMoveItem`
      onMoveItem(item.id, item.parentFolderId, folder.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(), // Vrai si un élément glissable est au-dessus de la cible.
      canDrop: monitor.canDrop(), // Vrai si un élément glissable peut être déposé sur la cible.
    }),
  }));

  const isActive = isOver && canDrop; // Combine les deux pour un feedback visuel.

  return (
    <div
      ref={drop} // Attache la référence de dépôt au div
      className={`
        bg-white/10 rounded-xl p-4 border
        ${isActive ? 'border-purple-400 ring-2 ring-purple-400' : 'border-white/20'}
        hover:border-white/40 transition-all duration-200
        shadow-lg mt-3
        ${depth > 0 ? 'ml-6' : ''} {/* Ajoute une marge gauche pour l'indentation des sous-dossiers */}
      `}
    >
      {/* En-tête du dossier : Nom, icônes, et boutons d'action */}
      <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
            {isOpen ? <FolderOpen className="w-5 h-5 text-white" /> : <Folder className="w-5 h-5 text-white" />}
          </div>
          <h3 className="text-xl font-bold text-white truncate">
            {folder.nom}
          </h3>
          <span className="ml-3 text-white/70 text-sm">
            ({folder.children.filter(c => c.type === ItemTypes.COURSE).length} parcours, {folder.children.filter(c => c.type === ItemTypes.FOLDER).length} sous-dossiers)
          </span>
        </div>
        <div className="flex space-x-2">
          {/* Bouton pour ajouter un sous-dossier dans ce dossier */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id); }}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
            title="Ajouter un sous-dossier"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
          {/* Bouton pour modifier le nom du dossier */}
          <button
            onClick={(e) => { e.stopPropagation(); onEditFolder(folder.id, folder.nom); }}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
            title="Modifier le dossier"
          >
            <Edit3 className="w-4 h-4 text-white" />
          </button>
          {/* Bouton pour supprimer le dossier */}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id, folder.nom); }}
            className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all duration-200"
            title="Supprimer le dossier"
          >
            <Trash2 className="w-4 h-4 text-red-300" />
          </button>
        </div>
      </div>

      {/* Contenu du dossier (affiché seulement si le dossier est ouvert) */}
      {isOpen && (
        <div className="pl-4 border-l border-white/20 ml-2 mt-3">
          {folder.children.length === 0 && (
            <p className="text-white/60 italic text-sm py-2">Ce dossier est vide.</p>
          )}
          {/* Rend les enfants du dossier récursivement */}
          {folder.children.map(item => (
            item.type === ItemTypes.FOLDER ? (
              <FolderItem
                key={item.id}
                folder={item}
                onAddFolder={onAddFolder}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                onMoveItem={onMoveItem}
                onEditCourse={onEditCourse}
                onDeleteCourse={onDeleteCourse}
                onRemoveCourseFromFolder={onRemoveCourseFromFolder}
                depth={depth + 1} // Incrémente la profondeur pour l'indentation
              />
            ) : (
              <CourseItem
                key={item.id}
                course={item}
                parentFolderId={folder.id} // Indique que ce parcours est un enfant de ce dossier
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
                onRemoveFromFolder={onRemoveCourseFromFolder}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// --- src/MesParcours.js ---
// Composant principal de l'application, gère l'état global et les fonctions de manipulation des données.
const MesParcours = () => {
  const [isLoaded, setIsLoaded] = useState(false); // État pour gérer l'animation de chargement initiale
  const [items, setItems] = useState(initialItems); // L'état principal qui contient tous les dossiers et parcours

  // Fonction utilitaire récursive pour trouver un élément (dossier ou parcours) par son ID dans l'arbre.
  const findItemRecursive = (id, currentItems) => {
    for (const item of currentItems) {
      if (item.id === id) {
        return item;
      }
      if (item.type === ItemTypes.FOLDER && item.children) {
        const found = findItemRecursive(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Fonction utilitaire récursive pour trouver le parent d'un élément par son ID.
  const findParentRecursive = (id, currentItems, parent = null) => {
    for (const item of currentItems) {
      if (item.id === id) {
        return parent;
      }
      if (item.type === ItemTypes.FOLDER && item.children) {
        const found = findParentRecursive(id, item.children, item);
        if (found) return found;
      }
    }
    return null;
  };

  // Fonction utilitaire récursive pour mettre à jour les champs d'un élément dans l'arbre.
  const updateItemRecursive = (id, updatedFields, currentItems) => {
    return currentItems.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      if (item.type === ItemTypes.FOLDER && item.children) {
        return { ...item, children: updateItemRecursive(id, updatedFields, item.children) };
      }
      return item;
    });
  };

  // Fonction utilitaire récursive pour supprimer un élément de l'arbre.
  const deleteItemRecursive = (idToDelete, currentItems) => {
    return currentItems.filter(item => item.id !== idToDelete)
      .map(item => {
        if (item.type === ItemTypes.FOLDER && item.children) {
          return { ...item, children: deleteItemRecursive(idToDelete, item.children) };
        }
        return item;
      });
  };

  // Effet pour l'animation d'apparition initiale.
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // --- Fonctions de gestion des dossiers ---

  // Ajoute un nouveau dossier. `parentId` est null si le dossier est à la racine.
  const handleAddFolder = (parentId = null) => {
    const nom = prompt("Nom du nouveau dossier :");
    if (!nom) return;

    const newFolder = {
      id: `folder-${Date.now()}`,
      type: ItemTypes.FOLDER,
      nom: nom,
      children: [],
    };

    if (parentId) {
      // Ajoute le dossier comme enfant d'un dossier existant
      setItems(prevItems => updateItemRecursive(parentId, {
        children: [...findItemRecursive(parentId, prevItems).children, newFolder]
      }, prevItems));
    } else {
      // Ajoute le dossier à la racine
      setItems(prevItems => [...prevItems, newFolder]);
    }
  };

  // Modifie le nom d'un dossier.
  const handleEditFolder = (folderId, currentName) => {
    const newName = prompt("Nouveau nom du dossier :", currentName);
    if (newName && newName !== currentName) {
      setItems(prevItems => updateItemRecursive(folderId, { nom: newName }, prevItems));
    }
  };

  // Supprime un dossier et tout son contenu (récursivement).
  const handleDeleteFolder = (folderId, folderName) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${folderName}" et tout son contenu ?`)) {
      setItems(prevItems => deleteItemRecursive(folderId, prevItems));
    }
  };

  // --- Fonctions de gestion des parcours ---

  // Ajoute un nouveau parcours. `parentId` est null si le parcours est non classé.
  const handleAddCourse = (parentId = null) => {
    const nom = prompt("Nom du nouveau parcours :");
    if (!nom) return;
    const balises = parseInt(prompt("Nombre de balises :", "0"), 10);
    if (isNaN(balises) || balises < 0) return alert("Veuillez entrer un nombre valide de balises.");

    const newCourse = {
      id: `course-${Date.now()}`,
      type: ItemTypes.COURSE,
      nom: nom,
      balises: balises,
    };

    if (parentId) {
      // Ajoute le parcours comme enfant d'un dossier existant
      setItems(prevItems => updateItemRecursive(parentId, {
        children: [...findItemRecursive(parentId, prevItems).children, newCourse]
      }, prevItems));
    } else {
      // Ajoute le parcours à la racine (non classé)
      setItems(prevItems => [...prevItems, newCourse]);
    }
  };

  // Modifie les détails d'un parcours.
  const handleEditCourse = (courseId) => {
    const courseToEdit = findItemRecursive(courseId, items);
    if (!courseToEdit) return;

    const newName = prompt("Nouveau nom du parcours :", courseToEdit.nom);
    if (!newName) return;
    const newBalises = parseInt(prompt("Nouveau nombre de balises :", courseToEdit.balises), 10);
    if (isNaN(newBalises) || newBalises < 0) return alert("Veuillez entrer un nombre valide de balises.");

    setItems(prevItems => updateItemRecursive(courseId, { nom: newName, balises: newBalises }, prevItems));
  };

  // Supprime définitivement un parcours de l'application.
  const handleDeleteCourse = (courseId, courseName) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le parcours "${courseName}" ?`)) {
      setItems(prevItems => deleteItemRecursive(courseId, prevItems));
    }
  };

  // Retire un parcours d'un dossier et le remet à la racine (non classé).
  const handleRemoveCourseFromFolder = (folderId, courseId) => {
    const folder = findItemRecursive(folderId, items); // Trouve le dossier d'où retirer le parcours
    const courseToRemove = findItemRecursive(courseId, items); // Trouve le parcours à retirer

    if (!folder || !courseToRemove) return; // Si le dossier ou le parcours n'est pas trouvé, on ne fait rien

    // Crée une nouvelle liste d'enfants pour le dossier, sans le parcours à retirer
    const newChildren = folder.children.filter(item => item.id !== courseId);
    // Met à jour l'arbre avec le dossier modifié
    const updatedItems = updateItemRecursive(folderId, { children: newChildren }, items);

    // Ajoute le parcours retiré à la racine de la liste des items
    setItems([...updatedItems, courseToRemove]);
  };

  // --- Logique de Glisser-Déposer (Drag and Drop) ---

  // Gère le déplacement d'un élément (actuellement seulement les parcours) d'un parent à un autre.
  const handleMoveItem = (itemId, oldParentId, newParentId) => {
    setItems(prevItems => {
      let draggedItem = null;
      // Crée une copie profonde pour travailler dessus et éviter les mutations directes de l'état.
      let newItems = JSON.parse(JSON.stringify(prevItems));

      // Fonction interne pour retirer l'élément de son ancien parent.
      const removeItemFromParent = (id, currentParentId, collection) => {
        if (currentParentId === null) { // Si l'élément était à la racine
          const index = collection.findIndex(item => item.id === id);
          if (index > -1) {
            [draggedItem] = collection.splice(index, 1); // Retire l'élément et le stocke.
          }
        } else { // Si l'élément était dans un dossier
          const parentFolder = findItemRecursive(currentParentId, collection);
          if (parentFolder && parentFolder.children) {
            const index = parentFolder.children.findIndex(item => item.id === id);
            if (index > -1) {
              [draggedItem] = parentFolder.children.splice(index, 1); // Retire l'élément du tableau d'enfants.
            }
          }
        }
      };

      removeItemFromParent(itemId, oldParentId, newItems); // Appelle la fonction pour retirer l'élément.

      if (!draggedItem) return prevItems; // Si l'élément n'a pas été trouvé ou retiré, ne rien faire.

      // 2. Ajouter l'élément au nouveau parent.
      if (newParentId === null) { // Déplacer à la racine.
        newItems.push(draggedItem);
      } else { // Déplacer dans un dossier.
        const targetFolder = findItemRecursive(newParentId, newItems);
        if (targetFolder && targetFolder.children) {
          targetFolder.children.push(draggedItem); // Ajoute l'élément au tableau d'enfants du dossier cible.
        } else {
          // Cas d'erreur si le dossier cible n'est pas trouvé.
          console.warn("Dossier cible non trouvé ou invalide pour le dépôt.");
          return prevItems; // Annuler l'opération.
        }
      }

      return newItems; // Retourne la nouvelle structure d'état.
    });
  };

  return (
    // DndProvider enveloppe l'application pour activer la fonctionnalité de glisser-déposer.
    <DndProvider backend={HTML5Backend}>
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

        {/* Back Button (Placeholder for navigation to a previous page) */}
        <div className="absolute top-8 left-8 z-20">
          <button
            onClick={() => alert("Retour à la page précédente (à implémenter)")}
            className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        {/* Contenu principal de l'application */}
        <div
          className={`relative z-10 container mx-auto px-4 py-8 pt-24 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
              <span className="text-3xl">📁</span>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 mb-2">
              Gestion des Parcours
            </h1>
            <p className="text-xl text-white/80 font-light">
              Organisez vos parcours par glisser-déposer
            </p>
          </div>

          {/* Boutons pour créer un nouveau dossier ou parcours à la racine */}
          <div className="max-w-6xl mx-auto flex justify-center space-x-4 mb-8">
            <button
              onClick={() => handleAddFolder(null)}
              className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 shadow-xl transform hover:-translate-y-1 hover:shadow-purple-500/25 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10 flex items-center">
                <Plus className="w-5 h-5 text-white mr-2" />
                <span className="text-white text-md font-medium">Nouveau Dossier</span>
              </div>
            </button>
            <button
              onClick={() => handleAddCourse(null)}
              className="group relative bg-gradient-to-br from-purple-400/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 shadow-xl transform hover:-translate-y-1 hover:shadow-purple-500/25 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="relative z-10 flex items-center">
                <Target className="w-5 h-5 text-white mr-2" />
                <span className="text-white text-md font-medium">Nouveau Parcours</span>
              </div>
            </button>
          </div>

          {/* Zone d'affichage principale des dossiers et parcours à la racine */}
          <div className="max-w-6xl mx-auto">
            {/* Itère sur les éléments de niveau supérieur (racine) */}
            {items.map(item => (
              item.type === ItemTypes.FOLDER ? (
                // Si l'élément est un dossier, rend un FolderItem
                <FolderItem
                  key={item.id}
                  folder={item}
                  onAddFolder={handleAddFolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveItem={handleMoveItem}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onRemoveCourseFromFolder={handleRemoveCourseFromFolder}
                />
              ) : (
                // Si l'élément est un parcours (à la racine), rend un CourseItem
                <CourseItem
                  key={item.id}
                  course={item}
                  parentFolderId={null} // Indique que ce parcours n'a pas de dossier parent
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteCourse}
                />
              )
            ))}
            {/* Message si aucun élément n'existe encore */}
            {items.length === 0 && (
              <p className="text-white/60 text-center text-lg italic p-8 bg-white/10 rounded-xl border border-white/20">
                Aucun dossier ou parcours. Créez-en un !
              </p>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// Exportation correcte du composant principal
export default MesParcours;