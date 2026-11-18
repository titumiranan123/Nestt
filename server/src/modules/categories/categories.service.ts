import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
import type { CreateCategory, UpdateCategory } from './dto/category.schemas.js';
import { CategoriesRepository } from './categories.repository.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  listPublished() {
    return this.repository.listPublished();
  }

  async getPublished(slug: string) {
    const category = await this.repository.findPublishedBySlug(slug);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  listAll() {
    return this.repository.listAll();
  }

  async getById(id: string) {
    const category = await this.repository.findAdminById(id);
    if (!category || category.deletedAt)
      throw new NotFoundException('Category not found');
    return category;
  }

  async create(input: CreateCategory) {
    if (input.parentId) await this.ensureActiveParent(input.parentId);
    try {
      return await this.repository.create(input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Category slug already exists',
        notFound: 'Category not found',
        foreignKey: 'Parent category not found',
      });
    }
  }

  async update(id: string, input: UpdateCategory) {
    const current = await this.repository.findById(id);
    if (!current || current.deletedAt)
      throw new NotFoundException('Category not found');
    if (input.parentId) {
      if (input.parentId === id)
        throw new BadRequestException('A category cannot be its own parent');
      await this.ensureActiveParent(input.parentId);
      await this.ensureNoCycle(id, input.parentId);
    }
    try {
      return await this.repository.update(id, input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Category slug already exists',
        notFound: 'Category not found',
        foreignKey: 'Parent category not found',
      });
    }
  }

  async remove(id: string) {
    const current = await this.repository.findById(id);
    if (!current || current.deletedAt)
      throw new NotFoundException('Category not found');
    if (await this.repository.countActiveChildren(id)) {
      throw new ConflictException(
        'Move or delete child categories before deleting this category',
      );
    }
    await this.repository.update(id, {
      deletedAt: new Date(),
      isPublished: false,
    });
    return { deleted: true };
  }

  private async ensureActiveParent(id: string) {
    const parent = await this.repository.findById(id);
    if (!parent || parent.deletedAt)
      throw new BadRequestException('Parent category not found');
  }

  private async ensureNoCycle(categoryId: string, parentId: string) {
    let cursor: string | null = parentId;
    while (cursor) {
      if (cursor === categoryId)
        throw new BadRequestException('Category parent would create a cycle');
      const parent: { parentId: string | null } | null =
        await this.repository.findById(cursor);
      cursor = parent?.parentId ?? null;
    }
  }
}
