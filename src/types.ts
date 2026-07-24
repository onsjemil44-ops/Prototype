/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ERPRole {
  OPERATEUR = 'OPERATEUR', // Opérateur / contrôleur assemblage (crée la fiche)
  ADMINISTRATEUR = 'ADMINISTRATEUR', // Administrateur (accès complet, création)
  RESP_PROCESS = 'RESP_PROCESS', // Responsable process assemblage (suit l'état, décide)
  RESP_RETOUCHE = 'RESP_RETOUCHE', // Responsable atelier de retouche (renseigne la fin de retouche)
  RESP_LOGISTIQUE = 'RESP_LOGISTIQUE', // Responsable logistique (reçoit tout)
  MAGASINIER = 'MAGASINIER', // Magasinier (notification X3, changement emplacement)
  COORDINATEUR_PLANIFICATION = 'COORDINATEUR_PLANIFICATION', // Coordinateur planification (correction OF)
}

export const ROLE_LABELS: Record<ERPRole, { title: string; desc: string; icon: string }> = {
  [ERPRole.OPERATEUR]: {
    title: "Opérateur",
    desc: "Contrôle qualité, crée les fiches & bons de retour",
    icon: "ClipboardPen"
  },
  [ERPRole.ADMINISTRATEUR]: {
    title: "Admin",
    desc: "Gère l'ensemble du système, accès complet et création",
    icon: "ShieldAlert"
  },
  [ERPRole.RESP_PROCESS]: {
    title: "Responsable Process",
    desc: "Prend la décision technique sur les fiches de non-conformité",
    icon: "BarChart3"
  },
  [ERPRole.RESP_RETOUCHE]: {
    title: "Responsable Atelier de Retouche",
    desc: "Rédige le rapport de fin d'intervention et répartit le lot",
    icon: "Wrench"
  },
  [ERPRole.RESP_LOGISTIQUE]: {
    title: "Responsable Logistique",
    desc: "Coordonne les flux physiques et de retouche",
    icon: "Truck"
  },
  [ERPRole.MAGASINIER]: {
    title: "Magasinier",
    desc: "Traite l'intégration ERP (Sage X3) et les transferts de stock",
    icon: "Boxes"
  },
  [ERPRole.COORDINATEUR_PLANIFICATION]: {
    title: "Coordinateur Planification",
    desc: "Vérifie les OF et valide les corrections d'erreurs de code",
    icon: "CalendarCheck"
  }
};

export enum FicheStatus {
  NOUVEAU = 'Nouveau',
  EN_COURS = 'En cours',
  RETOUCHE = 'Retouché',
  CLOTURE = 'Clôturé',
}

export enum AtelierSource {
  ASSEMBLAGE_2 = 'Assemblage 2',
  ASSEMBLAGE_1 = 'Assemblage 1',
  CTS = 'CTS',
  POLISSAGE_1 = 'Polissage 1',
  POLISSAGE_2 = 'Polissage 2',
  POLISSAGE_4 = 'Polissage 4',
  USINAGE_1 = 'Usinage 1',
  USINAGE_2 = 'Usinage 2',
  SANA = 'Sana',
}

export enum DestinationType {
  RETOUCHE = 'Retouche',
  REBUT = 'Rebut',
  DECHROMAGE = 'Déchromage',
  ERREUR_CODE = 'Erreur Code',
  AUTRES = 'Autres',
}

export interface FicheNonConformite {
  id: string; // Ex: FNC-2026-001
  referencePiece: string;
  atelierSource: AtelierSource;
  quantite: number;
  descriptionDefaut: string;
  emplacementDefaut: string; // Zone de la pièce (ex: Face Avant)
  destination: DestinationType;
  dateCreation: string;
  statut: FicheStatus;
  
  // Données de retouche
  dateFinRetouche?: string;
  commentaireRetouche?: string;
  responsableRetouche?: string;
  
  // Nouveaux champs demandés par SOPAL
  of?: string; // Ordre de Fabrication (OF)
  symptomeDetecte?: string; // Symptôme détecté
  gammeArticle?: string; // Gamme de l'article (routing automatique)
  
  // Décision du Process Assemblage
  decisionProcess?: string; // Décision prise par le Process
  dateDecisionProcess?: string; // Date de prise de décision Process
  
  // Atelier de Retouche étendu
  retoucheRealisee?: 'Oui' | 'Non' | '';
  dateRealisationRetouche?: string;
  repartitionFin?: {
    ad: number; // AD - Accepté par Dérogation
    rb: number; // RB - Rebut
    re: number; // RE - Retouché
    rp: number; // RP - Retour Production/Usinage
  };
  
  // Historique des mouvements des pièces non conformes
  mouvements?: Array<{
    id: string;
    date: string;
    etape: string;
    acteur: string;
    description: string;
  }>;
  
  // Données Sage X3
  ancienEmplacement?: string; // Ex: ATEL-RET
  nouvelEmplacement?: string; // Ex: MAG-C2-A04 (saisi par magasinier)
  dateChangementEmplacement?: string;
  magasinierNom?: string;
  
  // Correction Erreur Code
  erreurCodeCorrigee?: boolean;
  dateCorrectionErreurCode?: string;
  coordinateurVerifie?: boolean;
  coordinateurChoix?: 'corrige' | 'non_corrige';

  // Opérateur qui a créé la fiche
  operateur?: string;
}

export interface SimulatedEmail {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
}

export interface X3Notification {
  id: string;
  ficheId: string;
  referencePiece: string;
  message: string;
  date: string;
  isRead: boolean;
  status: 'pending' | 'processed';
}
