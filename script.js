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
    const response = await fetch('https://your-render-api-url.com/api/ideas', {
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
            Virality Score: <span class="font-bold">${idea.score}/10</span>
          </li>
        `
      )
      .join('');
  } catch (error) {
    ideaList.innerHTML = '<li class="text-red-400">Error: Could not generate ideas. Try again!</li>';
  }
}
