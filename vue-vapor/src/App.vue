<script vapor setup>
import { ref, computed } from "vue";
import { getInitialData } from "@shared/mockData";
import Board from "./components/Board.vue";
import "@shared/styles.css";

// Vue Vapor uses the same reactivity system (ref, computed)
// but compiles the template to direct DOM instructions instead of VDOM.
const columns = ref(getInitialData());
const search = ref("");
const draggedCardId = ref(null);

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
</script>

<template>
    <div class="kanban-container">
        <div class="search-container">
            <input
                type="text"
                class="search-input"
                placeholder="Filtrar 1.000 cartões (VUE VAPOR - No Virtual DOM)..."
                v-model="search"
            />
        </div>

        <Board
            :columns="filteredColumns"
            @drag-start="handleDragStart"
            @drop-card="handleDrop"
        />
    </div>
</template>

<style>
/* Global styles from shared/styles.css */
</style>
