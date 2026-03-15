import { Card } from "./Card";

export const Column = ({ column, cards, onDragStart, onDrop }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="column"
      onDragOver={handleDragOver}
      onDrop={() => onDrop(column.id)}
    >
      <div className="column-header">
        <span>{column.title}</span>
        <span className="card-count">{cards.length}</span>
      </div>
      <div className="card-list">
        {cards.map((card) => (
          <Card key={card.id} card={card} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
};
