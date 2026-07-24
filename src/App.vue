<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  ClipboardPen, Layers, LayoutDashboard, Database, HelpCircle, 
  RefreshCcw, Bell, CheckCircle2, History, Trash2, Mail, 
  LogOut, UserCheck, Lock 
} from 'lucide-vue-next';
import { 
  ERPRole, FicheNonConformite, FicheStatus, AtelierSource, 
  DestinationType, SimulatedEmail, X3Notification, ROLE_LABELS 
} from './types';
import RoleSelector from './components/RoleSelector.vue';
import FicheForm from './components/FicheForm.vue';
import FicheList from './components/FicheList.vue';
import RetouchePanel from './components/RetouchePanel.vue';
import X3Integration from './components/X3Integration.vue';
import NotificationLog from './components/NotificationLog.vue';
import FicheDetailPanel from './components/FicheDetailPanel.vue';
import DecisionProcessView from './components/DecisionProcessView.vue';
import RapportRetoucheView from './components/RapportRetoucheView.vue';
import CorrectionErreurCodeView from './components/CorrectionErreurCodeView.vue';
import Login from './components/Login.vue';
import SopalLogo from './components/SopalLogo.vue';

// Key for Local Storage durability
const STORAGE_KEY_FICHES = 'erp_fiches_data_v4';
const STORAGE_KEY_EMAILS = 'erp_emails_data_v4';
const STORAGE_KEY_NOTIFS = 'erp_notifs_data_v4';

// Pre-existing mock data for high-fidelity demonstration on first load
const INITIAL_FICHES: FicheNonConformite[] = [];

const INITIAL_EMAILS: SimulatedEmail[] = [];

const INITIAL_NOTIFS: X3Notification[] = [];

const INTRANET_CREDENTIALS = {
  [ERPRole.OPERATEUR]: { username: "op.sopal" },
  [ERPRole.ADMINISTRATEUR]: { username: "admin.sopal" },
  [ERPRole.RESP_PROCESS]: { username: "process.sopal" },
  [ERPRole.RESP_RETOUCHE]: { username: "retouche.sopal" },
  [ERPRole.RESP_LOGISTIQUE]: { username: "logistique.sopal" },
  [ERPRole.MAGASINIER]: { username: "magasinier.sopal" },
};

// State refs
const isAuthenticated = ref(localStorage.getItem('sopal_authenticated') === 'true');
const authUsername = ref(localStorage.getItem('sopal_auth_username') || '');
const storedRole = localStorage.getItem('sopal_active_role') as ERPRole;
const activeRole = ref<ERPRole>(
  Object.values(ERPRole).includes(storedRole) ? storedRole : ERPRole.OPERATEUR
);

const fiches = ref<FicheNonConformite[]>([]);
const emails = ref<SimulatedEmail[]>([]);
const x3Notifications = ref<X3Notification[]>([]);

const currentView = ref<'dashboard' | 'create' | 'retouche' | 'x3' | 'detail'>('dashboard');
const selectedFiche = ref<FicheNonConformite | null>(null);

// Load state on mount
onMounted(() => {
  const savedFiches = localStorage.getItem(STORAGE_KEY_FICHES);
  const savedEmails = localStorage.getItem(STORAGE_KEY_EMAILS);
  const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);

  if (savedFiches) {
    fiches.value = JSON.parse(savedFiches);
  } else {
    fiches.value = INITIAL_FICHES;
    localStorage.setItem(STORAGE_KEY_FICHES, JSON.stringify(INITIAL_FICHES));
  }

  if (savedEmails) {
    emails.value = JSON.parse(savedEmails);
  } else {
    emails.value = INITIAL_EMAILS;
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(INITIAL_EMAILS));
  }

  if (savedNotifs) {
    x3Notifications.value = JSON.parse(savedNotifs);
  } else {
    x3Notifications.value = INITIAL_NOTIFS;
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFS));
  }
});

