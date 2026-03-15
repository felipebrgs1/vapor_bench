<script setup>
import Column from "./Column.vue";

const props = defineProps({
    columns: {
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

// Emitting events up to App.vue
const emit = defineEmits(["drag-start", "drop-card"]);
</script>

<template>
    <div class="board-grid">
        <Column
            v-for="column in columns"
            :key="column.id"
            :column="column"
            :cards="column.cards"
            :on-drag-start="onDragStart"
            :on-drop="onDrop"
        />
    </div>
</template>
