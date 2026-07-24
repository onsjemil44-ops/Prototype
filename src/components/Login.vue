<script setup lang="ts">
import { ref } from 'vue';
import { Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-vue-next';
import { ERPRole, ROLE_LABELS } from '../types';
import SopalLogo from './SopalLogo.vue';

interface LoginProps {
  // no props needed as it's an event-driven screen
}

const emit = defineEmits<{
  (e: 'loginSuccess', role: ERPRole, username: string): void;
}>();

interface CredentialInfo {
  title: string;
  username: string;
  role: ERPRole;
}

const INTRANET_CREDENTIALS: Record<ERPRole, CredentialInfo> = {
  [ERPRole.OPERATEUR]: {
    title: "Opérateur Assemblage",
    username: "op.sopal",
    role: ERPRole.OPERATEUR,
  },
  [ERPRole.ADMINISTRATEUR]: {
    title: "Administrateur",
    username: "admin.sopal",
    role: ERPRole.ADMINISTRATEUR,
  },
  [ERPRole.RESP_PROCESS]: {
    title: "Resp. Process Assemblage",
    username: "process.sopal",
    role: ERPRole.RESP_PROCESS,
  },
  [ERPRole.RESP_RETOUCHE]: {
    title: "Resp. Atelier Retouche",
    username: "retouche.sopal",
    role: ERPRole.RESP_RETOUCHE,
  },
  [ERPRole.RESP_LOGISTIQUE]: {
    title: "Responsable Logistique",
    username: "logistique.sopal",
    role: ERPRole.RESP_LOGISTIQUE,
  },
  [ERPRole.MAGASINIER]: {
    title: "Magasinier C2 (Sage X3)",
    username: "magasinier.sopal",
    role: ERPRole.MAGASINIER,
  },
  [ERPRole.COORDINATEUR_PLANIFICATION]: {
    title: "Coordinateur Planification",
    username: "coord.sopal",
    role: ERPRole.COORDINATEUR_PLANIFICATION,
  },
};

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const lastLoggedIn = ref<string | null>(null);

function handleLogin() {
  error.value = '';

  if (!username.value.trim() || !password.value.trim()) {
    error.value = 'Veuillez renseigner votre identifiant et votre mot de passe.';
    return;
  }

  const trimmedUser = username.value.trim().toLowerCase();
  const trimmedPass = password.value.trim();

  // Verify password is "sopal" (the intranet password)
  if (trimmedPass !== 'sopal') {
    error.value = 'Mot de passe intranet incorrect. (Astuce: le mot de passe est "sopal")';
    return;
  }

  // Find if the username matches any of the participants
  const matchedRoleEntry = Object.entries(INTRANET_CREDENTIALS).find(
    ([_, cred]) => cred.username === trimmedUser
  );

  if (matchedRoleEntry) {
    const role = matchedRoleEntry[0] as ERPRole;
    const cred = matchedRoleEntry[1];
    lastLoggedIn.value = cred.title;
    setTimeout(() => {
      emit('loginSuccess', role, cred.username);
    }, 500);
  } else {
    error.value = "Identifiant inconnu sur l'annuaire de l'intranet SOPAL. (Astuces listées ci-dessous)";
  }
}

function handleQuickFill(cred: CredentialInfo) {
  username.value = cred.username;
  password.value = 'sopal';
  error.value = '';
}
</script>

<template>
  <div id="sopal-login-page" class="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 font-sans text-slate-800">
    
    <!-- Decorative top header representing safe intranet gate -->
    <div class="w-full max-w-md text-center mb-6">
      <span class="text-xs font-mono tracking-widest bg-blue-100 text-blue-700 font-extrabold uppercase px-3.5 py-1.5 rounded-full border border-blue-200">
        PORTAIL D'ACCÈS UNIQUE INTRANET SOPAL
      </span>
    </div>

    <!-- Main card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md flex flex-col transition-all duration-300">
      
      <!-- Sopal Branded Header banner -->
      <div class="p-8 pb-6 bg-gradient-to-br from-slate-50 via-slate-50 to-orange-50/20 border-b border-slate-100 flex flex-col items-center">
        <SopalLogo size="lg" class="mb-3" />
        <h1 class="text-sm font-semibold text-slate-500 text-center mt-1">
          Système Intégré de Gestion de Non-Conformité & Bons de Retour
        </h1>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleLogin" class="p-8 space-y-5">
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed animate-shake">
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <div v-if="lastLoggedIn" class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-500 animate-bounce" />
          <span>Connexion réussie en tant que <strong>{{ lastLoggedIn }}</strong>...</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Identifiant Intranet
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User class="w-4 h-4" />
            </div>
            <input
              type="text"
              v-model="username"
              placeholder="Ex: op.sopal"
              class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Mot de Passe Intranet
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-4 h-4" />
            </div>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="••••••••"
              class="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          Se Connecter <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Directory for simulator convenience -->
      <div class="px-8 pb-8 pt-2 bg-slate-50 border-t border-slate-100 flex flex-col space-y-3">
        <div class="flex items-center gap-2 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
          <ShieldCheck class="w-4 h-4 text-orange-500" />
          <span>Annuaire des Intervenants Intranet SOPAL</span>
        </div>
        <p class="text-[11px] text-slate-500 leading-normal">
          Tous les participants partagent le mot de passe intranet unique : <code class="bg-orange-100 text-orange-700 font-bold px-1 rounded">sopal</code>. Cliquez sur un intervenant pour pré-remplir le formulaire :
        </p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          <button
            v-for="cred in Object.values(INTRANET_CREDENTIALS)"
            :key="cred.role"
            type="button"
            @click="handleQuickFill(cred)"
            class="p-2 text-left bg-white hover:bg-orange-50 hover:border-orange-200 border border-slate-200 rounded-lg text-[10.5px] transition-all flex flex-col justify-between cursor-pointer group"
          >
            <span class="font-bold text-slate-800 group-hover:text-orange-700 truncate leading-tight">
              {{ ROLE_LABELS[cred.role].title }}
            </span>
            <div class="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>ID: <strong class="text-blue-600 font-bold">{{ cred.username }}</strong></span>
              <span class="text-slate-400">PW: sopal</span>
            </div>
          </button>
        </div>
      </div>

    </div>

    <!-- Corporate copyright footer -->
    <p class="text-[10px] text-slate-400 text-center mt-6 tracking-wide font-mono">
      © 2026 | Division Transformation Digitale & Qualité
    </p>
  </div>
</template>
