<script vapor setup>
defineProps({
    card: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["drag-start"]);

function handleDragStart(e, id) {
    emit("drag-start", e, id);
}
</script>

<template>
    <div
        v-show="card.visible"
        class="card"
        draggable="true"
        @dragstart="handleDragStart($event, card.id)"
    >
        <div class="card-title">{{ card.title }}</div>
        <p class="card-desc">{{ card.description }}</p>
        <div class="card-footer">
            <span :class="['priority-tag', `priority-${card.priority}`]">
                {{ card.priority }}
            </span>
            <div class="avatar-container">
                <span class="card-date">{{ card.date }}</span>
                <img
                    class="avatar"
                    :src="card.avatar"
                    alt="avatar"
                    loading="lazy"
                />
            </div>
        </div>
    </div>
</template>
