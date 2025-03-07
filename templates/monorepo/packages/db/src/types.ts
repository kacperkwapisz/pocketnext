/**
 * Types for PocketBase
 *
 * This file will be automatically replaced when running the type generation script.
 * Do not modify this file directly as it will be overwritten.
 *
 * To generate updated types, run:
 * pnpm typegen
 */

import PocketBase from "pocketbase";

/**
 * Base type for records
 */
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

/**
 * Type for a User record
 */
export interface UserRecord extends BaseRecord {
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
}

/**
 * Collection types that will be automatically replaced by typegen
 */
export interface Collections {
  users: UserRecord;
  posts: any;
  comments: any;
  [key: string]: any;
}

/**
 * Extended PocketBase type with collection typing
 */
export type TypedPocketBase = PocketBase & {
  collection(
    name: "users"
  ): PocketBase["collection"] & CollectionMethods<Collections["users"]>;
  collection<T extends keyof Collections>(
    name: T
  ): PocketBase["collection"] & CollectionMethods<Collections[T]>;
};

/**
 * Type for collection methods with record typing
 */
interface CollectionMethods<T> {
  getList<U = T>(
    page?: number,
    perPage?: number,
    options?: any
  ): Promise<ListResult<U>>;
  getOne<U = T>(id: string, options?: any): Promise<U>;
  getFullList<U = T>(options?: any): Promise<Array<U>>;
}

/**
 * Type for collection list results
 */
interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: Array<T>;
}

export type CollectionRecords<T extends keyof Collections> = {
  // Will be populated by pocketbase-typegen
};
