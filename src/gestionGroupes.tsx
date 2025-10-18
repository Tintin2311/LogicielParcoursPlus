// src/gestionGroupes.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import toast, { Toaster } from "react-hot-toast";

import {
  Users,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  Search,
  ChevronRight,
  Home,
  UserPlus,
  Copy,
  Check,
  X,
  Folder,
  FolderPlus,
} from "lucide-react";

/* =======================
   Types métier
   ======================= */
interface Student {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  groupId?: string | null;
}

interface Group {
  id: string;
  name: string;
  folderId: string | null;
  color: string;
  teacherId: string;
  students: Student[];
}

interface FolderT {
  id: string;
  name: string;
  parentId: string | null;
  teacherId: string;
}

interface Professor {
  user_id: string;
  name: string;
  email: string;
}

/* =======================
   Drag & Drop
   ======================= */
const ItemTypes = {
  FOLDER: "folder",
  GROUP: "group",
} as const;
type ItemType = typeof ItemTypes[keyof typeof ItemTypes];

/* =======================
   Props
   ======================= */
type GestionGroupesProps = {
  setPage: (page: string) => void;
  professeur: Professor;
  setSelectedGroup?: (group: Group) => void;
  /** Ces deux props existent peut-être côté parent.
   *  Elles sont optionnelles ici, on ne les utilise pas pour éviter les warnings. */
  setProfesseur?: (prof: Professor) => void;
  setModeConnexion?: (mode: string) => void;
};