function saveToStorage(updatedFiches: FicheNonConformite[], updatedEmails: SimulatedEmail[], updatedNotifs: X3Notification[]) {
  fiches.value = updatedFiches;
  emails.value = updatedEmails;
  x3Notifications.value = updatedNotifs;
  localStorage.setItem(STORAGE_KEY_FICHES, JSON.stringify(updatedFiches));
  localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(updatedEmails));
  localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updatedNotifs));
}

// Stats computed variables
const dashboardFiches = computed(() => {
  return fiches.value.filter(f => f.destination !== DestinationType.ERREUR_CODE);
});

const totalFiches = computed(() => dashboardFiches.value.length);
const countNouveaux = computed(() => dashboardFiches.value.filter(f => f.statut === FicheStatus.NOUVEAU).length);
const countEnCours = computed(() => dashboardFiches.value.filter(f => f.statut === FicheStatus.EN_COURS).length);
const countRetouches = computed(() => dashboardFiches.value.filter(f => f.statut === FicheStatus.RETOUCHE).length);
const countClotures = computed(() => dashboardFiches.value.filter(f => f.statut === FicheStatus.CLOTURE).length);

const displayedEmails = computed(() => {
  if (currentView.value === 'erreur-code') {
    return emails.value.filter(e => 
      e.recipients.includes("Coordinateur.plannification@sopal.com") || 
      e.subject.includes("Erreur Code")
    );
  }
  return emails.value.filter(e => 
    !e.recipients.includes("Coordinateur.plannification@sopal.com") && 
    !e.subject.includes("Erreur Code")
  );
});

const displayedX3Notifications = computed(() => {
  if (currentView.value === 'erreur-code') {
    return x3Notifications.value.filter(n => n.message.includes("Erreur Code"));
  }
  return x3Notifications.value.filter(n => !n.message.includes("Erreur Code"));
});

// Creation
function handleCreateFiche(newFicheData: Partial<FicheNonConformite>) {
  const newId = "FNC-2026-" + String(fiches.value.length + 1).padStart(3, '0');
  const newFiche: FicheNonConformite = {
    referencePiece: newFicheData.referencePiece || '',
    of: newFicheData.of || '',
    quantite: newFicheData.quantite || 1,
    atelierSource: newFicheData.atelierSource || AtelierSource.ASSEMBLAGE_2,
    destination: newFicheData.destination || DestinationType.RETOUCHE,
    dateCreation: newFicheData.dateCreation || new Date().toISOString().split('T')[0],
    symptomeDetecte: newFicheData.symptomeDetecte || '',
    descriptionDefaut: newFicheData.descriptionDefaut || '',
    emplacementDefaut: newFicheData.emplacementDefaut || '',
    gammeArticle: newFicheData.gammeArticle || '',
    id: newId,
    statut: FicheStatus.NOUVEAU,
    ancienEmplacement: "ATEL-RET-01",
    operateur: newFicheData.operateur || ''
  };

  // Automatic emails SMTP
  let recipients = [
    "Responsable.process@sopal.com",
    "Magasinier.c2@sopal.com",
    "Responsable.logistique@sopal.com"
  ];

  const operateurName = newFiche.operateur || "Non renseigné";
  const atelierEmetteur = newFiche.atelierSource || "Non renseigné";
  const dateFormatted = newFiche.dateCreation.split('-').reverse().join('/');
  let bodyText = '';

  if (newFiche.destination === DestinationType.ERREUR_CODE) {
    recipients = [
      "Coordinateur.plannification@sopal.com",
      "Responsable.logistique@sopal.com"
    ];
    bodyText = `Bonjour,\nUn nouveau bon de retour ainsi qu'une fiche de non-conformité ont été créés.\nFiche NC : ${newId}\nCode article erroné : ${newFiche.referencePiece}\nQuantité : ${newFiche.quantite}\nDéfaut : Erreur Code\nCode article correcte : ${newFiche.symptomeDetecte || ''}\nDate : ${dateFormatted}\n\nCordialement,\n\nOpérateur SOPAL : ${operateurName} - ${atelierEmetteur}`;
  } else {
    bodyText = `Bonjour,\nUn nouveau bon de retour ainsi qu'une fiche de non-conformité ont été créés.\nFiche NC : ${newId}\nRéférence article : ${newFiche.referencePiece}\nQuantité : ${newFiche.quantite}\nDestination : ${newFiche.destination}\nDéfaut : ${newFiche.symptomeDetecte || newFiche.descriptionDefaut}\nEmplacement du défaut : ${newFiche.emplacementDefaut || 'Non précisé'}\nDate : ${dateFormatted}\n\nCordialement,\n\nOpérateur SOPAL : ${operateurName} - ${atelierEmetteur}`;
  }

  const newEmail: SimulatedEmail = {
    id: "mail-" + Date.now(),
    sender: "Opérateur.assemblage@sopal.com",
    recipients,
    subject: `Nouveau Bon de Retour émis - ${newFiche.referencePiece} (${newId})`,
    body: bodyText,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false
  };

  const updatedFiches = [newFiche, ...fiches.value];
  const updatedEmails = [newEmail, ...emails.value];
  saveToStorage(updatedFiches, updatedEmails, x3Notifications.value);
  
  currentView.value = 'dashboard';
}

