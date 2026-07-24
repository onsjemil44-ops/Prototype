<script setup lang="ts">
import { ref, computed } from 'vue';
import { Mail, Inbox, Clock, Eye, X } from 'lucide-vue-next';
import { SimulatedEmail } from '../types';

interface NotificationLogProps {
  emails: SimulatedEmail[];
}

const props = defineProps<NotificationLogProps>();

const selectedEmail = ref<SimulatedEmail | null>(null);

const unreadEmails = computed(() => props.emails.filter(e => !e.isRead).length);

function selectEmail(email: SimulatedEmail) {
  selectedEmail.value = email;
}

function clearSelectedEmail() {
  selectedEmail.value = null;
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full flex-1 min-h-[400px]">
    <!-- Header -->
    <div class="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2 rounded-t-2xl">
      <Mail class="w-5 h-5 text-blue-600" />
      <h3 class="font-black text-slate-800 text-sm tracking-wide uppercase">Boîte de réception ({{ props.emails.length }})</h3>
      <span 
        v-if="unreadEmails > 0" 
        class="bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse"
      >
        {{ unreadEmails }} Nouveaux
      </span>
    </div>

    <!-- Emails List Screen -->
    <div class="flex-1 overflow-y-auto bg-white">
      <div v-if="props.emails.length === 0" class="flex flex-col items-center justify-center text-center p-8 h-full min-h-[300px]">
        <Inbox class="w-12 h-12 text-slate-300 mb-2" />
        <span class="text-sm text-slate-400 font-medium">Aucun e-mail émis.</span>
        <p class="text-xs text-slate-400 max-w-xs mt-2">
          Les notifications SMTP automatiques apparaîtront ici.
        </p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="email in props.emails"
          :key="email.id"
          @click="selectEmail(email)"
          class="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start group"
        >
          <div class="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0">
            <Mail class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="font-bold text-slate-800 text-sm truncate">{{ email.subject }}</span>
              <span class="text-[10px] text-slate-400 font-mono shrink-0">{{ email.date.split(' ')[1] }}</span>
            </div>
            <p class="text-slate-500 font-mono text-xs truncate mb-1">
              À: {{ email.recipients[0] }} <span v-if="email.recipients.length > 1">...</span>
            </p>
            <p class="text-slate-400 truncate text-xs italic">
              {{ email.body.substring(0, 60) }}...
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Screen Email Modal -->
    <div v-if="selectedEmail" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Mail class="w-5 h-5" />
            </div>
            <h2 class="text-lg font-black text-slate-800">Détail de l'e-mail</h2>
          </div>
          <button @click="clearSelectedEmail" class="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto flex-1">
          <div class="space-y-4">
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-2">
              <div class="flex">
                <span class="w-16 font-bold text-slate-400 font-mono">De :</span> 
                <span class="font-medium text-slate-700">{{ selectedEmail.sender }}</span>
              </div>
              <div class="flex">
                <span class="w-16 font-bold text-slate-400 font-mono">À :</span> 
                <span class="font-medium text-slate-700">{{ selectedEmail.recipients.join(', ') }}</span>
              </div>
              <div class="flex">
                <span class="w-16 font-bold text-slate-400 font-mono">Date :</span> 
                <span class="font-medium text-slate-700 flex items-center gap-1"><Clock class="w-4 h-4 text-slate-400" /> {{ selectedEmail.date }}</span>
              </div>
              <div class="flex border-t border-slate-200/60 pt-2 mt-2">
                <span class="w-16 font-bold text-slate-400 font-mono">Sujet :</span> 
                <span class="font-bold text-slate-900">{{ selectedEmail.subject }}</span>
              </div>
            </div>

            <div class="text-sm text-slate-700 font-sans p-5 border border-slate-100 rounded-xl bg-white whitespace-pre-line leading-relaxed shadow-inner min-h-[250px]">
              {{ selectedEmail.body }}
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button @click="clearSelectedEmail" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors text-sm">
            Fermer l'e-mail
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

