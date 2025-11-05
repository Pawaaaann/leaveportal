import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@shared/schema";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  isAdmin: boolean;
  isBackendAuth: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBackendAuth, setIsBackendAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  async function login(email: string, password: string, role: string) {
    // Validate role
    const validRoles = ["Student", "Mentor", "HOD", "Principal", "Warden", "Admin"];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role selected");
    }

    // Check for admin credentials first
    if (email === "admin" && password === "admin1234" && role === "Admin") {
      // Set admin user data
      const adminUser: User = {
        id: "admin",
        name: "System Administrator",
        email: "admin",
        password: "admin1234",
        role: "Admin",
        dept: null,
        year: null,
        hostel_status: null,
        profile_pic_url: null,
        mentor_id: null,
        register_number: null,
      };
      
      setUserData(adminUser);
      setIsAdmin(true);
      setIsBackendAuth(false);
      setCurrentUser(null); // Admin doesn't use Firebase
      return;
    }
    
    // For non-admin roles, prevent admin credentials usage
    if (email === "admin" && password === "admin1234" && role !== "Admin") {
      throw new Error("Admin credentials can only be used with Admin role");
    }
    
    // For non-admin users, authenticate with backend storage
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const { user } = await response.json();
      setIsAdmin(false);
      setIsBackendAuth(true);
      setCurrentUser({ uid: user.id } as FirebaseUser); // Mock Firebase user
      setUserData(user);
      
      // Store session in localStorage for persistence
      localStorage.setItem('backendAuth', JSON.stringify({
        user,
        timestamp: Date.now()
      }));
    } catch (error: any) {
      throw new Error(error.message || "Invalid email or password");
    }
  }

  async function register(email: string, password: string, userData: Partial<User>) {
    if (!auth || !db) {
      throw new Error("Firebase is not configured. Please set up Firebase environment variables.");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email: user.email!,
      ...userData,
      createdAt: new Date().toISOString(),
    });
  }

  async function logout() {
    if (isAdmin) {
      // Admin logout - just clear state
      setIsAdmin(false);
      setUserData(null);
      setCurrentUser(null);
    } else if (isBackendAuth) {
      // Backend auth logout - clear state and localStorage
      setIsBackendAuth(false);
      setUserData(null);
      setCurrentUser(null);
      localStorage.removeItem('backendAuth');
    } else {
      // Firebase logout for regular users
      if (auth) {
        await signOut(auth);
      }
    }
  }

  useEffect(() => {
    // Check for existing backend auth session on load
    const checkBackendAuth = () => {
      const storedAuth = localStorage.getItem('backendAuth');
      if (storedAuth) {
        try {
          const { user, timestamp } = JSON.parse(storedAuth);
          // Check if session is still valid (24 hours)
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setIsBackendAuth(true);
            setCurrentUser({ uid: user.id } as FirebaseUser);
            setUserData(user);
            setLoading(false);
            return true;
          } else {
            localStorage.removeItem('backendAuth');
          }
        } catch (error) {
          localStorage.removeItem('backendAuth');
        }
      }
      return false;
    };

    if (checkBackendAuth()) {
      return;
    }

    if (!auth || !db) {
      // Firebase not configured, skip Firebase auth state listener
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Don't override admin or backend auth state with Firebase state changes
      if (isAdmin || isBackendAuth) {
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      if (user && db) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin, isBackendAuth]);

  const value = {
    currentUser,
    userData,
    isAdmin,
    isBackendAuth,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