// Decision process
function handleSaveProcessDecision(payload: { 
  id: string; 
  decision: string; 
  date: string;
  atelierSource?: string;
  descriptionDefaut?: string;
  emplacementDefaut?: string;
}) {
  const updatedFiches = fiches.value.map(f => {
    if (f.id === payload.id) {
      return {
        ...f,
        decisionProcess: payload.decision,
        dateDecisionProcess: payload.date,
        statut: FicheStatus.EN_COURS,
        ...(payload.atelierSource && { atelierSource: payload.atelierSource as any }),
        ...(payload.descriptionDefaut && { descriptionDefaut: payload.descriptionDefaut }),
        ...(payload.emplacementDefaut && { emplacementDefaut: payload.emplacementDefaut })
      };
    }
    return f;
  });

  const targetFiche = fiches.value.find(f => f.id === payload.id);
  if (!targetFiche) return;

  const newEmail: SimulatedEmail = {
    id: "mail-" + Date.now(),
    sender: "Responsable.process@sopal.com",
    recipients: ["Opérateur.assemblage@sopal.com", "Responsable.atelier@sopal.com", "Responsable.logistique@sopal.com", "Magasinier.c2@sopal.com"],
    subject: `Process : Décision validée pour ${targetFiche.referencePiece} (${payload.id})`,
    body: `Bonjour,\n\nLe Service Process a validé la décision technique pour la fiche de non-conformité ${payload.id}.\n\nDécision : "${payload.decision}"\nDéfaut déclaré : ${payload.descriptionDefaut || targetFiche.descriptionDefaut}\nDate de décision : ${payload.date}\n\n\nCordialement,\nService Process .`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false
  };

  saveToStorage(updatedFiches, [newEmail, ...emails.value], x3Notifications.value);
  
  const updatedF = updatedFiches.find(f => f.id === payload.id);
  if (updatedF) {
    selectedFiche.value = updatedF;
  }
}

