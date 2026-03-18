/** @jsxImportSource solid-js */
import { createSignal, batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { getInitialData } from "@shared/mockData";
import { Board } from "./components/Board";
import "@shared/styles.css";

const App = () => {
  // Using createStore for deep reactivity.
  // This allows updating a single card or column without recreating the whole state tree.
  const [state, setState] = createStore({
    columns: getInitialData().map((col) => ({
      ...col,
      cards: col.cards.map((card) => ({ ...card, visible: true })),
    })),
  });

  const [search, setSearch] = createSignal("");
  const [draggedCardId, setDraggedCardId] = createSignal(null);

  // Fine-grained filtering: mutate 'visible' property in the store.
  // This avoids recreating the column/card objects and allows Solid to
  // only update the hidden/visible state of each card.
  const filterCards = (query) => {
    const q = query.toLowerCase();
    batch(() => {
      state.columns.forEach((col, colIdx) => {
        col.cards.forEach((card, cardIdx) => {
          const isVisible =
            !q ||
            card.title.toLowerCase().includes(q) ||
            card.description.toLowerCase().includes(q);
          if (card.visible !== isVisible) {
            setState("columns", colIdx, "cards", cardIdx, "visible", isVisible);
          }
        });
      });
    });
  };

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

    let sourceColIdx = -1;
    let cardIdx = -1;

    for (let i = 0; i < state.columns.length; i++) {
      const index = state.columns[i].cards.findIndex((c) => c.id === cardId);
      if (index !== -1) {
        sourceColIdx = i;
        cardIdx = index;
        break;
      }
    }

    if (sourceColIdx !== -1) {
      const movedCard = state.columns[sourceColIdx].cards[cardIdx];
      const targetColIdx = state.columns.findIndex((c) => c.id === targetColumnId);

      if (targetColIdx !== -1) {
        batch(() => {
          setState("columns", sourceColIdx, "cards", (cards) =>
            cards.filter((_, i) => i !== cardIdx),
          );
          setState("columns", targetColIdx, "cards", (cards) => [
            movedCard,
            ...cards,
          ]);
        });
      }
    }

    setDraggedCardId(null);
  };

  // --- NEW BENCHMARK ACTIONS ---
  const toggleAllPriorities = () => {
    setState(
      "columns",
      (col) => true,
      "cards",
      (card) => true,
      "priority",
      (p) => (p === "High" ? "Low" : "High"),
    );
  };

  const swapFirstLast = () => {
    setState(
      "columns",
      produce((cols) => {
        cols.forEach((col) => {
          if (col.cards.length < 2) return;
          const first = col.cards[0];
          const last = col.cards[col.cards.length - 1];
          col.cards[0] = last;
          col.cards[col.cards.length - 1] = first;
        });
      }),
    );
  };

  const clearBoard = () => {
    if (state.columns.length > 0) {
      setState("columns", []);
    } else {
      setState(
        "columns",
        getInitialData().map((col) => ({
          ...col,
          cards: col.cards.map((card) => ({ ...card, visible: true })),
        })),
      );
    }
  };

  return (
    <div class="kanban-container">
      <div class="search-container flex flex-col gap-4">
        <input
          type="text"
          class="search-input"
          placeholder="Filter 10,000 cards in real-time..."
          value={search()}
          oninput={(e) => {
            const val = e.currentTarget.value;
            setSearch(val);
            filterCards(val);
          }}
        />

        <div class="flex gap-2 justify-center mt-2">
          <button
            onclick={toggleAllPriorities}
            id="bench-toggle"
            class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Toggle Priorities
          </button>
          <button
            onclick={swapFirstLast}
            id="bench-swap"
            class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Swap First/Last
          </button>
          <button
            onclick={clearBoard}
            id="bench-clear"
            class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
          >
            {state.columns.length > 0 ? "Clear Board" : "Restore Board"}
          </button>
        </div>
      </div>

      <Board
        columns={state.columns}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    </div>
  );
};

export default App;
