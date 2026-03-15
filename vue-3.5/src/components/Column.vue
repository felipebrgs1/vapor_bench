<script setup>
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
    onDragStart: {
        type: Function,
        required: true,
    },
    onDrop: {
        type: Function,
        required: true,
    },
});

function handleDragOver(e) {
    e.preventDefault();
}
</script>

<template>
    <div class="column" @dragover="handleDragOver" @drop="onDrop(column.id)">
        <div class="column-header">
            <span>{{ column.title }}</span>
            <span class="card-count">{{ cards.length }}</span>
        </div>
        <div class="card-list">
            <Card
                v-for="card in cards"
                :key="card.id"
                :card="card"
                :on-drag-start="onDragStart"
            />
        </div>
    </div>
</template>
