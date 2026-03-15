<script>
  /** @typedef {import('../../../shared/mockData').ColumnData} ColumnData */
  /** @typedef {import('../../../shared/mockData').CardData} CardData */
  import Column from './Column.svelte';

  /**
   * @type {{
   *   columns: ColumnData[],
   *   onDragStart: (e: DragEvent, cardId: string) => void,
   *   onDrop: (columnId: string) => void
   * }}
   */
  let { columns, onDragStart, onDrop } = $props();
</script>

<div class="board-grid">
  {#each columns as column (column.id)}
    <Column
      {column}
      cards={column.cards}
      {onDragStart}
      {onDrop}
    />
  {/each}
</div>
