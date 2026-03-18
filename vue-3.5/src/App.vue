<script setup>
import { ref, computed } from "vue";
import { getInitialData } from "@shared/mockData";
import Board from "./components/Board.vue";
import "@shared/styles.css";

// Initial state using reactive refs
const columns = ref(getInitialData());
const search = ref("");
const draggedCardId = ref(null);

// Computed property for filtering 10,000 cards
const filteredColumns = computed(() => {
    const query = search.value.toLowerCase();
    if (!query) return columns.value;

    return columns.value.map((col) => ({
        ...col,
        cards: col.cards.filter(
            (card) =>
                card.title.toLowerCase().includes(query) ||
                card.description.toLowerCase().includes(query),
        ),
    }));
});

const handleDragStart = (e, cardId) => {
    draggedCardId.value = cardId;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", cardId);
    }
};

const handleDrop = (targetColumnId) => {
    const cardId = draggedCardId.value;
    if (!cardId) return;

    let movedCard = null;
    let sourceCol = null;
    let cardIdx = -1;

    // 1. Find the card
    for (const col of columns.value) {
        const idx = col.cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
            sourceCol = col;
            cardIdx = idx;
            movedCard = col.cards[idx];
            break;
        }
    }

    if (movedCard) {
        // 2. Remove from source and insert into target
        sourceCol.cards.splice(cardIdx, 1);
        const targetCol = columns.value.find((c) => c.id === targetColumnId);
        if (targetCol) {
            targetCol.cards.unshift(movedCard);
        }
    }

    draggedCardId.value = null;
};

// --- NEW BENCHMARK ACTIONS ---
const toggleAllPriorities = () => {
    columns.value = columns.value.map(col => ({
        ...col,
        cards: col.cards.map(card => ({
            ...card,
            priority: card.priority === 'High' ? 'Low' : 'High'
        }))
    }));
};

const swapFirstLast = () => {
    columns.value = columns.value.map(col => {
        if (col.cards.length < 2) return col;
        const newCards = [...col.cards];
        const first = newCards[0];
        const last = newCards[newCards.length - 1];
        newCards[0] = last;
        newCards[newCards.length - 1] = first;
        return { ...col, cards: newCards };
    });
};

const clearBoard = () => {
    columns.value = columns.value.length > 0 ? [] : getInitialData();
};
</script>

<template>
    <div class="kanban-container">
        <div class="search-container flex flex-col gap-4">
            <input
                type="text"
                class="search-input"
                placeholder="Filter 10,000 cards (Vue 3.5 Virtual DOM)..."
                v-model="search"
            />

            <div class="flex gap-2 justify-center mt-2">
                <button @click="toggleAllPriorities" id="bench-toggle" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">Toggle Priorities</button>
                <button @click="swapFirstLast" id="bench-swap" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">Swap First/Last</button>
                <button @click="clearBoard" id="bench-clear" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
                    {{ columns.length > 0 ? 'Clear Board' : 'Restore Board' }}
                </button>
            </div>
        </div>

        <Board
            :columns="filteredColumns"
            :on-drag-start="handleDragStart"
            :on-drop="handleDrop"
        />
    </div>
</template>

<style>
/* Global styles from shared/styles.css */
</style>
