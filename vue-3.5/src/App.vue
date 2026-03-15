<script setup>
import { ref, computed } from "vue";
import { getInitialData } from "@shared/mockData";
import Board from "./components/Board.vue";
import "@shared/styles.css";

// Initial state using reactive refs
const columns = ref(getInitialData());
const search = ref("");
const draggedCardId = ref(null);

// Computed property for filtering 1,000 cards
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
</script>

<template>
    <div class="kanban-container">
        <div class="search-container">
            <input
                type="text"
                class="search-input"
                placeholder="Filtrar 1.000 cartões (Vue 3.5 Virtual DOM)..."
                v-model="search"
            />
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
