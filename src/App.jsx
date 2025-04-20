import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Main App Component
const App = () => {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [channelUrl, setChannelUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for user session on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error.message);
          return;
        }
        setUser(user);
        if (user) {
          fetchSavedIdeas(user.id);
        }
      } catch (error) {
        console.error('Unexpected error in getUser:', error.message);
      }
    };
    getUser();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchSavedIdeas(session.user.id);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Handle login/signup with magic link
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase client not initialized. Check configuration.');
      return;
    }
    if (!email) {
      alert('Please enter an email address.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }
      alert('Check your email for the magic link!');
    } catch (error) {
      alert('Error logging in: ' + error.message);
    }
  };

  // Fetch saved ideas from Supabase
  const fetchSavedIdeas = async (userId) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId);
      if (error) {
        console.error('Error fetching saved ideas:', error.message);
      } else {
        setSavedIdeas(data || []);
      }
    } catch (error) {
      console.error('Unexpected error in fetchSavedIdeas:', error.message);
    }
  };

  // Validate YouTube URL
  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^https:\/\/(www\.)?youtube\.com\/@[\w-]+$/;
    if (!url) {
      return 'Please enter a YouTube channel URL.';
    }
    if (!youtubeRegex.test(url)) {
      return 'Invalid YouTube channel URL. It should look like https://www.youtube.com/@channel';
    }
    return '';
  };

  // Handle generating ideas with validation
  const generateIdeas = async () => {
    const validationError = validateYouTubeUrl(channelUrl);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    setUrlError('');
    setIsLoading(true);
    try {
      const response = await fetch('https://shortsgenix.onrender.com/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channelUrl }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setIdeas(data.ideas || []);
    } catch (error) {
      setIdeas([]);
      alert('Error generating ideas: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving an idea
  const saveIdea = async (idea) => {
    if (!user) {
      alert('Please log in to save ideas!');
      return;
    }
    if (!supabase) {
      alert('Supabase client not initialized. Check configuration.');
      return;
    }
    const { error } = await supabase
      .from('ideas')
      .insert([{ user_id: user.id, title: idea.title, score: idea.score }]);
    if (error) {
      alert('Error saving idea: ' + error.message);
    } else {
      alert('Idea saved!');
      fetchSavedIdeas(user.id);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!supabase) {
      alert('Supabase client not initialized. Check configuration.');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSavedIdeas([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#1a2a44] font-sans">
      <div className="w-full max-w-md bg-[#2d3b55] rounded-lg p-8">
        {/* Main Title */}
        <h1 className="text-2xl font-bold text-white mb-6">
          YT Shorts Idea Generator
        </h1>

        {/* Log In / Sign Up Section */}
        {!user ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Log In / Sign Up</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 bg-[#3e4b66] text-white rounded-lg focus:outline-none border border-[#4a5872] mb-3"
            />
            <button
              onClick={handleLogin}
              className="w-full p-3 bg-[#28a745] text-white rounded-lg"
            >
              Log In / Sign Up
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-white">Logged in as: <span className="font-semibold">{user.email}</span></p>
            <button
              onClick={handleLogout}
              className="mt-2 p-2 bg-red-600 text-white rounded-lg"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Generate Ideas Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">YouTube Channel Link:</h3>
          <input
            type="text"
            value={channelUrl}
            onChange={(e) => {
              setChannelUrl(e.target.value);
              setUrlError('');
            }}
            placeholder="e.g., https://youtube.com/@channel"
            className="w-full p-3 bg-[#3e4b66] text-white rounded-lg focus:outline-none border border-[#4a5872] mb-3"
          />
          {urlError && (
            <p className="text-red-400 text-sm mb-2">{urlError}</p>
          )}
          <button
            onClick={generateIdeas}
            disabled={isLoading}
            className={`w-full p-3 bg-[#007bff] text-white rounded-lg ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Generating...' : 'Generate Ideas'}
          </button>
        </div>

        {/* Display Generated Ideas */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Suggested Shorts Ideas:</h3>
          {ideas.length > 0 ? (
            <ul className="space-y-3">
              {ideas.map((idea, index) => (
                <li
                  key={index}
                  className="p-3 bg-[#3e4b66] rounded-lg flex justify-between items-center border border-[#4a5872]"
                >
                  <span className="text-white">
                    {idea.title} (Virality Score: <span className="font-semibold">{idea.score}/10</span>)
                  </span>
                  <button
                    onClick={() => saveIdea(idea)}
                    className="p-2 bg-[#28a745] text-white rounded-lg"
                  >
                    Save Idea
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-400">
              No ideas generated yet. Enter a channel URL and click "Generate Ideas".
            </p>
          )}
        </div>

        {/* Display Saved Ideas */}
        {user && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Saved Ideas:</h3>
            {savedIdeas.length > 0 ? (
              <ul className="space-y-3">
                {savedIdeas.map((idea, index) => (
                  <li
                    key={index}
                    className="p-3 bg-[#3e4b66] rounded-lg text-white border border-[#4a5872]"
                  >
                    {idea.title} (Virality Score: <span className="font-semibold">{idea.score}/10</span>)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No saved ideas yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
