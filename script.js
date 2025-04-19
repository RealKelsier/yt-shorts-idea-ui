const supabase = Supabase.createClient('https://fiynqzojbuptnszykrke.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeW5xem9qYnVwdG5zenlrcmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTMxODksImV4cCI6MjA2MDY2OTE4OX0.wJf9fVDAWhDk5EJnBsJ5ydZ0a0K6902zv4lfxmXSc0g');

let user = null;

// Check if user is logged in on page load
window.onload = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user ?? null;
  updateAuthUI();
  if (user) {
    loadSavedIdeas();
  }
};

// Sign in with email (magic link)
async function signIn() {
  const email = document.getElementById('email').value.trim();
  if (!email) {
    alert('Please enter your email.');
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    alert('Error sending magic link: ' + error.message);
  } else {
    alert('Magic link sent! Check your email to log in.');
  }
}

// Sign out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Error signing out: ' + error.message);
  } else {
    user = null;
    updateAuthUI();
    document.getElementById('savedIdeasSection').classList.add('hidden');
    document.getElementById('savedIdeasList').innerHTML = '';
  }
}

// Update UI based on auth state
function updateAuthUI() {
  const authSection = document.getElementById('authSection');
  const signOutBtn = document.getElementById('signOutBtn');
  const emailInput = document.getElementById('email');

  if (user) {
    authSection.innerHTML = `<p class="mb-2">Logged in as: ${user.email}</p>`;
    signOutBtn.classList.remove('hidden');
    emailInput.classList.add('hidden');
  } else {
    authSection.innerHTML = `
      <h2 class="text-lg font-semibold mb-2">Log In / Sign Up</h2>
      <input type="email" id="email" placeholder="Enter your email" class="w-full px-4 py-2 mb-4 bg-gray-700 rounded-xl text-white" />
      <button onclick="signIn()" class="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700">Log In / Sign Up</button>
    `;
    signOutBtn.classList.add('hidden');
  }
}

// Generate ideas
async function generateIdeas() {
  const channelUrl = document.getElementById('channelUrl').value.trim();
  const ideaList = document.getElementById('ideaList');
  const results = document.getElementById('results');

  if (!channelUrl) {
    alert('Please paste a YouTube channel link.');
    return;
  }

  results.classList.remove('hidden');
  ideaList.innerHTML = '<li>Loading...</li>';

  try {
    const response = await fetch('https://shortsgenix.onrender.com/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: channelUrl }),
    });

    const data = await response.json();
    if (data.error) {
      ideaList.innerHTML = `<li class="text-red-400">${data.error}</li>`;
      return;
    }

    ideaList.innerHTML = data.ideas
      .map(
        (idea, index) => `
          <li class="p-4 bg-gray-700 rounded-xl">
            <strong>${idea.title}</strong><br />
            Virality Score: <span class="font-bold">${idea.score}/10</span>
            ${user ? `<br /><button onclick="saveIdea('${idea.title}', ${idea.score})" class="mt-2 bg-green-600 text-white px-4 py-1 rounded-xl hover:bg-green-700">Save Idea</button>` : ''}
          </li>
        `
      )
      .join('');
  } catch (error) {
    ideaList.innerHTML = '<li class="text-red-400">Error: Could not generate ideas. Try again!</li>';
  }
}

// Save an idea to Supabase
async function saveIdea(title, score) {
  if (!user) {
    alert('Please log in to save ideas.');
    return;
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert([{ user_id: user.id, title, score }]);

  if (error) {
    alert('Error saving idea: ' + error.message);
  } else {
    alert('Idea saved!');
    loadSavedIdeas();
  }
}

// Load saved ideas from Supabase
async function loadSavedIdeas() {
  if (!user) return;

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id);

  const savedIdeasList = document.getElementById('savedIdeasList');
  const savedIdeasSection = document.getElementById('savedIdeasSection');

  if (error) {
    savedIdeasList.innerHTML = '<li class="text-red-400">Error loading saved ideas.</li>';
    return;
  }

  if (data.length > 0) {
    savedIdeasSection.classList.remove('hidden');
    savedIdeasList.innerHTML = data
      .map(
        (idea) => `
          <li class="p-4 bg-gray-700 rounded-xl">
            <strong>${idea.title}</strong><br />
            Virality Score: <span class="font-bold">${idea.score}/10</span>
          </li>
        `
      )
      .join('');
  } else {
    savedIdeasSection.classList.add('hidden');
  }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  user = session?.user ?? null;
  updateAuthUI();
  if (user) {
    loadSavedIdeas();
  }
});