// Save retouch details
function handleSaveRetoucheDetails(payload: { 
  id: string; 
  realized: 'Oui' | 'Non'; 
  date: string; 
  repartition: { ad: number; rb: number; re: number; rp: number }; 
  comment: string;
}) {
  const updatedFiches = fiches.value.map(f => {
    if (f.id === payload.id) {
      return {
        ...f,
        statut: FicheStatus.RETOUCHE,
        retoucheRealisee: payload.realized,
        dateRealisationRetouche: payload.date,
        dateFinRetouche: payload.date,
        repartitionFin: payload.repartition,
        commentaireRetouche: payload.comment,
        responsableRetouche: "Michel (Atelier Retouche)"
      };
    }
    return f;
  });

  const targetFiche = fiches.value.find(f => f.id === payload.id);
  if (!targetFiche) return;

  const newEmail: SimulatedEmail = {
    id: "mail-" + Date.now(),
    sender: "Responsable.atelier@sopal.com",
    recipients: ["Magasinier.c2@sopal.com", "Responsable.logistique@sopal.com", "Responsable.process@sopal.com"],
    subject: `Réparation validée pour "${targetFiche.referencePiece}" (${payload.id})`,
    body: `Bonjour,\n\nLa retouche physique des pièces associées à la fiche ${payload.id} ("${targetFiche.referencePiece}", Qté: ${targetFiche.quantite}) est terminée et validée.\n\nVeuillez procéder au changement d'emplacement pour réintégrer les pièces en stock C2.\n\nCordialement,\nAtelier Retouche.`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false
  };

  const newX3Notif: X3Notification = {
    id: "notif-" + Date.now(),
    ficheId: payload.id,
    referencePiece: targetFiche.referencePiece,
    message: `Retouche validée. Réintégrer le lot selon répartition : AD:${payload.repartition.ad}, RB:${payload.repartition.rb}, RE:${payload.repartition.re}, RP:${payload.repartition.rp}.`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false,
    status: 'pending'
  };

  saveToStorage(updatedFiches, [newEmail, ...emails.value], [newX3Notif, ...x3Notifications.value]);

  const updatedF = updatedFiches.find(f => f.id === payload.id);
  if (updatedF) {
    selectedFiche.value = updatedF;
  }
}

// Action du coordinateur planification pour l'Erreur Code
function handleCoordinateurVerif(payload: { id: string; choix: 'corrige' | 'non_corrige' }) {
  const targetFiche = fiches.value.find(f => f.id === payload.id);
  if (!targetFiche) return;

  const isCorrige = payload.choix === 'corrige';

  const updatedFiches = fiches.value.map(f => {
    if (f.id === payload.id) {
      return {
        ...f,
        coordinateurVerifie: true,
        coordinateurChoix: payload.choix,
        ...(isCorrige ? {
          erreurCodeCorrigee: true,
          dateCorrectionErreurCode: new Date().toISOString().split('T')[0],
          statut: FicheStatus.RETOUCHE
        } : {})
      };
    }
    return f;
  });

  const choixText = isCorrige ? "Le mouvement de l'OF est vérifié et le code est corrigé." : "Le mouvement de l'OF est vérifié et le code n'est pas corrigé.";

  const newEmail: SimulatedEmail = {
    id: "mail-" + Date.now(),
    sender: "Coordinateur.planification@sopal.com",
    recipients: ["Responsable.logistique@sopal.com", "Magasinier.c2@sopal.com"],
    subject: `Erreur Code : ${targetFiche.referencePiece} (${payload.id})`,
    body: `Bonjour,\n\nSuite à la vérification de l'OF pour la fiche d'anomalie ${payload.id} :\n\n${choixText}\n\nCordialement,\nCoordinateur de Planification.`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false
  };

  saveToStorage(updatedFiches, [newEmail, ...emails.value], x3Notifications.value);
}

