const { createClient } = window.Supabase || {};
const { createRoot } = window.ReactDOM || {};
const { motion } = window.framerMotion || {};

// Dependency check
if (!window.React || !window.ReactDOM || !window.framerMotion || !window.Supabase || !window.particlesJS) {
  console.error('One or more dependencies failed to load. Ensure all CDN scripts are loaded correctly.');
  document.body.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error: Failed to load dependencies. Please check your internet connection or refresh the page.</div>';
}

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'your-supabase-anon-key'; // Replace with your Supabase anon key

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing. Ensure supabaseUrl and supabaseAnonKey are set.');
}

const supabase = supabaseUrl && supabaseAnonKey && createClient ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Sound effects
const clickSound = new Audio('https://cdn.pixabay.com/audio/2022/03/09/audio_5e7e0a6d70.mp3'); // Click sound
const successSound = new Audio('https://cdn.pixabay.com/audio/2022/03/09/audio_1b6f3e3f1a.mp3'); // Success sound

// Initialize Particles.js
if (window.particlesJS) {
  particlesJS('particles-js', {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.3, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.2, width: 1 },
      move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
    },
    retina_detect: true
  });
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400 text-center p-6">
          <h2>Something went wrong while rendering the app.</h2>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <p>Please refresh the page or check the console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main App Component
const App = () => {
  const [email, setEmail] = React.useState('');
  const [user, setUser] = React.useState(null);
  const [ideas, setIdeas] = React.useState([]);
  const [savedIdeas, setSavedIdeas] = React.useState([]);
  const [channelUrl, setChannelUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Check for user session on mount
  React.useEffect(() => {
    const getUser = async () => {
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
    clickSound.play();
    if (!supabase) {
      alert('Supabase client not initialized. Check configuration.');
      return;
    }
    if (!email) {
      alert('Please enter an email address.');
      return;
    }
    try {
      console.log('Attempting to send magic link to:', email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('Login error:', error.message);
        throw error;
      }
      alert('Check your email for the magic link!');
    } catch (error) {
      alert('Error logging in: ' + error.message);
    }
  };

  // Fetch saved ideas from Supabase
  const fetchSavedIdeas = async (userId) => {
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
  };

  // Handle generating ideas
  const generateIdeas = async () => {
    clickSound.play();
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
      setIdeas(data.ideas);
      successSound.play();
    } catch (error) {
      setIdeas([]);
      alert('Error generating ideas: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving an idea
  const saveIdea = async (idea) => {
    clickSound.play();
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
    clickSound.play();
    if (!supabase) {
      alert('Supabase client not initialized. Check configuration.');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSavedIdeas([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-poppins">
      <div className="relative w-full max-w-lg bg-gray-800 bg-opacity-90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">
        {/* SHORT GENIX Branding with Glow Effect */}
        <div className="absolute top-4 left-4">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse shadow-lg">
            SHORT GENIX
          </h1>
        </div>

        {/* Main Title with Gradient Text */}
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-8">
          YT Shorts Idea Generator
        </h1>

        {/* Log In / Sign Up Section */}
        {!user ? (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Log In / Sign Up</h3>
            <div className="group relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 border border-gray-600 shadow-inner"
              />
              <span className="absolute hidden group-hover:block -top-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-sm rounded py-1 px-2">
                Enter your email to receive a magic link
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogin}
              className="w-full mt-4 p-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Log In / Sign Up
            </motion.button>
          </div>
        ) : (
          <div className="mb-8">
            <p className="text-gray-200">Logged in as: <span className="font-semibold">{user.email}</span></p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="mt-2 p-2 bg-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Sign Out
            </motion.button>
          </div>
        )}

        {/* Generate Ideas Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">YouTube Channel Link:</h3>
          <div className="group relative">
            <input
              type="text"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="Enter YouTube channel URL"
              className="w-full p-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 border border-gray-600 shadow-inner"
            />
            <span className="absolute hidden group-hover:block -top-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-sm rounded py-1 px-2">
              E.g., https://www.youtube.com/@channel
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateIdeas}
            disabled={isLoading}
            className={`w-full mt-4 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Generating...' : 'Generate Ideas'}
          </motion.button>
          {isLoading && (
            <div className="flex justify-center mt-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-8 h-8 border-4 border-t-4 border-purple-500 border-solid rounded-full"
              />
            </div>
          )}
        </div>

        {/* Display Generated Ideas */}
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Suggested Shorts Ideas:</h3>
          {ideas.length > 0 ? (
            <ul className="space-y-4">
              {ideas.map((idea, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-700 bg-opacity-50 rounded-lg flex justify-between items-center hover:bg-opacity-70 transition-all duration-300 border border-gray-600 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]"
                >
                  <span className="text-white">
                    {idea.title} (Virality Score: <span className="font-semibold">{idea.score}/10</span>)
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => saveIdea(idea)}
                    className="p-2 bg-teal-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Save Idea
                  </motion.button>
                </motion.li>
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
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Saved Ideas:</h3>
            {savedIdeas.length > 0 ? (
              <ul className="space-y-4">
                {savedIdeas.map((idea, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-700 bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-all duration-300 border border-gray-600 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]"
                  >
                    {idea.title} (Virality Score: <span className="font-semibold">{idea.score}/10</span>)
                  </motion.li>
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

// Render the app with error boundary
if (createRoot && document.getElementById('root')) {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  console.error('Failed to initialize app: createRoot or root element not found.');
  document.body.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error: Failed to initialize app. Please check the console for details.</div>';
}
