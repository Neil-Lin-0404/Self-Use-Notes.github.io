export interface Note {
  id: string;
  title: string;
  category: string;
  date: string;
  modifiedDate?: string;
  pros: string[];
  cons: string[];
  solution: string;
  tags: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  isDraft?: boolean;
  referenceUrl?: string;
  authorAvatar?: string;
  authorInitials?: string;
}

export type ViewState = 'list' | 'create' | 'view';
