import { Controller, Get, Param } from '@nestjs/common';
import { AttributesService } from './attributes.service.js';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributes: AttributesService) {}

  @Get()
  list() {
    return this.attributes.listPublished();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.attributes.getPublished(slug);
  }
}
