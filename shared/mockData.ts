export type Priority = 'High' | 'Medium' | 'Low';

export interface CardData {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  date: string;
  avatar: string;
}

export interface ColumnData {
  id: string;
  title: string;
  cards: CardData[];
}

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

const generateCards = (count: number, columnId: string): CardData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${columnId}-card-${i}`,
    title: `Task ${i + 1} in ${columnId}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at varius enim, ut iaculis neque.",
    priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
    date: new Date().toLocaleDateString('pt-BR'),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${columnId}-${i}`
  }));
};

export const getInitialData = (): ColumnData[] => [
  { id: 'backlog', title: 'Backlog', cards: generateCards(250, 'backlog') },
  { id: 'todo', title: 'To Do', cards: generateCards(250, 'todo') },
  { id: 'in-progress', title: 'In Progress', cards: generateCards(250, 'in-progress') },
  { id: 'done', title: 'Done', cards: generateCards(250, 'done') },
];
