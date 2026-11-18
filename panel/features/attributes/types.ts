export type AttributeOption = {
  id: string;
  attributeId: string;
  name: string;
  value: string | null;
  image: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Attribute = {
  id: string;
  name: string;
  slug: string;
  type: "DROPDOWN";
  sortOrder: number;
  isPublished: boolean;
  showInFilter: boolean;
  createdAt: string;
  updatedAt: string;
  options: AttributeOption[];
};

export type AttributeInput = {
  name: string;
  slug: string;
  type?: "DROPDOWN";
  sortOrder?: number;
  isPublished?: boolean;
  showInFilter?: boolean;
};

export type AttributeOptionInput = {
  name: string;
  value?: string | null;
  image?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
};
