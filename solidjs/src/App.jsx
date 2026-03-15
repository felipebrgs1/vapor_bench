/** @jsxImportSource solid-js */
import { createSignal, createMemo } from "solid-js";
import { getInitialData } from "@shared/mockData";
import { Board } from "./components/Board";
import "@shared/styles.css";

const App = () => {
  const [columns, setColumns] = createSignal(getInitialData());
  const [search, setSearch] = createSignal("");
  const [draggedCardId, setDraggedCardId] = createSignal(null);

  // Memoized filter logic for the 1,000 cards
  const filteredColumns = createMemo(() => {
    const query = search().toLowerCase();
    if (!query) return columns();

    return columns().map((col) => ({
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
    // Standard HTML5 DnD setup
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cardId);
    }
  };

  const handleDrop = (targetColumnId) => {
    const cardId = draggedCardId();
    if (!cardId) return;

    setColumns((prev) => {
      let movedCard = null;

      // 1. Find and remove the card from its current column
      const nextColumns = prev.map((col) => {
        const cardIndex = col.cards.findIndex((c) => c.id === cardId);
        if (cardIndex !== -1) {
          movedCard = col.cards[cardIndex];
          const newCards = [...col.cards];
          newCards.splice(cardIndex, 1);
          return { ...col, cards: newCards };
        }
        return col;
      });

      // 2. Add the card to the top of the destination column
      if (movedCard) {
        return nextColumns.map((col) => {
          if (col.id === targetColumnId) {
            return { ...col, cards: [movedCard, ...col.cards] };
          }
          return col;
        });
      }

      return nextColumns;
    });

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
