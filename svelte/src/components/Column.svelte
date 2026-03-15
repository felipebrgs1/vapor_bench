<script>
  /** @jsxImportSource svelte */
  import Card from './Card.svelte';

  let { column, cards, onDragStart, onDrop } = $props();

  function handleDragOver(e) {
    e.preventDefault();
  }
</script>

<div
  class="column"
  ondragover={handleDragOver}
  ondrop={() => onDrop(column.id)}
>
  <div class="column-header">
    <span>{column.title}</span>
    <span class="card-count">{cards.length}</span>
  </div>
  <div class="card-list">
    {#each cards as card (card.id)}
      <Card {card} {onDragStart} />
    {/each}
  </div>
</div>
