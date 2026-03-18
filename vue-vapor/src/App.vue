<script vapor setup>
import { ref, watch } from "vue";
import { getInitialData } from "@shared/mockData";
import Board from "./components/Board.vue";
import "@shared/styles.css";

// Vue Vapor uses the same reactivity system (ref, watch)
// but compiles the template to direct DOM instructions instead of VDOM.
const columns = ref(getInitialData().map(col => ({
    ...col,
    cards: col.cards.map(card => ({ ...card, visible: true }))
})));
const search = ref("");
const draggedCardId = ref(null);

// Fine-grained filtering: we mutate the 'visible' property of each card
// instead of recreating the entire data structure. This allows Vapor to
// only update the necessary DOM nodes (toggle display).
watch(search, (query) => {
    const q = query.toLowerCase();
    columns.value.forEach(col => {
        col.cards.forEach(card => {
            card.visible = !q ||
                card.title.toLowerCase().includes(q) ||
                card.description.toLowerCase().includes(q);
        });
    });
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
    columns.value.forEach(col => {
        col.cards.forEach(card => {
            card.priority = card.priority === 'High' ? 'Low' : 'High';
        });
    });
};

const swapFirstLast = () => {
    columns.value.forEach(col => {
        if (col.cards.length < 2) return;
        const first = col.cards[0];
        const last = col.cards[col.cards.length - 1];
        col.cards[0] = last;
        col.cards[col.cards.length - 1] = first;
    });
};

const clearBoard = () => {
    if (columns.value.length > 0) {
        columns.value = [];
    } else {
        columns.value = getInitialData().map(col => ({
            ...col,
            cards: col.cards.map(card => ({ ...card, visible: true }))
        }));
    }
};
</script>

<template>
    <div class="kanban-container">
        <div class="search-container flex flex-col gap-4">
            <input
                type="text"
                class="search-input"
                placeholder="Filter 10,000 cards (Vue Vapor - No Virtual DOM)..."
                :value="search"
                @input="search = $event.target.value"
            />

            <div class="flex gap-2 justify-center mt-2">
                <button @click="toggleAllPriorities" id="bench-toggle" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">Toggle Priorities</button>
                <button @click="swapFirstLast" id="bench-swap" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">Swap First/Last</button>
                <button @click="clearBoard" id="bench-clear" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                    {{ columns.length > 0 ? 'Clear Board' : 'Restore Board' }}
                </button>
            </div>
        </div>

        <Board
            :columns="columns"
            @drag-start="handleDragStart"
            @drop-card="handleDrop"
        />
    </div>
</template>

<style>
/* Global styles from shared/styles.css */
</style>
