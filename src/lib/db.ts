import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
  authorUid: string;
}

export const saveBoard = async (board: Omit<Board, 'authorUid'>) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const boardToSave: Board = {
    ...board,
    authorUid: auth.currentUser.uid
  };
  
  await setDoc(doc(db, 'boards', board.id), boardToSave);
};

export const getBoard = async (id: string): Promise<Board | undefined> => {
  const docSnap = await getDoc(doc(db, 'boards', id));
  if (docSnap.exists()) {
    return docSnap.data() as Board;
  }
  return undefined;
};

export const getAllBoards = async (): Promise<Board[]> => {
  if (!auth.currentUser) return [];
  
  const q = query(collection(db, 'boards'), where('authorUid', '==', auth.currentUser.uid));
  const querySnapshot = await getDocs(q);
  const boards: Board[] = [];
  querySnapshot.forEach((doc) => {
    boards.push(doc.data() as Board);
  });
  
  return boards.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteBoard = async (id: string) => {
  await deleteDoc(doc(db, 'boards', id));
};
