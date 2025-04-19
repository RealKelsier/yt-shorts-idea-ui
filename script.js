// Initialize Supabase
const supabase = Supabase.createClient('https://fiynqzojbuptnszykrke.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeW5xem9qYnVwdG5zenlrcmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTMxODksImV4cCI6MjA2MDY2OTE4OX0.wJf9fVDAWhDk5EJnBsJ5ydZ0a0K6902zv4lfxmXSc0g');

// Check if user is logged in on page load
window.onload = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-email').textContent = session.user.email;
    loadSavedIdeas();
  } else {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
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
    alert('Check your email for a magic link to log in!');
  }
}

// Sign out
async function signOut() {
  await supabase.auth.signOut();
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('user-info').classList.add('hidden');
  document.getElementById('saved-ideas').classList.add('hidden');
}

// Load saved ideas
async function loadSavedIdeas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('saved_ideas')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error loading saved ideas:', error);
    return;
  }

  const savedIdeaList = document.getElementById('saved-idea-list');
  document.getElementById('saved-ideas').classList.remove('hidden');
  if (data.length === 0) {
    savedIdeaList.innerHTML = '<li class="text-gray-400">No saved ideas yet.</li>';
    return;
  }

  savedIdeaList.innerHTML = data
    .map(
      (idea) => `
        <li class="p-4 bg-gray-700 rounded-xl">
          <strong>${idea.idea_title}</strong><br />
          Channel: ${idea.channel_url}<br />
          Virality Score: <span class="font-bold">${idea.virality_score}/10</span>
        </li>
      `
    )
    .join('');
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
        (idea) => `
          <li class="p-4 bg-gray-700 rounded-xl">
            <strong>${idea.title}</strong><br />
            Virality Score: <span class="font-bold">${idea.score}/10</span><br />
            <button onclick="saveIdea('${channelUrl}', '${idea.title}', ${idea.score})" class="mt-2 bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700">Save Idea</button>
          </li>
        `
      )
      .join('');
  } catch (error) {
    ideaList.innerHTML = '<li class="text-red-400">Error: Could not generate ideas. Try again!</li>';
  }
}

// Save an idea to Supabase
async function saveIdea(channelUrl, title, score) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please log in to save ideas.');
    return;
  }

  const { error } = await supabase
    .from('saved_ideas')
    .insert([{ channel_url: channelUrl, idea_title: title, virality_score: score, user_id: user.id }]);

  if (error) {
    alert('Error saving idea: ' + error.message);
  } else {
    alert('Idea saved!');
    loadSavedIdeas();
  }
}
