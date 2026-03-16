import { get, set, keys, del } from 'idb-keyval';

export interface BoardSlot {
  id: number;
  image: string | null;
  name: string;
}

export interface Board {
  id: string;
  name: string;
  slots: BoardSlot[];
  createdAt: number;
}

export const saveBoard = async (board: Board) => {
  await set(`board_${board.id}`, board);
};

export const getBoard = async (id: string): Promise<Board | undefined> => {
  return await get(`board_${id}`);
};

export const getAllBoards = async (): Promise<Board[]> => {
  const allKeys = await keys();
  const boardKeys = allKeys.filter(key => typeof key === 'string' && key.startsWith('board_'));
  const boards = await Promise.all(boardKeys.map(key => get(key as string)));
  return boards.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteBoard = async (id: string) => {
  await del(`board_${id}`);
};
