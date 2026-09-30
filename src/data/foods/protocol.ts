import type { Food } from '@/domain';
import type { FoodDatabaseInfo } from './foodDatabase';

/** Messages between the app and the food index worker. */
export type WorkerRequest =
  | { type: 'init'; base: string }
  | { type: 'search'; id: number; query: string; limit?: number | undefined }
  | { type: 'get'; id: number; key: string };

export type WorkerResponse =
  | { type: 'ready'; info: FoodDatabaseInfo }
  | { type: 'failed'; message: string }
  | { type: 'search'; id: number; foods: Food[] }
  | { type: 'get'; id: number; food: Food | undefined };
