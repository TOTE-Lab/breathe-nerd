import { useState, useEffect, useRef } from "react";
import type { User } from "./types";
import LoginModal from "./components/LoginModal";
import BreathingPage from "./components/BreathingPage";
import "./App.css";
import oceanWaves from "./assets/ocean-waves.mp3";
import WaveForm from "./components/WaveForm";

/*
  Responsibilities:
  - Verify auth session on app load
  - Store authenticated user state
  - Render login flow vs authenticated app
  - Handle logout

  Flow:
  App → passes auth callbacks to child components
  Child → reports successful login back to App
*/

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function startAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio(oceanWaves);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    audioRef.current.play().catch((error) => {
      console.error("Audio failed to play:", error);
    });
  }

  function stopAudio() {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  function handleAudioToggle() {
    if (isAudioEnabled) {
      stopAudio();
      setIsAudioEnabled(false);
      return;
    }

    setIsAudioEnabled(true);

    if (user) {
      startAudio();
    }
  }

  function handleLoginSuccess(user: User) {
    setUser(user);
    if (isAudioEnabled) {
      startAudio();
    }
  }

  useEffect(() => {
    async function authCheck() {
      try {
        const res = await fetch("/auth/verify", {
          method: "GET",
          // credentials required so session cookie is sent with the request
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setLoading(false);
      }
    }
    authCheck();
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }
      // clear user state client-side after server session is destroyed
      stopAudio();
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  }

  // prevent app render until auth check completes
  if (loading) {
    return <p>npm installing calm...</p>;
    //make separate loading page component and pass function into here and style it with css
  }

  //BreathingPAge is always visible
  //LoginModal appears on top when user is logged out
  return (
    <div style={{ position: "relative" }}>
      <WaveForm />
      <BreathingPage
        key={user ? "authenticated" : "logged-out"}
        user={user}
        onLogout={handleLogout}
        isBlurred={!user}
      />

      {user && (
        <button
          className="audio-toggle"
          type="button"
          onClick={handleAudioToggle}
          aria-label={isAudioEnabled ? "Turn audio off" : "Turn audio on"}
        >
          {isAudioEnabled ? "♪" : "×"}
        </button>
      )}

      {!user && <LoginModal onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}

export default App;
