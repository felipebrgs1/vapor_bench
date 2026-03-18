<script>
    import { getInitialData } from "@shared/mockData";
    import Board from "./components/Board.svelte";
    import "@shared/styles.css";

    // Svelte 5 Runes for state management
    let columns = $state(getInitialData().map(col => ({
        ...col,
        cards: col.cards.map(card => ({ ...card, visible: true }))
    })));
    let search = $state("");
    let draggedCardId = $state(null);

    // Fine-grained filtering: mutate 'visible' property in the state.
    // This avoids recreating the column/card objects and allows Svelte to
    // only update the hidden/visible state of each card.
    $effect(() => {
        const query = search.toLowerCase();
        columns.forEach(col => {
            col.cards.forEach(card => {
                card.visible = !query ||
                    card.title.toLowerCase().includes(query) ||
                    card.description.toLowerCase().includes(query);
            });
        });
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

    // --- NEW BENCHMARK ACTIONS ---
    function toggleAllPriorities() {
        columns.forEach(col => {
            col.cards.forEach(card => {
                card.priority = card.priority === 'High' ? 'Low' : 'High';
            });
        });
    }

    function swapFirstLast() {
        columns.forEach(col => {
            if (col.cards.length < 2) return;
            const first = col.cards[0];
            const last = col.cards[col.cards.length - 1];
            col.cards[0] = last;
            col.cards[col.cards.length - 1] = first;
        });
    }

    function clearBoard() {
        if (columns.length > 0) {
            columns = [];
        } else {
            columns = getInitialData().map(col => ({
                ...col,
                cards: col.cards.map(card => ({ ...card, visible: true }))
            }));
        }
    }
</script>

<div class="kanban-container">
    <div class="search-container flex flex-col gap-4">
        <input
            type="text"
            class="search-input"
            placeholder="Filter 10,000 cards (Svelte 5 Runes)..."
            bind:value={search}
        />

        <div class="flex gap-2 justify-center mt-2">
            <button onclick={toggleAllPriorities} id="bench-toggle" class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">Toggle Priorities</button>
            <button onclick={swapFirstLast} id="bench-swap" class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">Swap First/Last</button>
            <button onclick={clearBoard} id="bench-clear" class="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors">
                {columns.length > 0 ? 'Clear Board' : 'Restore Board'}
            </button>
        </div>
    </div>

    <Board
        columns={columns}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
    />
</div>

<style>
    /* Global styles are imported from @shared/styles.css */
</style>
