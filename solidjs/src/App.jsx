import { createSignal } from "solid-js";

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <main class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">SolidJS</h1>
        <div class="bg-white rounded-xl shadow-md p-8">
          <button
            onClick={() => setCount(count() + 1)}
            class="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            count is {count()}
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
