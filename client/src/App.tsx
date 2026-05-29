import { useState, useEffect, useRef } from "react";
import type { User } from "./types";
import LoginModal from "./components/LoginModal";
import BreathingPage from "./components/BreathingPage";
import "./App.css";
import oceanWaves from "./assets/ocean-waves.mp3";
import WaveForm from "./components/WaveForm";
import StressRating from './components/StressRating';
import Dashboard from './components/Dashboard';

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

  const [stressBefore, setStressBefore] = useState<number | null>(null)
  const [stressAfter, setStressAfter] = useState<number | null>(null)
  const [isStressBeforeOpen, setIsStressBeforeOpen] = useState(false)
  const [isStressAfterOpen, setIsStressAfterOpen] = useState(false)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)

  async function saveSession(before: number, after: number) {
    try {
      //update the database with the stress level b4 and after (inputted by the user on UI)
      await fetch('/sessions', {
        method: 'POST',
        //tells the browser to send the session cookie with the request - the server needs to know who the user is 
        credentials: 'include',
        //tells the server the data being sent is JSON format
        headers: {"Content-Type": 'application/json'},
        //the actual stress rating data being written to the database through the backend 
        //converted to JSON so the server can read it 
        body: JSON.stringify({ stress_lvl_before: before, stress_lvl_after: after})
      })
    } catch (err){
      console.log("Failed to save session", err)
    }
  }


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
        <>
        <button
          className="audio-toggle"
          type="button"
          onClick={handleAudioToggle}
          aria-label={isAudioEnabled ? "Turn audio off" : "Turn audio on"}
        >
          {isAudioEnabled ? "♪" : "×"}
        </button>

        <button
          className="dashboard-toggle"
          type="button"
          onClick={()=>{setIsDashboardOpen(prev => !prev)}}
        >
          🪸
        </button>

        <button
          className="stress-before"
          type="button"
          onClick={() => {setIsStressBeforeOpen(prev => !prev)}}
        >
          ☁️
        </button>

        <button
          className="stress-after"
          type="button"
          onClick={() => {setIsStressAfterOpen(prev => !prev)}}
        >
          🦋
        </button>

        {isStressBeforeOpen && (
          <StressRating 
            label="How stressed are you? (1-10)"
            onRate={(rating) => {
              setStressBefore(rating)
              setIsStressBeforeOpen(false)
              if (stressAfter) saveSession(rating, stressAfter)
            }}
          />
        )}
        
        {isStressAfterOpen && (
          <StressRating
            label='How do you feel now? (1-10)'
            onRate={(rating) => {
              setStressAfter(rating)
              setIsStressAfterOpen(false)
              if(stressBefore) saveSession(stressBefore, rating)
            }}
          />
        )}

        {isDashboardOpen && (
          <Dashboard
            user={user}
            onClose={() => setIsDashboardOpen(false)}
          />
        )}

        </>
      )}

      {!user && <LoginModal onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}

export default App;
