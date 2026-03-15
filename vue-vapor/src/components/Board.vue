<script vapor setup>
import Column from "./Column.vue";

defineProps({
    columns: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(["drag-start", "drop-card"]);

const handleDragStart = (e, cardId) => {
    emit("drag-start", e, cardId);
};

const handleDrop = (columnId) => {
    emit("drop-card", columnId);
};
</script>

<template>
    <div class="board-grid">
        <Column
            v-for="column in columns"
            :key="column.id"
            :column="column"
            :cards="column.cards"
            @drag-start="handleDragStart"
            @drop-card="handleDrop"
        />
    </div>
</template>
