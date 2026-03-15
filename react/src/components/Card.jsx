export const Card = ({ card, onDragStart }) => {
  const handleDragStart = (e) => {
    onDragStart(e, card.id);
  };

  return (
    <div className="card" draggable={true} onDragStart={handleDragStart}>
      <div className="card-title">{card.title}</div>
      <p className="card-desc">{card.description}</p>
      <div className="card-footer">
        <span className={`priority-tag priority-${card.priority}`}>
          {card.priority}
        </span>
        <div className="avatar-container">
          <span className="card-date">{card.date}</span>
          <img
            className="avatar"
            src={card.avatar}
            alt="avatar"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
