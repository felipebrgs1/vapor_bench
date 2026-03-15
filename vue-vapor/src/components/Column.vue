<script vapor setup>
import Card from "./Card.vue";

const props = defineProps({
    column: {
        type: Object,
        required: true,
    },
    cards: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(["drag-start", "drop-card"]);

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop() {
    emit("drop-card", props.column.id);
}

function onCardDragStart(e, cardId) {
    emit("drag-start", e, cardId);
}
</script>

<template>
    <div class="column" @dragover="handleDragOver" @drop="handleDrop">
        <div class="column-header">
            <span>{{ column.title }}</span>
            <span class="card-count">{{ cards.length }}</span>
        </div>
        <div class="card-list">
            <Card
                v-for="card in cards"
                :key="card.id"
                :card="card"
                @drag-start="onCardDragStart"
            />
        </div>
    </div>
</template>
