/** @jsxImportSource solid-js */
import { createMemo } from "solid-js";

export const Card = (props) => {
  // Memoizing the drag handler to prevent unnecessary re-creations,
  // though in Solid components only run once.
  const handleDragStart = (e) => {
    props.onDragStart(e, props.card.id);
  };

  return (
    <div class="card" draggable={true} onDragStart={handleDragStart}>
      <div class="card-title">{props.card.title}</div>
      <p class="card-desc">{props.card.description}</p>
      <div class="card-footer">
        <span class={`priority-tag priority-${props.card.priority}`}>
          {props.card.priority}
        </span>
        <div class="avatar-container">
          <span class="card-date">{props.card.date}</span>
          <img
            class="avatar"
            src={props.card.avatar}
            alt="avatar"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
