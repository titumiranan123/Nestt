export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  logo: string | null;
  isPublished: boolean;
  isPopularCat: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  _count?: { children: number; products: number };
};

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  logo?: string | null;
  isPublished?: boolean;
  isPopularCat?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string[];
};
