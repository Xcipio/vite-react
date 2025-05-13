function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10 text-gray-800">
      <h1 className="text-4xl font-bold mb-2">Nap</h1>
      <p className="text-lg text-center max-w-xl mb-6">
        Software Developer based in Tokyo. I love building elegant user experiences, solving complex problems, and drinking strong coffee.
      </p>
      <div className="flex gap-4">
        <a
          href="https://github.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          GitHub
        </a>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white border border-black text-black rounded-lg hover:bg-gray-200 transition"
        >
          Download Resume
        </a>
      </div>
    </div>
  );
}

export default App;
