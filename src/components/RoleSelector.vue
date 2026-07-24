<script setup lang="ts">
import { ShieldCheck, ClipboardPen, BarChart3, Wrench, Truck, Boxes, Users, ShieldAlert } from 'lucide-vue-next';
import { ERPRole, ROLE_LABELS } from '../types';

interface RoleSelectorProps {
  activeRole: ERPRole;
}

const props = defineProps<RoleSelectorProps>();
const emit = defineEmits<{
  (e: 'changeRole', role: ERPRole): void;
}>();

const ROLE_ICONS = {
  [ERPRole.OPERATEUR]: ClipboardPen,
  [ERPRole.ADMINISTRATEUR]: ShieldAlert,
  [ERPRole.RESP_PROCESS]: BarChart3,
  [ERPRole.RESP_RETOUCHE]: Wrench,
  [ERPRole.RESP_LOGISTIQUE]: Truck,
  [ERPRole.MAGASINIER]: Boxes,
};

const rolesList = Object.values(ERPRole);
</script>

<template>
  <div id="role-simulator-banner" class="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border-b border-slate-200 p-4">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Banner Title -->
      <div class="flex items-center gap-2.5">
        <div class="bg-blue-100 p-2 rounded-xl border border-blue-200">
          <Users class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 class="text-sm font-extrabold text-blue-900 tracking-wide flex items-center gap-1.5 uppercase font-mono">
            Simulateur de Profils ERP SOPAL
          </h1>
          <p class="text-[11px] text-slate-500 font-medium">
            Basculez entre les rôles pour tester les actions et notifications associées à chaque poste.
          </p>
        </div>
      </div>

      <!-- Selected Role Tagline -->
      <div class="hidden lg:flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-sm">
        <ShieldCheck class="w-4 h-4 text-emerald-500" />
        <span class="text-slate-500 font-semibold">
          Profil actif : <strong class="text-slate-800">{{ ROLE_LABELS[props.activeRole].title }}</strong>
        </span>
      </div>
    </div>

    <!-- Selector Grid -->
    <div class="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
      <button
        v-for="role in rolesList"
        :key="role"
        type="button"
        @click="emit('changeRole', role)"
        class="p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer h-[76px]"
        :class="props.activeRole === role
          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'"
      >
        <div class="flex items-center justify-between w-full">
          <component 
            :is="ROLE_ICONS[role]" 
            class="w-4 h-4" 
            :class="props.activeRole === role ? 'text-white' : 'text-blue-600'" 
          />
          <span v-if="props.activeRole === role" class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div>
          <span class="text-[10.5px] font-bold block truncate leading-tight">
            {{ ROLE_LABELS[role].title }}
          </span>
          <span 
            class="text-[8.5px] block truncate mt-0.5" 
            :class="props.activeRole === role ? 'text-blue-100' : 'text-slate-400'"
          >
            {{ ROLE_LABELS[role].desc }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