// Save Erreur Code Correction
function handleCorrectionErreurCode(payload: { id: string; date: string }) {
  const updatedFiches = fiches.value.map(f => {
    if (f.id === payload.id) {
      return {
        ...f,
        erreurCodeCorrigee: true,
        dateCorrectionErreurCode: payload.date,
        statut: FicheStatus.RETOUCHE // Ready for X3
      };
    }
    return f;
  });

  const targetFiche = fiches.value.find(f => f.id === payload.id);
  if (!targetFiche) return;

  const newEmail: SimulatedEmail = {
    id: "mail-" + Date.now(),
    sender: "Responsable.logistique@sopal.com",
    recipients: ["Magasinier.c2@sopal.com", "Coordinateur.plannification@sopal.com"],
    subject: `Erreur Code Corrigée - ${targetFiche.referencePiece} (${payload.id})`,
    body: `Bonjour,\n\nL'erreur de code a été corrigée dans l'ERP pour la fiche ${payload.id}.\n\nArticle : ${targetFiche.referencePiece}\nAtelier source : ${targetFiche.atelierSource}\nDate de correction : ${payload.date}\n\nCordialement,\nResponsable Logistique SOPAL.`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false
  };

  const newX3Notif: X3Notification = {
    id: "notif-" + Date.now(),
    ficheId: payload.id,
    referencePiece: targetFiche.referencePiece,
    message: `Erreur de code corrigée sur ${targetFiche.referencePiece}. Effectuez le mouvement X3 final.`,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    isRead: false,
    status: 'pending'
  };

  saveToStorage(updatedFiches, [newEmail, ...emails.value], [newX3Notif, ...x3Notifications.value]);

  const updatedF = updatedFiches.find(f => f.id === payload.id);
  if (updatedF) {
    selectedFiche.value = updatedF;
  }
}

// Sage X3 stock movement
function handleValidateMoveStock(ficheId: string, nouvelEmpl: string, operatorNom: string, dateOp: string) {
  const targetFiche = fiches.value.find(f => f.id === ficheId);
  if (!targetFiche) return;

  const isNouveauMove = targetFiche.statut === FicheStatus.NOUVEAU;

  const updatedFiches = fiches.value.map(f => {
    if (f.id === ficheId) {
      return {
        ...f,
        statut: isNouveauMove ? FicheStatus.NOUVEAU : FicheStatus.CLOTURE,
        nouvelEmplacement: nouvelEmpl,
        dateChangementEmplacement: dateOp,
        magasinierNom: operatorNom
      };
    }
    return f;
  });

  const updatedNotifs = x3Notifications.value.map(n => {
    if (n.ficheId === ficheId) {
      return { ...n, status: 'processed' as const, isRead: true };
    }
    return n;
  });

  let newEmail: SimulatedEmail | null = null;

  if (isNouveauMove) {
    newEmail = {
      id: "mail-" + Date.now(),
      sender: "Magasinier.c2@sopal.com",
      recipients: ["Responsable.process@sopal.com"],
      subject: `ERP : Déplacement vers zone d'attente ${targetFiche.referencePiece} (${ficheId})`,
      body: `Le magasinier a déplacé le lot de la fiche ${ficheId} vers l'emplacement ${nouvelEmpl}. En attente de la décision technique du service Process. Date: ${dateOp}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false
    };
  } else {
    newEmail = {
      id: "mail-" + Date.now(),
      sender: "Magasinier.c2@sopal.com",
      recipients: ["Responsable.logistique@sopal.com", "Responsable.process@sopal.com", "Responsable.atelier@sopal.com"],
      subject: `Réintégration réussie de "${targetFiche.referencePiece}" (${ficheId})`,
      body: `Bonjour,\n\nMouvement de stock Sage X3 enregistré avec succès pour la fiche ${ficheId}.\n\nArticle : "${targetFiche.referencePiece}"\nQuantité : ${targetFiche.quantite}\nAncien emplacement : ${targetFiche.ancienEmplacement || 'poste assemblage 2'}\nNouvel emplacement : ${nouvelEmpl}\nOpérateur de stock : ${operatorNom}\nDate de saisie : ${dateOp}\n\nLa fiche de non-conformité est officiellement CLÔTURÉE.\n\nCordialement,\nRobot de gestion des stocks ERP Sage X3.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false
    };
  }

  saveToStorage(updatedFiches, [newEmail, ...emails.value], updatedNotifs);
  currentView.value = 'dashboard';
}

