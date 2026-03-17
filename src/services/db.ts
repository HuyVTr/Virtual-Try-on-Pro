import Dexie, { Table } from 'dexie';
import { SavedItem } from '../types';

export class GemLabDatabase extends Dexie {
  library!: Table<SavedItem>;

  constructor() {
    super('GemLabStudioDB');
    this.version(1).stores({
      library: '++id, type, model, module, createdAt' // Index these fields
    });
  }
}

export const db = new GemLabDatabase();

export const saveToLibrary = async (item: Omit<SavedItem, 'id' | 'createdAt'>) => {
  try {
    const newItem: SavedItem = {
      ...item,
      createdAt: Date.now()
    };
    const id = await db.library.add(newItem);
    console.info(`[Gem-Lab] Đã lưu vào thư viện với ID: ${id}`);
    return id;
  } catch (error) {
    console.error('[Gem-Lab] Lỗi khi lưu vào thư viện:', error);
    return null;
  }
};

export const deleteFromLibrary = async (id: number) => {
  try {
    await db.library.delete(id);
    return true;
  } catch (error) {
    console.error('[Gem-Lab] Lỗi khi xóa khỏi thư viện:', error);
    return false;
  }
};

export const clearLibrary = async () => {
    try {
        await db.library.clear();
        return true;
    } catch (error) {
        console.error('[Gem-Lab] Lỗi khi xóa sạch thư viện:', error);
        return false;
    }
};
