/** @jsxImportSource solid-js */
import { createSignal, createMemo } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { getInitialData } from "@shared/mockData";
import { Board } from "./components/Board";
import "@shared/styles.css";

const App = () => {
  // Using createStore for deep reactivity.
  // This allows updating a single card or column without recreating the whole state tree.
  const [state, setState] = createStore({
    columns: getInitialData(),
  });

  const [search, setSearch] = createSignal("");
  const [draggedCardId, setDraggedCardId] = createSignal(null);

  // Memoized filter logic.
  // Note: While the memo recreates the filtered structure, Solid's <For>
  // is smart enough to reconciliate by reference.
  const filteredColumns = createMemo(() => {
    const query = search().toLowerCase();
    if (!query) return state.columns;

    return state.columns.map((col) => ({
      ...col,
      cards: col.cards.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query),
      ),
    }));
  });

  const handleDragStart = (e, cardId) => {
    setDraggedCardId(cardId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cardId);
    }
  };

  const handleDrop = (targetColumnId) => {
    const cardId = draggedCardId();
    if (!cardId) return;

    // produce allow us to mutate the state in a controlled way that
    // Solid translates into fine-grained updates.
    setState(
      "columns",
      produce((cols) => {
        let movedCard = null;
        let sourceColIdx = -1;
        let cardIdx = -1;

        // 1. Find the card and its source column
        for (let i = 0; i < cols.length; i++) {
          const index = cols[i].cards.findIndex((c) => c.id === cardId);
          if (index !== -1) {
            sourceColIdx = i;
            cardIdx = index;
            movedCard = cols[i].cards[index];
            break;
          }
        }

        if (movedCard) {
          // 2. Remove from source
          cols[sourceColIdx].cards.splice(cardIdx, 1);

          // 3. Find target and add
          const targetCol = cols.find((c) => c.id === targetColumnId);
          if (targetCol) {
            targetCol.cards.unshift(movedCard);
          }
        }
      }),
    );

    setDraggedCardId(null);
  };

  return (
    <div class="kanban-container">
      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder="Filtrar 1.000 cartões em tempo real..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <Board
        columns={filteredColumns()}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    </div>
  );
};

export default App;