// Reset data
function handleClearAll() {
  if (confirm("Réinitialiser le simulateur à l'état d'usine ? Toutes les modifications locales seront effacées.")) {
    fiches.value = INITIAL_FICHES;
    emails.value = INITIAL_EMAILS;
    x3Notifications.value = INITIAL_NOTIFS;
    localStorage.setItem(STORAGE_KEY_FICHES, JSON.stringify(INITIAL_FICHES));
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(INITIAL_EMAILS));
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFS));
    currentView.value = 'dashboard';
    selectedFiche.value = null;
  }
}

// Simple navigation
function handleSelectFicheClick(fiche: FicheNonConformite) {
  selectedFiche.value = fiche;
  currentView.value = 'detail';
}

function handleTreatRetoucheClick(fiche: FicheNonConformite) {
  selectedFiche.value = fiche;
  currentView.value = 'detail'; // Focus on detail panel where they fill the form
}

function handleMoveStockX3Click(fiche: FicheNonConformite) {
  selectedFiche.value = fiche;
  currentView.value = 'x3';
}

function handleOpenX3Notification(notif: X3Notification) {
  const correspondingFiche = fiches.value.find(f => f.id === notif.ficheId);
  if (correspondingFiche) {
    selectedFiche.value = correspondingFiche;
    currentView.value = 'x3';
  }
}

// Authentication
function handleLogout() {
  isAuthenticated.value = false;
  authUsername.value = '';
  localStorage.removeItem('sopal_authenticated');
  localStorage.removeItem('sopal_auth_username');
  localStorage.removeItem('sopal_active_role');
}

function handleLoginSuccess(role: ERPRole, username: string) {
  isAuthenticated.value = true;
  authUsername.value = username;
  activeRole.value = role;
  localStorage.setItem('sopal_authenticated', 'true');
  localStorage.setItem('sopal_auth_username', username);
  localStorage.setItem('sopal_active_role', role);
}

function handleRoleChange(newRole: ERPRole) {
  activeRole.value = newRole;
  localStorage.setItem('sopal_active_role', newRole);
  const matchingCred = INTRANET_CREDENTIALS[newRole];
  if (matchingCred) {
    authUsername.value = matchingCred.username;
    localStorage.setItem('sopal_auth_username', matchingCred.username);
  }
}
</script>

