import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createRoutine, updateRoutine, completeSession } from '../api/client';

interface PendingAction {
  id: string;
  type: 'CREATE_ROUTINE' | 'COMPLETE_SESSION';
  data: any;
  timestamp: number;
}

interface SyncState {
  isOffline: boolean;
  pendingActions: PendingAction[];
  setIsOffline: (status: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, 'timestamp'>) => void;
  removePendingAction: (id: string) => void;
  syncPendingActions: () => Promise<void>;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOffline: !navigator.onLine,
      pendingActions: [],
      setIsOffline: (status) => set({ isOffline: status }),
      addPendingAction: (action) => set((state) => ({
        pendingActions: [...state.pendingActions, { ...action, timestamp: Date.now() }]
      })),
      removePendingAction: (id) => set((state) => ({
        pendingActions: state.pendingActions.filter(a => a.id !== id)
      })),
      syncPendingActions: async () => {
        const { pendingActions, removePendingAction } = get();
        if (pendingActions.length === 0) return;

        console.log(`[Sync] Attempting to sync ${pendingActions.length} actions...`);
        
        for (const action of pendingActions) {
          try {
            if (action.type === 'CREATE_ROUTINE') {
              const routineId = action.data.id;
              if (routineId && !routineId.toString().startsWith('temp-')) {
                await updateRoutine(routineId, action.data);
              } else {
                const { id, ...dataWithoutId } = action.data;
                await createRoutine(dataWithoutId);
              }
            } else if (action.type === 'COMPLETE_SESSION') {
              const { sessionId, sessionData } = action.data;
              if (sessionId.startsWith('temp-')) {
                // If the session was started offline, we just complete it with the data
                // The backend completeSession might need adjustment to handle new sessions
                // or we can just send it as a complete record.
                await completeSession('new', { ...sessionData, user_id: sessionData.user_id });
              } else {
                await completeSession(sessionId, sessionData);
              }
            }
            removePendingAction(action.id);
            console.log(`[Sync] Action ${action.id} synced successfully.`);
          } catch (error) {
            console.error(`[Sync] Failed to sync action ${action.id}:`, error);
            // We keep it in the queue for next attempt
          }
        }
      }
    }),
    {
      name: 'fitatlas-sync',
    }
  )
);
