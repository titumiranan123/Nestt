import { Injectable, NotFoundException } from '@nestjs/common';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
import type {
  CreateAttribute,
  CreateAttributeOption,
  UpdateAttribute,
  UpdateAttributeOption,
} from './dto/attribute.schemas.js';
import { AttributesRepository } from './attributes.repository.js';

@Injectable()
export class AttributesService {
  constructor(private readonly repository: AttributesRepository) {}

  listPublished() {
    return this.repository.listPublished();
  }

  async getPublished(slug: string) {
    const attribute = await this.repository.findPublishedBySlug(slug);
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  listAll() {
    return this.repository.listAll();
  }

  async getAdminById(id: string) {
    const attribute = await this.repository.findAdminById(id);
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  async create(input: CreateAttribute) {
    try {
      return await this.repository.create(input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Attribute name, slug, or option name already exists',
        notFound: 'Attribute or option not found',
      });
    }
  }

  async update(id: string, input: UpdateAttribute) {
    await this.requireActive(id);
    try {
      return await this.repository.update(id, input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Attribute name, slug, or option name already exists',
        notFound: 'Attribute or option not found',
      });
    }
  }

  async remove(id: string) {
    await this.requireActive(id);
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  async createOption(attributeId: string, input: CreateAttributeOption) {
    await this.requireActive(attributeId);
    try {
      return await this.repository.createOption(attributeId, input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Attribute name, slug, or option name already exists',
        notFound: 'Attribute or option not found',
      });
    }
  }

  async updateOption(
    attributeId: string,
    optionId: string,
    input: UpdateAttributeOption,
  ) {
    const option = await this.repository.findOption(attributeId, optionId);
    if (!option) throw new NotFoundException('Attribute option not found');
    try {
      return await this.repository.updateOption(optionId, input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'Attribute name, slug, or option name already exists',
        notFound: 'Attribute or option not found',
      });
    }
  }

  async removeOption(attributeId: string, optionId: string) {
    const option = await this.repository.findOption(attributeId, optionId);
    if (!option) throw new NotFoundException('Attribute option not found');
    await this.repository.updateOption(optionId, {
      deletedAt: new Date(),
      isPublished: false,
    });
    return { deleted: true };
  }

  private async requireActive(id: string) {
    const attribute = await this.repository.findById(id);
    if (!attribute || attribute.deletedAt)
      throw new NotFoundException('Attribute not found');
    return attribute;
  }
}
