/** @jsxImportSource solid-js */
import { For } from "solid-js";
import { Column } from "./Column";

export const Board = (props) => {
  return (
    <div class="board-grid">
      <For each={props.columns}>
        {(column) => (
          <Column
            column={column}
            cards={column.cards}
            onDragStart={props.onDragStart}
            onDrop={props.onDrop}
          />
        )}
      </For>
    </div>
  );
};
