<script setup>
defineProps({
  card: {
    type: Object,
    required: true
  },
  onDragStart: {
    type: Function,
    required: true
  }
});
</script>

<template>
  <div
    class="card"
    draggable="true"
    @dragstart="onDragStart($event, card.id)"
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
