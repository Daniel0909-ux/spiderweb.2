// src/pages/LoginPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { User, Lock, Loader2, ArrowRight } from "lucide-react";

// Import the Redux actions and selectors from your auth slice
import {
  loginUser,
  selectAuthStatus,
  selectAuthError,
  selectAuthToken,
} from "../redux/slices/authSlice";

// particlesConfig object remains the same...
const particlesConfig = {
  background: {
    color: {
      value: "#0d1117",
    },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse",
      },
      resize: true,
    },
    modes: {
      repulse: {
        distance: 80,
        duration: 0.4,
      },
    },
  },
  particles: {
    color: {
      value: "#3a7bd5",
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.1,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "bounce",
      },
      random: false,
      speed: 1,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 80,
    },
    opacity: {
      value: 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 3 },
    },
  },
  detectRetina: true,
};

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const authToken = useSelector(selectAuthToken);

  const isLoading = authStatus === "loading";

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    if (authToken) {
      navigate("/", { replace: true });
    }
  }, [authToken, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password || isLoading) {
      return;
    }
    dispatch(loginUser({ username, password }));
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-950 overflow-hidden">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesConfig}
        className="absolute inset-0 z-0"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-2xl transition-all duration-300">
          <div className="p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-wide">
                SPIDERWEB
              </h1>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Created by
                </p>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mt-1">
                  LIFeStyle
                </h2>
              </div>
            </div>

            {/* --- THIS IS THE FIX --- */}
            {/* Add the data-loading attribute to the form */}
            <form onSubmit={handleLogin} data-loading={isLoading} noValidate>
              <div className="mb-4 relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="User G"
                  // The disabled class from Tailwind will still apply visual styles (like opacity)
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-colors disabled:opacity-70"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="mb-6 relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/70 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-colors disabled:opacity-70"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {authStatus === "failed" && authError && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 text-center mb-6">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                // The disabled class from Tailwind will handle the opacity change
                className="w-full font-bold py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400 transition-all duration-300 ease-in-out flex items-center justify-center group disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