<template>
  <div v-if="!isAuthenticated" class="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
    <Login @loginSuccess="handleLoginSuccess" />
  </div>

  <div v-else class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
    <!-- SOPAL Header Bar -->
    <header class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4 sm:gap-6">
          <!-- SOPAL Logo on the left -->
          <SopalLogo size="sm" />
          
          <!-- Elegant vertical separator -->
          <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
          
          <!-- User Name also on the left, next to the logo -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase hidden md:inline">Session Intranet Active :</span>
            <span class="font-extrabold text-blue-900 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1">
              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {{ authUsername }} <span class="text-slate-500 font-normal">({{ ROLE_LABELS[activeRole].title }})</span>
            </span>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-fadeIn"
          title="Se déconnecter de l'intranet"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>

    <!-- Main ERP Layout Container -->
    <div class="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
      
      <!-- Left Sidebar - 3 Cols -->
      <aside class="lg:col-span-3 flex flex-col space-y-5">
        
        <!-- Main Intranet Navigation Menu Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div class="pb-3 border-b border-slate-100">
            <span class="text-[10px] font-extrabold text-[#004F9F] uppercase tracking-wider block font-mono">📂 Menu Intranet SOPAL</span>
          </div>

          <!-- Navigation Section: Retours PNC -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <ClipboardPen class="w-4 h-4 text-[#004F9F]" />
              <span>Retours PNC</span>
            </div>
            
            <div class="pl-3 flex flex-col gap-1 text-xs">
              <!-- Create return slip option based on role permissions -->
              <button
                v-if="activeRole === ERPRole.OPERATEUR || activeRole === ERPRole.ADMINISTRATEUR"
                @click="currentView = 'create'; selectedFiche = null;"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                :class="currentView === 'create'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Créer bon de retour
              </button>
              
              <button
                v-else
                disabled
                title="Création réservée aux Opérateurs d'Assemblage 2 et Responsables Logistiques (Admin)"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed"
              >
                <Lock class="w-3.5 h-3.5 text-slate-350" />
                <span class="truncate font-sans">Créer bon de retour (Verrouillé)</span>
              </button>

              <button
                @click="currentView = 'dashboard'; selectedFiche = null;"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                :class="currentView === 'dashboard' || (currentView === 'detail' && selectedFiche)
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Consulter bon de retour
              </button>

              <button
                v-if="activeRole === ERPRole.RESP_PROCESS || activeRole === ERPRole.ADMINISTRATEUR"
                @click="currentView = 'decision-process'; selectedFiche = null;"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                :class="currentView === 'decision-process'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Décision process
              </button>
              <button
                v-else
                disabled
                title="Réservé au Service Process"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed"
              >
                <Lock class="w-3.5 h-3.5 text-slate-350" />
                <span class="truncate font-sans">Décision process (Verrouillé)</span>
              </button>

              <button
                v-if="activeRole === ERPRole.RESP_RETOUCHE || activeRole === ERPRole.ADMINISTRATEUR"
                @click="currentView = 'rapport-retouche'; selectedFiche = null;"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                :class="currentView === 'rapport-retouche'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Rapport retouche
              </button>
              <button
                v-else
                disabled
                title="Réservé à l'Atelier de Retouche"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed"
              >
                <Lock class="w-3.5 h-3.5 text-slate-350" />
                <span class="truncate font-sans">Rapport retouche (Verrouillé)</span>
              </button>
              
              <button
                v-if="activeRole === ERPRole.OPERATEUR || activeRole === ERPRole.COORDINATEUR_PLANIFICATION || activeRole === ERPRole.MAGASINIER || activeRole === ERPRole.RESP_LOGISTIQUE || activeRole === ERPRole.ADMINISTRATEUR"
                @click="currentView = 'erreur-code'; selectedFiche = null;"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer"
                :class="currentView === 'erreur-code'
                  ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current" />
                Correction Erreur Code
              </button>
              <button
                v-else
                disabled
                title="Réservé aux intervenants Erreur Code"
                class="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed"
              >
                <Lock class="w-3.5 h-3.5 text-slate-350" />
                <span class="truncate font-sans">Correction Erreur Code (Verrouillé)</span>
              </button>
            </div>
          </div>


        </div>

        <!-- Role Selector Simulation Console inside sidebar -->
        <div class="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <span class="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider font-mono">🛠️ Profil de Test (Simulateur)</span>
            <span class="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          
          <p class="text-[10px] text-slate-500 leading-normal font-medium">
            Cliquez ci-dessous pour changer de rôle et franchir chaque étape du workflow :
          </p>

          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="role in Object.values(ERPRole)"
              :key="role"
              @click="handleRoleChange(role)"
              class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer border"
              :class="activeRole === role
                ? 'bg-blue-900 border-blue-900 text-white font-extrabold shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'"
            >
              <span>{{ ROLE_LABELS[role].title }}</span>
              <span v-if="activeRole === role" class="text-[8px] bg-blue-700 px-1 py-0.5 rounded uppercase font-bold text-white">Actif</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Middle Column - 6 Cols -->
      <main class="lg:col-span-6 flex flex-col space-y-6">
        <!-- Stats Dashboard Block -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Layers class="w-4 h-4 text-[#004F9F]" />
                {{ currentView === 'create' ? "Créer un Bon de Retour PNC" : currentView === 'detail' ? "Consultation Fiche de Non-Conformité" : "Suivi des Retours PNC & Non-Conformités" }}
              </h2>
            </div>
            
            <span class="text-[10px] bg-blue-50 border border-blue-200 font-bold text-[#004F9F] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Vue : {{ currentView }}
            </span>
          </div>

          <!-- KPI Counters -->
          <div v-if="currentView === 'dashboard'" class="grid grid-cols-3 gap-3">
            <div class="bg-blue-50/40 border border-blue-100 p-3 rounded-xl flex flex-col justify-between">
              <span class="text-[9px] font-bold text-blue-700 uppercase font-mono tracking-wider">Nouveaux</span>
              <span class="text-lg font-black text-blue-800 mt-1">{{ countNouveaux }}</span>
            </div>

            <div class="bg-amber-50/40 border border-amber-100 p-3 rounded-xl flex flex-col justify-between">
              <span class="text-[9px] font-bold text-amber-700 uppercase font-mono tracking-wider">En cours / Retouche</span>
              <span class="text-lg font-black text-amber-800 mt-1">{{ countEnCours + countRetouches }}</span>
            </div>

            <div class="bg-emerald-50/40 border border-emerald-100 p-3 rounded-xl flex flex-col justify-between">
              <span class="text-[9px] font-bold text-emerald-700 uppercase font-mono tracking-wider">Clôturés</span>
              <span class="text-lg font-black text-emerald-800 mt-1">{{ countClotures }}</span>
            </div>
          </div>
        </div>

        <!-- Render Current Active View -->
        <div class="transition-all duration-300">
          <FicheList
            v-if="currentView === 'dashboard'"
            :fiches="dashboardFiches"
            :activeRole="activeRole"
            @selectFiche="handleSelectFicheClick"
            @treatRetouche="handleTreatRetoucheClick"
            @moveStockX3="handleMoveStockX3Click"
          />

          <FicheForm
            v-else-if="currentView === 'create'"
            :activeRole="activeRole"
            :onSubmit="handleCreateFiche"
            :onCancel="() => currentView = 'dashboard'"
          />

          <X3Integration
            v-else-if="currentView === 'x3' && selectedFiche && (activeRole === ERPRole.MAGASINIER || activeRole === ERPRole.ADMINISTRATEUR)"
            :fiche="selectedFiche"
            :activeRole="activeRole"
            @validateMove="handleValidateMoveStock"
            @back="currentView = 'dashboard'"
          />

          <DecisionProcessView
            v-else-if="currentView === 'decision-process'"
            :fiches="fiches"
            :activeRole="activeRole"
            @viewDetail="handleSelectFicheClick"
            @saveProcessDecision="handleSaveProcessDecision"
          />

          <RapportRetoucheView
            v-else-if="currentView === 'rapport-retouche'"
            :fiches="fiches"
            :activeRole="activeRole"
            @saveRetoucheDetails="handleSaveRetoucheDetails"
          />

          <CorrectionErreurCodeView
            v-else-if="currentView === 'erreur-code'"
            :fiches="fiches"
            :activeRole="activeRole"
            :emails="emails"
            :x3Notifications="x3Notifications"
            @saveCorrection="handleCorrectionErreurCode"
            @coordinateurVerif="handleCoordinateurVerif"
          />

          <FicheDetailPanel
            v-else-if="currentView === 'detail' && selectedFiche"
            :fiche="selectedFiche"
            :activeRole="activeRole"
            @back="currentView = 'dashboard'"
            @treatRetouche="handleTreatRetoucheClick"
            @moveStockX3="handleMoveStockX3Click"
            @saveProcessDecision="handleSaveProcessDecision"
            @saveRetoucheDetails="handleSaveRetoucheDetails"
          />
        </div>
      </main>

      <!-- Right Column - 3 Cols -->
      <aside class="lg:col-span-3 flex flex-col space-y-5">
        


        <!-- Simulated Logs stream component -->
        <NotificationLog
          :emails="displayedEmails"
        />
      </aside>

    </div>
  </div>
</template>
