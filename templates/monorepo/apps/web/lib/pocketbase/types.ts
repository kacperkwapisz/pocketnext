/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";

export enum Collections {
  Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System fields
export type BaseSystemFields<T = never> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
  created: IsoDateString;
  updated: IsoDateString;
  expand?: T;
};

export type AuthSystemFields<T = never> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types
export type UsersRecord = {
  avatar?: string;
  name?: string;
  isApproved?: boolean;
};

// Response types
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> &
  AuthSystemFields<Texpand>;

// Collection types
export type CollectionRecords = {
  users: UsersRecord;
};

export type CollectionResponses = {
  users: UsersResponse;
};

// Type helper for the PocketBase instance
export type TypedPocketBase = PocketBase & {
  collection(idOrName: "users"): RecordService<UsersResponse>;
};
