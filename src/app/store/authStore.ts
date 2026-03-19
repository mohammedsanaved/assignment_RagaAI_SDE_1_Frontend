import { create } from 'zustand';
import { auth, db, handleFirestoreError, OperationType } from '@/src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthUser } from '@/src/types';

interface AuthState {
  user: AuthUser | null;
  isAuthReady: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  clearError: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    isAuthReady: false,
    error: null,
    setUser: (user) => set({ user }),
    setAuthReady: (ready) => set({ isAuthReady: ready }),
    clearError: () => set({ error: null }),
    logout: async () => {
      await auth.signOut();
      set({ user: null });
    },
  })
);

// Initialize Auth Listener
export const initAuth = () => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    const { setUser, setAuthReady } = useAuthStore.getState();
    
    if (firebaseUser) {
      // Get user role from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: userData.role || 'staff',
          organizationId: userData.organizationId || 'org_default',
        });
      } else {
        // Create new user doc if it doesn't exist
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: 'staff',
          organizationId: 'org_default',
          createdAt: serverTimestamp(),
        };
        try {
          await setDoc(userDocRef, newUser);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'staff',
            organizationId: 'org_default',
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users');
        }
      }
    } else {
      setUser(null);
    }
    setAuthReady(true);
  });
};