const GestionGroupes: React.FC<GestionGroupesProps> = ({
  setPage,
  professeur,
  setSelectedGroup,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nomDossier, setNomDossier] = useState("");

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [draggedItem, setDraggedItem] = useState<{ id: string } | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<ItemType | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dragOverDefaultGroupZone, setDragOverDefaultGroupZone] = useState(false);
  const dragOverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const groupColors = [
    "#FF6F61",
    "#6B4226",
    "#1E90FF",
    "#FFD700",
    "#32CD32",
    "#9370DB",
    "#FFA500",
    "#00CED1",
  ];

  const [folders, setFolders] = useState<FolderT[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [newGroup, setNewGroup] = useState<{
    name: string;
    folderId: string | null;
    color: string;
  }>({ name: "", folderId: null, color: groupColors[0] });

  const [newStudent, setNewStudent] = useState<{ name: string; groupId: string | null }>(
    { name: "", groupId: null }
  );

  /* =======================
     Fetchers
     ======================= */
  const fetchFolders = useCallback(async () => {
    if (!professeur?.user_id) {
      setFolders([]);
      return;
    }
    const { data, error } = await supabase
      .from("folders")
      .select("id, nom, parent_id, user_id")
      .eq("user_id", professeur.user_id);

    if (error) {
      console.error("Error fetching folders:", error.message);
      toast.error("Erreur lors du chargement des dossiers.");
      return;
    }

    const mapped: FolderT[] =
      (data || []).map((f: any) => ({
        id: f.id,
        name: f.nom,
        parentId: f.parent_id,
        teacherId: f.user_id,
      })) ?? [];
    setFolders(mapped);
  }, [professeur]);

  /** ⚠️ Pour éviter l’erreur RLS sur la jointure, on fait 2 requêtes :
   *  - 1) groups (sans jointure)
   *  - 2) students (si la table est accessible). En cas de « permission denied »,
   *       on ne fait PAS de toast d’erreur pour ne pas gêner l’usage ; on log en warn
   *       et on associe des tableaux vides (UI OK). */
  const fetchGroups = useCallback(async () => {
    if (!professeur?.user_id) {
      setGroups([]);
      return;
    }

    // 1) Groupes
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, folder_id, color, teacher_id")
      .eq("teacher_id", professeur.user_id);

    if (groupsError) {
      console.error("Error fetching groups:", groupsError.message);
      toast.error("Erreur lors du chargement des groupes.");
      return;
    }

    const baseGroups: Group[] =
      (groupsData || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        folderId: g.folder_id,
        color: g.color,
        teacherId: g.teacher_id,
        students: [], // rempli ensuite si possible
      })) ?? [];

    // 2) Élèves (optionnel si la table est protégée)
    const groupIds = baseGroups.map((g) => g.id);
    if (groupIds.length === 0) {
      setGroups(baseGroups);
      return;
    }

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, name, code, group_id, teacher_id")
      .in("group_id", groupIds)
      .eq("teacher_id", professeur.user_id);

    if (studentsError) {
      // Pas de toast ici pour ne pas spammer si RLS bloque l’accès
      console.warn("Warn: students inaccessible (RLS ?):", studentsError.message);
      setGroups(baseGroups); // on continue sans élèves
      return;
    }

    const byGroup = new Map<string, Student[]>();
    (studentsData || []).forEach((s: any) => {
      const arr = byGroup.get(s.group_id) ?? [];
      arr.push({
        id: s.id,
        name: s.name,
        code: s.code,
        teacherId: s.teacher_id,
        groupId: s.group_id,
      });
      byGroup.set(s.group_id, arr);
    });

    const merged = baseGroups.map((g) => ({
      ...g,
      students: byGroup.get(g.id) ?? [],
    }));

    setGroups(merged);
  }, [professeur]);

  useEffect(() => {
    const load = async () => {
      if (professeur?.user_id) {
        await fetchFolders();
        await fetchGroups();
      }
      setIsLoaded(true);
    };
    load();
  }, [professeur, fetchFolders, fetchGroups]);

  /* =======================
     Utils
     ======================= */
  const generateStudentCode = () => {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (groups.some((g) => g.students.some((s) => s.code === code)));
    return code;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copié !");
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isDescendant = (potentialParentId: string, potentialChildId: string | null): boolean => {
    let current = potentialChildId;
    while (current) {
      if (current === potentialParentId) return true;
      const parent = folders.find(
        (f) => f.id === current && f.teacherId === professeur.user_id
      );
      current = parent ? parent.parentId : null;
    }
    return false;
  };

  /* =======================
     CRUD Dossiers
     ======================= */
  const handleAddFolder = async () => {
    const trimmed = nomDossier.trim();
    if (!trimmed) {
      toast.error("Veuillez entrer un nom de dossier.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const existing = folders.filter(
      (f) => f.parentId === selectedFolder && f.teacherId === professeur.user_id
    );
    if (existing.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Un dossier avec ce nom existe déjà ici.");
      return;
    }

    const { data, error } = await supabase
      .from("folders")
      .insert({
        nom: trimmed,
        user_id: professeur.user_id,
        parent_id: selectedFolder,
        type_element: "dossier",
      })
      .select("id, nom, parent_id, user_id")
      .single();

    if (error) {
      console.error(error);
      toast.error("Impossible de créer le dossier.");
      return;
    }

    toast.success(`Dossier "${data.nom}" créé.`);
    setNomDossier("");
    setShowCreateFolder(false);
    await fetchFolders();
  };

  const updateFolder = async (folderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Le nom du dossier ne peut pas être vide.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const folder = folders.find((f) => f.id === folderId && f.teacherId === professeur.user_id);
    if (!folder) {
      toast.error("Dossier introuvable.");
      return;
    }

    const existing = folders.filter(
      (f) =>
        f.parentId === folder.parentId &&
        f.id !== folderId &&
        f.teacherId === professeur.user_id
    );
    if (existing.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Un autre dossier porte déjà ce nom ici.");
      setEditingFolder(null);
      return;
    }

    const { error } = await supabase
      .from("folders")
      .update({ nom: trimmed })
      .eq("id", folderId)
      .eq("user_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Mise à jour impossible.");
      return;
    }

    toast.success("Dossier mis à jour.");
    setEditingFolder(null);
    await fetchFolders();
  };

  const deleteFolder = async (folderIdToDelete: string) => {
    if (!professeur?.user_id) return;

    if (
      !window.confirm(
        "Supprimer ce dossier et tout son contenu (sous-dossiers et groupes) ?"
      )
    )
      return;

    const foldersToDelete = new Set<string>();
    const groupsToDelete = new Set<string>();

    const deepCollect = (id: string) => {
      foldersToDelete.add(id);
      folders.forEach((f) => {
        if (f.parentId === id && f.teacherId === professeur.user_id) deepCollect(f.id);
      });
      groups.forEach((g) => {
        if (g.folderId === id && g.teacherId === professeur.user_id) groupsToDelete.add(g.id);
      });
    };

    deepCollect(folderIdToDelete);

    if (groupsToDelete.size > 0) {
      const { error: ge } = await supabase
        .from("groups")
        .delete()
        .in("id", Array.from(groupsToDelete))
        .eq("teacher_id", professeur.user_id);
      if (ge) {
        console.error(ge);
        toast.error("Erreur lors de la suppression des groupes.");
        return;
      }
    }

    const { error: fe } = await supabase
      .from("folders")
      .delete()
      .in("id", Array.from(foldersToDelete))
      .eq("user_id", professeur.user_id);

    if (fe) {
      console.error(fe);
      toast.error("Impossible de supprimer le dossier.");
      return;
    }

    toast.success("Dossier supprimé.");
    if (
      selectedFolder === folderIdToDelete ||
      isDescendant(folderIdToDelete, selectedFolder)
    ) {
      const breadcrumb = getBreadcrumb();
      if (breadcrumb.length > 0) {
        setSelectedFolder(breadcrumb[breadcrumb.length - 2]?.id || null);
      } else {
        setSelectedFolder(null);
      }
    }
    await fetchFolders();
    await fetchGroups();
  };

  /* =======================
     CRUD Groupes
     ======================= */
  const createGroup = async () => {
    const trimmed = newGroup.name.trim();
    if (!trimmed) {
      toast.error("Veuillez entrer un nom de groupe.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const existing = groups.filter(
      (g) => g.folderId === selectedFolder && g.teacherId === professeur.user_id
    );
    if (existing.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Un groupe porte déjà ce nom dans ce dossier.");
      return;
    }

    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: trimmed,
        folder_id: selectedFolder,
        color: newGroup.color,
        teacher_id: professeur.user_id,
      })
      .select("id, name, folder_id, color, teacher_id")
      .single();

    if (error) {
      console.error(error);
      toast.error("Impossible de créer le groupe.");
      return;
    }

    toast.success(`Groupe "${data.name}" créé.`);
    setNewGroup({ name: "", folderId: null, color: groupColors[0] });
    setShowCreateGroup(false);
    await fetchGroups();
    setExpandedGroup(data.id);
  };

  const updateGroup = async (groupId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Le nom du groupe ne peut pas être vide.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const group = groups.find((g) => g.id === groupId && g.teacherId === professeur.user_id);
    if (!group) {
      toast.error("Groupe introuvable.");
      return;
    }

    const existing = groups.filter(
      (g) =>
        g.folderId === group.folderId &&
        g.id !== groupId &&
        g.teacherId === professeur.user_id
    );
    if (existing.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Un autre groupe porte déjà ce nom ici.");
      setEditingGroup(null);
      return;
    }

    const { error } = await supabase
      .from("groups")
      .update({ name: trimmed })
      .eq("id", groupId)
      .eq("teacher_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Mise à jour impossible.");
      return;
    }

    toast.success("Groupe mis à jour.");
    setEditingGroup(null);
    await fetchGroups();
  };

  const updateGroupColor = async (groupId: string, newColor: string) => {
    if (!professeur?.user_id) return;
    const { error } = await supabase
      .from("groups")
      .update({ color: newColor })
      .eq("id", groupId)
      .eq("teacher_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour la couleur.");
      return;
    }
    toast.success("Couleur mise à jour.");
    await fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {
    if (!professeur?.user_id) return;
    if (!window.confirm("Supprimer ce groupe et tous ses élèves ?")) return;

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("teacher_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Suppression impossible.");
      return;
    }

    toast.success("Groupe supprimé.");
    if (expandedGroup === groupId) setExpandedGroup(null);
    await fetchGroups();
  };

  /* =======================
     CRUD Élèves
     ======================= */
  const addStudent = async (groupId: string) => {
    const trimmed = newStudent.name.trim();
    if (!trimmed) {
      toast.error("Veuillez entrer un nom d'élève.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const group = groups.find((g) => g.id === groupId && g.teacherId === professeur.user_id);
    if (!group) {
      toast.error("Groupe introuvable.");
      return;
    }
    if (group.students.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Un élève porte déjà ce nom dans ce groupe.");
      return;
    }

    const studentCode = generateStudentCode();

    const { error } = await supabase.from("students").insert({
      name: trimmed,
      code: studentCode,
      group_id: groupId,
      teacher_id: professeur.user_id,
    });

    if (error) {
      console.error(error);
      toast.error("Impossible d'ajouter l'élève.");
      return;
    }

    toast.success("Élève ajouté.");
    setNewStudent({ name: "", groupId: null });
    await fetchGroups();
  };

  const updateStudent = async (groupId: string, studentId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Le nom de l'élève ne peut pas être vide.");
      return;
    }
    if (!professeur?.user_id) {
      toast.error("Erreur : Professeur non identifié.");
      return;
    }

    const group = groups.find((g) => g.id === groupId && g.teacherId === professeur.user_id);
    if (!group) {
      toast.error("Groupe introuvable.");
      return;
    }
    if (
      group.students.some(
        (s) => s.id !== studentId && s.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error("Un autre élève porte déjà ce nom dans ce groupe.");
      setEditingStudent(null);
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({ name: trimmed })
      .eq("id", studentId)
      .eq("group_id", groupId)
      .eq("teacher_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Mise à jour impossible.");
      return;
    }

    toast.success("Élève mis à jour.");
    setEditingStudent(null);
    await fetchGroups();
  };

  const deleteStudent = async (groupId: string, studentId: string) => {
    if (!professeur?.user_id) return;
    if (!window.confirm("Supprimer cet élève ?")) return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId)
      .eq("group_id", groupId)
      .eq("teacher_id", professeur.user_id);

    if (error) {
      console.error(error);
      toast.error("Suppression impossible.");
      return;
    }

    toast.success("Élève supprimé.");
    await fetchGroups();
  };

  /* =======================
     Sélection / filtres / breadcrumb
     ======================= */
  const getCurrentFolders = useCallback((): FolderT[] => {
    if (!professeur?.user_id) return [];
    return folders.filter((f) => f.parentId === selectedFolder && f.teacherId === professeur.user_id);
  }, [folders, selectedFolder, professeur]);

  const getCurrentGroups = useCallback((): Group[] => {
    if (!professeur?.user_id) return [];
    return groups.filter((g) => g.folderId === selectedFolder && g.teacherId === professeur.user_id);
  }, [groups, selectedFolder, professeur]);

  const getBreadcrumb = useCallback((): FolderT[] => {
    if (!professeur?.user_id) return [];
    const path: FolderT[] = [];
    let current = selectedFolder;
    while (current) {
      const f = folders.find((x) => x.id === current && x.teacherId === professeur.user_id);
      if (!f) break;
      path.unshift(f);
      current = f.parentId;
    }
    return path;
  }, [selectedFolder, folders, professeur]);

  const filteredGroups = useCallback((): Group[] => {
    const currentGroups = getCurrentGroups();
    const q = searchTerm.toLowerCase();
    return currentGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.students.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [getCurrentGroups, searchTerm]);

  const goBack = () => {
    const breadcrumb = getBreadcrumb();
    if (breadcrumb.length > 0) {
      const last = breadcrumb[breadcrumb.length - 1];
      setSelectedFolder(last.parentId);
    } else {
      setSelectedFolder(null);
    }
  };

  /* =======================
     Drag & drop HTML5
     ======================= */
  const handleDragStart = (e: React.DragEvent, item: { id: string }, type: ItemType) => {
    setDraggedItem(item);
    setDraggedItemType(type);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, type }));

    const img = new Image();
    if (type === ItemTypes.GROUP) {
      img.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
      e.dataTransfer.setDragImage(img, 24, 24);
    } else if (type === ItemTypes.FOLDER) {
      img.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
      e.dataTransfer.setDragImage(img, 24, 24);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItem || draggedItem.id === folderId) {
      setDragOverFolder(null);
      setDragOverDefaultGroupZone(false);
      return;
    }

    if (draggedItemType === ItemTypes.FOLDER && folderId !== null && isDescendant(draggedItem.id, folderId)) {
      setDragOverFolder(null);
      setDragOverDefaultGroupZone(false);
      return;
    }

    if (draggedItemType === ItemTypes.FOLDER || draggedItemType === ItemTypes.GROUP) {
      if (folderId !== null) {
        if (dragOverFolder !== folderId) {
          setDragOverFolder(folderId);
          if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current);
          dragOverTimeout.current = setTimeout(() => {
            setSelectedFolder(folderId);
            setDragOverFolder(null);
          }, 700);
        }
        setDragOverDefaultGroupZone(false);
      } else {
        setDragOverFolder(null);
        if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current);
        setDragOverDefaultGroupZone(true);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent, folderId: string | null = null) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === folderId) return;
    if (draggedItemType === ItemTypes.FOLDER && folderId !== null && isDescendant(draggedItem.id, folderId)) return;

    if (folderId !== null) {
      setDragOverFolder(folderId);
      setDragOverDefaultGroupZone(false);
    } else {
      setDragOverFolder(null);
      setDragOverDefaultGroupZone(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, folderId: string | null = null) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (folderId !== null && dragOverFolder === folderId) setDragOverFolder(null);
      else if (folderId === null) setDragOverDefaultGroupZone(false);
      if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null = null) => {
    e.preventDefault();
    setDragOverFolder(null);
    setDragOverDefaultGroupZone(false);
    if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current);

    if (!draggedItem || !professeur?.user_id) return;
    if (draggedItem.id === targetFolderId) {
      setDraggedItem(null);
      setDraggedItemType(null);
      return;
    }
    if (draggedItemType === ItemTypes.FOLDER && targetFolderId !== null && isDescendant(draggedItem.id, targetFolderId)) {
      toast.error("Impossible de déplacer un dossier dans lui-même.");
      setDraggedItem(null);
      setDraggedItemType(null);
      return;
    }

    if (draggedItemType === ItemTypes.FOLDER) {
      const folderToMove = folders.find((f) => f.id === draggedItem.id);
      if (folderToMove) {
        const existing = folders.filter(
          (f) =>
            f.parentId === targetFolderId &&
            f.id !== folderToMove.id &&
            f.teacherId === professeur.user_id
        );
        if (existing.some((f) => f.name.toLowerCase() === folderToMove.name.toLowerCase())) {
          toast.error("Un dossier avec le même nom existe déjà ici.");
          setDraggedItem(null);
          setDraggedItemType(null);
          return;
        }
      }

      const { error } = await supabase
        .from("folders")
        .update({ parent_id: targetFolderId })
        .eq("id", draggedItem.id)
        .eq("user_id", professeur.user_id);

      if (error) {
        console.error(error);
        toast.error("Déplacement impossible.");
      } else {
        toast.success("Dossier déplacé.");
        await fetchFolders();
      }
    } else if (draggedItemType === ItemTypes.GROUP) {
      const finalTarget = targetFolderId !== null ? targetFolderId : selectedFolder;

      const groupToMove = groups.find((g) => g.id === draggedItem.id);
      if (groupToMove) {
        const existing = groups.filter(
          (g) =>
            g.folderId === finalTarget &&
            g.id !== groupToMove.id &&
            g.teacherId === professeur.user_id
        );
        if (existing.some((g) => g.name.toLowerCase() === groupToMove.name.toLowerCase())) {
          toast.error("Un groupe avec le même nom existe déjà ici.");
          setDraggedItem(null);
          setDraggedItemType(null);
          return;
        }
      }

      const { error } = await supabase
        .from("groups")
        .update({ folder_id: finalTarget })
        .eq("id", draggedItem.id)
        .eq("teacher_id", professeur.user_id);

      if (error) {
        console.error(error);
        toast.error("Déplacement impossible.");
      } else {
        toast.success("Groupe déplacé.");
        await fetchGroups();
      }
    }

    setDraggedItem(null);
    setDraggedItemType(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedItemType(null);
    setDragOverFolder(null);
    setDragOverDefaultGroupZone(false);
    if (dragOverTimeout.current) clearTimeout(dragOverTimeout.current);
  };

  /* =======================
     Rendu
     ======================= */
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        Loading...
      </div>
    );
  }

  const handleGroupClick = (group: Group) => {
    setSelectedGroup?.(group);
    setPage("GestionEleves");
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "",
          style: {
            padding: "16px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
            background: "linear-gradient(to right,#6D28D9,#9333EA)",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#fff" },
            style: { background: "linear-gradient(to right,#06B6D4,#10B981)" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
            style: { background: "linear-gradient(to right,#DC2626,#EF4444)" },
          },
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Décor */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse -translate-x-1/2 -translate-y-1/2"
            style={{ animationDelay: "4s" }}
          />
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45 rounded-lg" />
          <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white rotate-12 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white rotate-45" />
        </div>

        <div
          className={`relative z-10 container mx-auto px-4 py-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
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

            <div className="w-24" />
          </div>

          {/* Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-white/60 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`flex items-center px-3 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-all ${
                  dragOverDefaultGroupZone && selectedFolder === null
                    ? "border-2 border-cyan-400 animate-pulse"
                    : ""
                }`}
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
                    className={`px-3 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-all ${
                      dragOverFolder === folder.id ? "border-2 border-cyan-400 animate-pulse" : ""
                    }`}
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
                  <div className="flex-1" />
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

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un groupe ou un élève..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white placeholder-white/40 border border-white/20 focus:border-white/40 focus:outline-none transition-all"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.currentTarget.value)
                  }
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

          {/* Modal dossier */}
          {showCreateFolder && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-8 rounded-xl shadow-2xl border border-white/20 w-96">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Créer un nouveau dossier
                </h3>
                <input
                  type="text"
                  placeholder="Nom du dossier"
                  className="w-full px-4 py-3 mb-4 bg-white/10 rounded-lg text-white placeholder-white/50 border border-white/20 focus:border-purple-400 focus:outline-none"
                  value={nomDossier}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNomDossier(e.currentTarget.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleAddFolder();
                  }}
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCreateFolder(false);
                      setNomDossier("");
                    }}
                    className="px-5 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all border border-white/20"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddFolder}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-md"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal groupe */}
          {showCreateGroup && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-xl shadow-2xl border border-white/20 w-96">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Créer un nouveau groupe
                </h3>
                <input
                  type="text"
                  placeholder="Nom du groupe"
                  className="w-full px-4 py-3 mb-4 bg-white/10 rounded-lg text-white placeholder-white/50 border border-white/20 focus:border-purple-400 focus:outline-none"
                  value={newGroup.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewGroup((prev) => ({ ...prev, name: e.currentTarget.value }))
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") createGroup();
                  }}
                />
                <div className="mb-4">
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Couleur du groupe :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {groupColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newGroup.color === color ? "border-white scale-110" : "border-transparent"
                        } transition-all hover:scale-110`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewGroup((prev) => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCreateGroup(false);
                      setNewGroup({ name: "", folderId: null, color: groupColors[0] });
                    }}
                    className="px-5 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all border border-white/20"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={createGroup}
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dossiers */}
          {getCurrentFolders().length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Dossiers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {getCurrentFolders().map((folder) => {
                  const subFoldersCount = folders.filter(
                    (f) => f.parentId === folder.id && f.teacherId === professeur.user_id
                  ).length;
                  const groupsInFolderCount = groups.filter(
                    (g) => g.folderId === folder.id && g.teacherId === professeur.user_id
                  ).length;
                  const isDragOver = dragOverFolder === folder.id && draggedItem;
                  const isPulsing = isDragOver && dragOverTimeout.current !== null;

                  return (
                    <div
                      key={folder.id}
                      className={`group relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${
                        isDragOver ? "border-2 border-cyan-400" : "border-white/20 hover:border-white/40"
                      } ${isPulsing ? "animate-pulse" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { id: folder.id }, ItemTypes.FOLDER)}
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
                              <div
                                className="flex items-center space-x-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  defaultValue={folder.name}
                                  className="flex-1 px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === "Enter") {
                                      const v = (e.currentTarget as HTMLInputElement).value;
                                      updateFolder(folder.id, v);
                                    }
                                  }}
                                  onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                    updateFolder(folder.id, e.currentTarget.value)
                                  }
                                  autoFocus
                                />
                                <button
                                  onClick={() => setEditingFolder(null)}
                                  className="p-1 text-white/60 hover:text-white transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <h3 className="text-xl font-semibold text-white truncate">
                                {folder.name}
                              </h3>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-white/70 text-sm">
                        {subFoldersCount} dossier{subFoldersCount !== 1 ? "s" : ""},{" "}
                        {groupsInFolderCount} groupe{groupsInFolderCount !== 1 ? "s" : ""}
                      </p>

                      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => setEditingFolder(folder.id)}
                          className="p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all"
                          title="Renommer le dossier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFolder(folder.id)}
                          className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all"
                          title="Supprimer le dossier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Groupes */}
          <div
            className={`${
              getCurrentGroups().length > 0 || getCurrentFolders().length === 0 ? "mb-8" : ""
            } ${
              dragOverDefaultGroupZone && selectedFolder !== null && getCurrentFolders().length === 0
                ? "border-2 border-cyan-400 animate-pulse rounded-2xl p-4"
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, selectedFolder)}
            onDragEnter={(e) => handleDragEnter(e, selectedFolder)}
            onDragLeave={(e) => handleDragLeave(e, selectedFolder)}
            onDrop={(e) => handleDrop(e, selectedFolder)}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Groupes</h2>
            {filteredGroups().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups().map((group) => (
                  <div
                    key={group.id}
                    className="group relative bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                    draggable
                    onDragStart={(e) => handleDragStart(e, { id: group.id }, ItemTypes.GROUP)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleGroupClick(group)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mr-3"
                          style={{ backgroundColor: group.color }}
                        >
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          {editingGroup === group.id ? (
                            <div
                              className="flex items-center space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                defaultValue={group.name}
                                className="flex-1 px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                  if (e.key === "Enter") {
                                    updateGroup(group.id, (e.currentTarget as HTMLInputElement).value);
                                  }
                                }}
                                onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                  updateGroup(group.id, e.currentTarget.value)
                                }
                                autoFocus
                              />
                              <button
                                onClick={() => setEditingGroup(null)}
                                className="p-1 text-white/60 hover:text-white transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-xl font-semibold text-white truncate">
                              {group.name}
                            </h3>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-white/70 text-sm mb-4">
                      {group.students.length} élève{group.students.length !== 1 ? "s" : ""}
                    </p>

                    {editingGroup === group.id && (
                      <div
                        className="flex flex-wrap gap-1 mb-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {groupColors.map((color) => (
                          <button
                            key={color}
                            className={`w-5 h-5 rounded-full border-2 ${
                              group.color === color ? "border-white" : "border-transparent"
                            } transition-all hover:scale-105`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateGroupColor(group.id, color)}
                          />
                        ))}
                      </div>
                    )}

                    <div
                      className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditingGroup(group.id)}
                        className="p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all"
                        title="Renommer le groupe"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all"
                        title="Supprimer le groupe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {expandedGroup === group.id && (
                      <div className="mt-4 border-t border-white/20 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-3">
                          Élèves du groupe :
                        </h4>

                        {group.students.length > 0 ? (
                          <ul className="space-y-2">
                            {group.students.map((student) => (
                              <li
                                key={student.id}
                                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                              >
                                {editingStudent === student.id ? (
                                  <div
                                    className="flex-1 flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      defaultValue={student.name}
                                      className="flex-1 px-3 py-1 bg-white/10 rounded-lg text-white border border-white/20 focus:border-white/40 focus:outline-none"
                                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === "Enter") {
                                          const v = (e.currentTarget as HTMLInputElement).value;
                                          updateStudent(group.id, student.id, v);
                                        }
                                      }}
                                      onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                        updateStudent(group.id, student.id, e.currentTarget.value)
                                      }
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => setEditingStudent(null)}
                                      className="p-1 text-white/60 hover:text-white transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-white">{student.name}</span>
                                )}

                                <div className="flex items-center space-x-2">
                                  <span className="text-white/60 text-sm font-mono">
                                    {student.code}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(student.code)}
                                    className={`p-1 rounded-full text-white ${
                                      copiedCode === student.code
                                        ? "bg-green-500/30"
                                        : "bg-white/10 hover:bg-white/20"
                                    } transition-all`}
                                    title="Copier le code"
                                  >
                                    {copiedCode === student.code ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setEditingStudent(student.id)}
                                    className="p-1 bg-white/10 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all"
                                    title="Renommer l'élève"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteStudent(group.id, student.id)}
                                    className="p-1 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all"
                                    title="Supprimer l'élève"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-white/60 text-sm italic">
                            Aucun élève dans ce groupe.
                          </p>
                        )}

                        <div className="mt-4 flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Nom du nouvel élève"
                            className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/50 border border-white/20 focus:border-purple-400 focus:outline-none"
                            value={newStudent.groupId === group.id ? newStudent.name : ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewStudent({
                                name: e.currentTarget.value,
                                groupId: group.id,
                              })
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === "Enter") addStudent(group.id);
                            }}
                          />
                          <button
                            onClick={() => addStudent(group.id)}
                            className="p-2 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg text-white hover:from-teal-600 hover:to-green-600 transition-all"
                            title="Ajouter un élève"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-white/60 bg-white/5 backdrop-blur-sm rounded-xl border border-white/20">
                <p>Aucun groupe dans ce dossier pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GestionGroupes;
