<script>
  /** @type {{ card: import('../../../shared/mockData').CardData, onDragStart: (e: DragEvent, id: string) => void }} */
  let { card, onDragStart } = $props();
</script>

<div
  class="card"
  draggable="true"
  ondragstart={(e) => onDragStart(e, card.id)}
>
  <div class="card-title">{card.title}</div>
  <p class="card-desc">{card.description}</p>
  <div class="card-footer">
    <span class="priority-tag priority-{card.priority}">
      {card.priority}
    </span>
    <div class="avatar-container">
      <span class="card-date">{card.date}</span>
      <img
        class="avatar"
        src={card.avatar}
        alt="avatar"
        loading="lazy"
      />
    </div>
  </div>
</div>
