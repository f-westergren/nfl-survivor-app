import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

interface Profile {
  email: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const docRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as Profile);
        }
      }
    };
    fetchProfile();
  }, [user]);

  console.log("herere");

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      {profile ? (
        <div>
          <p>Email: {profile.email}</p>
          <p>Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
      <button onClick={logout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
}
