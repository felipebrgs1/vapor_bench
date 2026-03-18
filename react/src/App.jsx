import { useState, useMemo, useCallback } from "react";
import { getInitialData } from "@shared/mockData";
import { Board } from "./components/Board";
import "@shared/styles.css";

const App = () => {
  // Initial state for the Kanban board
  const [columns, setColumns] = useState(() => getInitialData());
  const [search, setSearch] = useState("");
  const [draggedCardId, setDraggedCardId] = useState(null);

  // Derived state for filtering 10,000 cards
  const filteredColumns = useMemo(() => {
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
  }, [columns, search]);

  const handleDragStart = useCallback((e, cardId) => {
    setDraggedCardId(cardId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cardId);
    }
  }, []);

  const handleDrop = useCallback(
    (targetColumnId) => {
      setColumns((prevColumns) => {
        if (!draggedCardId) return prevColumns;

        let movedCard = null;
        let sourceColIdx = -1;
        let cardIdx = -1;

        // 1. Find the card and its source column
        for (let i = 0; i < prevColumns.length; i++) {
          const index = prevColumns[i].cards.findIndex(
            (c) => c.id === draggedCardId,
          );
          if (index !== -1) {
            sourceColIdx = i;
            cardIdx = index;
            movedCard = prevColumns[i].cards[index];
            break;
          }
        }

        if (!movedCard) return prevColumns;

        // 2. Create new state immutably (React standard)
        const newColumns = prevColumns.map((col, idx) => {
          const isSource = idx === sourceColIdx;
          const isTarget = col.id === targetColumnId;

          if (isSource && isTarget) {
            // Same column: remove and move to top
            const otherCards = col.cards.filter((_, i) => i !== cardIdx);
            return {
              ...col,
              cards: [movedCard, ...otherCards],
            };
          }

          if (isSource) {
            return {
              ...col,
              cards: col.cards.filter((_, i) => i !== cardIdx),
            };
          }

          if (isTarget) {
            return {
              ...col,
              cards: [movedCard, ...col.cards],
            };
          }

          return col;
        });

        return newColumns;
      });

      setDraggedCardId(null);
    },
    [draggedCardId],
  );

  // --- NEW BENCHMARK ACTIONS ---
  const toggleAllPriorities = useCallback(() => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) => ({
          ...card,
          priority: card.priority === "High" ? "Low" : "High",
        })),
      })),
    );
  }, []);

  const swapFirstLast = useCallback(() => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.cards.length < 2) return col;
        const newCards = [...col.cards];
        const first = newCards[0];
        const last = newCards[newCards.length - 1];
        newCards[0] = last;
        newCards[newCards.length - 1] = first;
        return { ...col, cards: newCards };
      }),
    );
  }, []);

  const clearBoard = useCallback(() => {
    setColumns((prev) => (prev.length > 0 ? [] : getInitialData()));
  }, []);

  return (
    <div className="kanban-container">
      <div className="search-container flex flex-col gap-4">
        <input
          type="text"
          className="search-input"
          placeholder="Filter 10,000 cards (React 19 VDOM)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 justify-center mt-2">
          <button
            onClick={toggleAllPriorities}
            id="bench-toggle"
            className="px-3 py-1 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 transition-colors"
          >
            Toggle Priorities
          </button>
          <button
            onClick={swapFirstLast}
            id="bench-swap"
            className="px-3 py-1 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 transition-colors"
          >
            Swap First/Last
          </button>
          <button
            onClick={clearBoard}
            id="bench-clear"
            className="px-3 py-1 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 transition-colors"
          >
            {columns.length > 0 ? "Clear Board" : "Restore Board"}
          </button>
        </div>
      </div>

      <Board
        columns={filteredColumns}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    </div>
  );
};

export default App;
