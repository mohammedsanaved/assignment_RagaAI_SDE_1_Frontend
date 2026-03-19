import { create } from 'zustand';
import { Activity } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, Timestamp, limit } from 'firebase/firestore';

interface ActivityState {
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'time'>) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  setActivities: (activities) => set({ activities }),
  addActivity: async (activityData) => {
    const path = 'activities';
    try {
      await addDoc(collection(db, path), {
        ...activityData,
        time: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
}));

export function initActivityListener() {
  const path = 'activities';
  const q = query(collection(db, path), orderBy('time', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        time: data.time instanceof Timestamp ? data.time.toDate().toISOString() : data.time,
      } as Activity;
    });
    useActivityStore.getState().setActivities(activities);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}
