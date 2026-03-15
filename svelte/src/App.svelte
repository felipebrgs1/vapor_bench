<script>
    let count = $state(0);

    function increment() {
        count++;
    }
</script>

<main class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">Svelte</h1>
        <div class="bg-white rounded-xl shadow-md p-8">
            <button
                onclick={increment}
                class="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
                count is {count}
            </button>
        </div>
    </div>
</main>
