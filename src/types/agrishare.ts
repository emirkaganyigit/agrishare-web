// src/types/agrishare.ts

export type UserRole = "owner" | "entrepreneur";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  phone?: string;
}

export interface Land {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  city: string;
  district?: string;
  sizeDekar: number;
  soilType?: string;
  irrigation?: string;
  suitableFor?: string[]; // ["zeytin", "buğday", "üzüm"] gibi
}

export interface Request {
  id: string;
  entrepreneurId: string;
  targetProduct: string;
  budgetRange?: string; // "100k-250k" gibi
  preferredCity?: string;
  note?: string;
  landId?: string; // belirli araziye özel talep
}
