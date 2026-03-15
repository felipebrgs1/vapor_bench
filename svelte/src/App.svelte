<script>
    import { getInitialData } from "@shared/mockData";
    import Board from "./components/Board.svelte";
    import "@shared/styles.css";

    // Svelte 5 Runes for state management
    let columns = $state(getInitialData());
    let search = $state("");
    let draggedCardId = $state(null);

    // Derived state for filtering (similar to createMemo in Solid)
    let filteredColumns = $derived.by(() => {
        const query = search.toLowerCase();
        if (!query) return columns;

        return columns.map((col) => ({
            ...col,
            cards: col.cards.filter(
                (card) =>
                    card.title.toLowerCase().includes(query) ||
                    card.description.toLowerCase().includes(query),
            ),
        }));
    });

    function handleDragStart(e, cardId) {
        draggedCardId = cardId;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", cardId);
        }
    }

    function handleDrop(targetColumnId) {
        if (!draggedCardId) return;

        // Direct mutation of $state in Svelte 5 is fine-grained
        let movedCard = null;
        let sourceCol = null;
        let cardIdx = -1;

        // 1. Find the card
        for (const col of columns) {
            const idx = col.cards.findIndex((c) => c.id === draggedCardId);
            if (idx !== -1) {
                sourceCol = col;
                cardIdx = idx;
                movedCard = col.cards[idx];
                break;
            }
        }

        if (movedCard) {
            // 2. Remove and Insert (Fine-grained mutation)
            sourceCol.cards.splice(cardIdx, 1);
            const targetCol = columns.find((c) => c.id === targetColumnId);
            if (targetCol) {
                targetCol.cards.unshift(movedCard);
            }
        }

        draggedCardId = null;
    }
</script>

<div class="kanban-container">
    <div class="search-container">
        <input
            type="text"
            class="search-input"
            placeholder="Filtrar 1.000 cartões (Svelte 5 Runes)..."
            bind:value={search}
        />
    </div>

    <Board
        columns={filteredColumns}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
    />
</div>

<style>
    /* Global styles are imported from @shared/styles.css */
</style>
