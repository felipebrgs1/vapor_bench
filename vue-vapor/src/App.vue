<script vapor setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
    <main class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">Vue Vapor 3.6</h1>
            <div class="bg-white rounded-xl shadow-md p-8">
                <button
                    @click="count++"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    count is {{ count }}
                </button>
            </div>
        </div>
    </main>
</template>
