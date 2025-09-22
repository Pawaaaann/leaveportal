import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@shared/schema";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  isAdmin: boolean;
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
      };
      
      setUserData(adminUser);
      setIsAdmin(true);
      setCurrentUser(null); // Admin doesn't use Firebase
      return;
    }
    
    // For non-admin roles, prevent admin credentials usage
    if (email === "admin" && password === "admin1234" && role !== "Admin") {
      throw new Error("Admin credentials can only be used with Admin role");
    }
    
    // For non-admin users, check if user exists in backend storage
    try {
      const response = await fetch('/api/users/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'User validation failed');
      }
      
      // Attempt Firebase authentication
      setIsAdmin(false);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If it's a Firebase auth error, show appropriate message
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Invalid email or password");
      }
      throw error;
    }
  }

  async function register(email: string, password: string, userData: Partial<User>) {
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
    } else {
      // Firebase logout for regular users
      await signOut(auth);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Don't override admin state with Firebase state changes
      if (isAdmin) {
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      if (user) {
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
  }, [isAdmin]);

  const value = {
    currentUser,
    userData,
    isAdmin,
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
