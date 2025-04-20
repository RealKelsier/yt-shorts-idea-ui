const { createRoot } = ReactDOM;

// Simple App Component
const App = () => {
  return (
    <div style={{ textAlign: 'center', padding: '20px', color: 'white', backgroundColor: '#1a1a1a' }}>
      <h1>ShortsGenix Minimal Test</h1>
      <p>If you see this, React is working!</p>
    </div>
  );
};

// Render the app
const root = createRoot(document.getElementById('root'));
root.render(<App />);
