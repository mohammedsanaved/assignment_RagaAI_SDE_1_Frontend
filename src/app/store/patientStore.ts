import { create } from 'zustand';
import { Patient, MedicalHistory, ClinicalNote } from '@/src/types';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  Timestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  limit, 
  startAfter, 
  getDocs,
  where,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';

export interface Vital {
  id: string;
  type: 'Heart Rate' | 'Blood Pressure' | 'Temperature' | 'Oxygen Level';
  value: string;
  unit: string;
  timestamp: string;
}

const PAGE_SIZE = 25;

interface PatientState {
  patients: Patient[];
  vitals: Record<string, Vital[]>;
  medicalHistory: Record<string, MedicalHistory[]>;
  clinicalNotes: Record<string, ClinicalNote[]>;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  error: string | null;
  setPatients: (patients: Patient[]) => void;
  setVitals: (patientId: string, vitals: Vital[]) => void;
  setMedicalHistory: (patientId: string, history: MedicalHistory[]) => void;
  setClinicalNotes: (patientId: string, notes: ClinicalNote[]) => void;
  toggleViewMode: () => void;
  addPatient: (patient: Omit<Patient, 'id' | 'lastVisit' | 'organizationId'>) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Omit<Patient, 'id'>>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addVital: (patientId: string, vital: Omit<Vital, 'id' | 'timestamp'>) => Promise<void>;
  addMedicalHistory: (patientId: string, history: Omit<MedicalHistory, 'id'>) => Promise<void>;
  addClinicalNote: (patientId: string, note: Omit<ClinicalNote, 'id' | 'timestamp' | 'date'>) => Promise<void>;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  vitals: {},
  medicalHistory: {},
  clinicalNotes: {},
  viewMode: 'grid',
  isLoading: true,
  lastVisible: null,
  hasMore: true,
  error: null,
  setPatients: (patients) => set({ patients, isLoading: false }),
  setVitals: (patientId, vitals) => set((state) => ({ 
    vitals: { ...state.vitals, [patientId]: vitals } 
  })),
  setMedicalHistory: (patientId, history) => set((state) => ({
    medicalHistory: { ...state.medicalHistory, [patientId]: history }
  })),
  setClinicalNotes: (patientId, notes) => set((state) => ({
    clinicalNotes: { ...state.clinicalNotes, [patientId]: notes }
  })),
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'grid' ? 'list' : 'grid' })),
  clearError: () => set({ error: null }),
  addPatient: async (patientData) => {
    const path = 'patients';
    const { user } = useAuthStore.getState();
    if (!user?.organizationId) {
      set({ error: 'User organization not found' });
      return;
    }
    
    try {
      await addDoc(collection(db, path), {
        ...patientData,
        createdBy: user.uid,
        organizationId: user.organizationId,
        lastVisit: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Log activity
      useActivityStore.getState().addActivity({
        type: 'New Patient',
        name: patientData.name,
        userId: user.uid,
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  updatePatient: async (id, patientData) => {
    const path = `patients/${id}`;
    try {
      await updateDoc(doc(db, 'patients', id), {
        ...patientData,
        lastVisit: serverTimestamp(),
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update patient' });
    }
  },
  deletePatient: async (id) => {
    const path = `patients/${id}`;
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete patient' });
    }
  },
  addVital: async (patientId, vitalData) => {
    const path = `patients/${patientId}/vitals`;
    try {
      await addDoc(collection(db, 'patients', patientId, 'vitals'), {
        ...vitalData,
        timestamp: serverTimestamp(),
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add vital' });
    }
  },
  addMedicalHistory: async (patientId, historyData) => {
    const path = `patients/${patientId}/medicalHistory`;
    try {
      await addDoc(collection(db, 'patients', patientId, 'medicalHistory'), {
        ...historyData,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add medical history' });
    }
  },
  addClinicalNote: async (patientId, noteData) => {
    const path = `patients/${patientId}/clinicalNotes`;
    try {
      await addDoc(collection(db, 'patients', patientId, 'clinicalNotes'), {
        ...noteData,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: serverTimestamp(),
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add clinical note' });
    }
  },
  loadMore: async () => {
    const { lastVisible, hasMore, patients } = get();
    const { user } = useAuthStore.getState();
    if (!hasMore || !user?.organizationId) return;

    set({ isLoading: true });
    const path = 'patients';
    try {
      const q = query(
        collection(db, path),
        where('organizationId', '==', user.organizationId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newPatients = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastVisit: data.lastVisit instanceof Timestamp ? data.lastVisit.toDate().toISOString() : data.lastVisit,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        } as Patient;
      });

      set({
        patients: [...patients, ...newPatients],
        lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === PAGE_SIZE,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load more patients', isLoading: false });
    }
  }
}));

// Initialize Firestore Listener
export function initPatientListener() {
  const { user } = useAuthStore.getState();
  if (!user?.organizationId) return () => {};

  const path = 'patients';
  const q = query(
    collection(db, path), 
    where('organizationId', '==', user.organizationId),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastVisit: data.lastVisit instanceof Timestamp ? data.lastVisit.toDate().toISOString() : data.lastVisit,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      } as Patient;
    });
    
    usePatientStore.setState({
      patients,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE,
      isLoading: false
    });
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export function initVitalsListener(patientId: string) {
  const path = `patients/${patientId}/vitals`;
  const q = query(collection(db, 'patients', patientId, 'vitals'), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const vitals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
      } as Vital;
    });
    usePatientStore.getState().setVitals(patientId, vitals);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export function initMedicalHistoryListener(patientId: string) {
  const path = `patients/${patientId}/medicalHistory`;
  const q = query(collection(db, 'patients', patientId, 'medicalHistory'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as MedicalHistory;
    });
    usePatientStore.getState().setMedicalHistory(patientId, history);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export function initClinicalNotesListener(patientId: string) {
  const path = `patients/${patientId}/clinicalNotes`;
  const q = query(collection(db, 'patients', patientId, 'clinicalNotes'), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
      } as ClinicalNote;
    });
    usePatientStore.getState().setClinicalNotes(patientId, notes);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}
