/** @jsxImportSource solid-js */
import { For } from "solid-js";
import { Card } from "./Card";

export const Column = (props) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      class="column"
      onDragOver={handleDragOver}
      onDrop={() => props.onDrop(props.column.id)}
    >
      <div class="column-header">
        <span>{props.column.title}</span>
        <span class="card-count">{props.cards.length}</span>
      </div>
      <div class="card-list">
        <For each={props.cards}>
          {(card) => <Card card={card} onDragStart={props.onDragStart} />}
        </For>
      </div>
    </div>
  );
};
