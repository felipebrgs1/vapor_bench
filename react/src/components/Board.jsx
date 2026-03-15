import { Column } from "./Column";

export const Board = ({ columns, onDragStart, onDrop }) => {
  return (
    <div className="board-grid">
      {columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          cards={column.cards}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};
