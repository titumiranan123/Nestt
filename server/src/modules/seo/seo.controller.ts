import { Controller, Get, Header, Param } from '@nestjs/common';
import { SeoService } from './seo.service.js';

@Controller()
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('seo/meta/:pageName')
  getMeta(@Param('pageName') pageName: string) {
    return this.seo.getMeta(pageName);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  getRobots() {
    return this.seo.getRobotsContent();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  getSitemap() {
    return this.seo.getSitemapContent();
  }
}
