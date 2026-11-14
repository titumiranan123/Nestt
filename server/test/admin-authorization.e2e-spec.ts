import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { TokenService } from '../src/modules/auth/services/token.service.js';
import { CategoriesAdminController } from '../src/modules/categories/categories-admin.controller.js';
import { CategoriesService } from '../src/modules/categories/categories.service.js';
import { AttributesAdminController } from '../src/modules/attributes/attributes-admin.controller.js';
import { AttributesService } from '../src/modules/attributes/attributes.service.js';
import { OrdersAdminController } from '../src/modules/orders/orders-admin.controller.js';
import { OrdersController } from '../src/modules/orders/orders.controller.js';
import { OrdersService } from '../src/modules/orders/orders.service.js';
import { SeoAdminController } from '../src/modules/seo/seo-admin.controller.js';
import { SeoService } from '../src/modules/seo/seo.service.js';
import { BlogsAdminController } from '../src/modules/blogs/blogs-admin.controller.js';
import { BlogAdminGuard } from '../src/modules/blogs/blog-admin.guard.js';
import { BlogsService } from '../src/modules/blogs/blogs.service.js';
import { PaymentConfigAdminController } from '../src/modules/payments/payment-config-admin.controller.js';
import { PaymentConfigAdminGuard } from '../src/modules/payments/payment-config-admin.guard.js';
import { PaymentConfigService } from '../src/modules/payments/payment-config.service.js';

type Verb = 'get' | 'post' | 'put' | 'patch' | 'delete';
type ProtectedRoute = { name: string; verb: Verb; path: string; body?: object };

const uuidA = '00000000-0000-4000-8000-000000000001';
const uuidB = '00000000-0000-4000-8000-000000000002';
const routes: ProtectedRoute[] = [
  { name: 'orders list', verb: 'get', path: '/admin/orders' },
  { name: 'order detail', verb: 'get', path: `/admin/orders/${uuidA}` },
  {
    name: 'shipping rate list',
    verb: 'get',
    path: '/admin/orders/shipping-rates',
  },
  {
    name: 'shipping rate update',
    verb: 'put',
    path: '/admin/orders/shipping-rates',
    body: { region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '50' },
  },
  {
    name: 'order status update',
    verb: 'patch',
    path: `/admin/orders/${uuidA}/status`,
    body: { status: 'CONFIRMED' },
  },
  {
    name: 'payment update',
    verb: 'patch',
    path: `/admin/orders/${uuidA}/payment`,
    body: { status: 'PAID' },
  },
  {
    name: 'order remark',
    verb: 'post',
    path: `/admin/orders/${uuidA}/remarks`,
    body: { note: 'Reviewed' },
  },
  {
    name: 'return update',
    verb: 'patch',
    path: `/admin/orders/returns/${uuidA}`,
    body: { status: 'APPROVED' },
  },
  { name: 'categories list', verb: 'get', path: '/admin/categories' },
  {
    name: 'category create',
    verb: 'post',
    path: '/admin/categories',
    body: { name: 'Furniture', slug: 'furniture' },
  },
  {
    name: 'category update',
    verb: 'put',
    path: `/admin/categories/${uuidA}`,
    body: { name: 'Furniture' },
  },
  {
    name: 'category delete',
    verb: 'delete',
    path: `/admin/categories/${uuidA}`,
  },
  { name: 'attributes list', verb: 'get', path: '/admin/attributes' },
  {
    name: 'attribute create',
    verb: 'post',
    path: '/admin/attributes',
    body: { name: 'Color', slug: 'color' },
  },
  {
    name: 'attribute update',
    verb: 'put',
    path: `/admin/attributes/${uuidA}`,
    body: { name: 'Colour' },
  },
  {
    name: 'attribute delete',
    verb: 'delete',
    path: `/admin/attributes/${uuidA}`,
  },
  {
    name: 'attribute option create',
    verb: 'post',
    path: `/admin/attributes/${uuidA}/options`,
    body: { name: 'Blue' },
  },
  {
    name: 'attribute option update',
    verb: 'put',
    path: `/admin/attributes/${uuidA}/options/${uuidB}`,
    body: { name: 'Navy' },
  },
  {
    name: 'attribute option delete',
    verb: 'delete',
    path: `/admin/attributes/${uuidA}/options/${uuidB}`,
  },
  { name: 'SEO metadata list', verb: 'get', path: '/admin/seo/meta' },
  {
    name: 'SEO metadata create',
    verb: 'post',
    path: '/admin/seo/meta',
    body: { pageName: 'home', metaTitle: 'Home', metaDescription: 'Home page' },
  },
  {
    name: 'SEO metadata update',
    verb: 'put',
    path: '/admin/seo/meta/home',
    body: { metaTitle: 'Updated' },
  },
  { name: 'SEO metadata delete', verb: 'delete', path: '/admin/seo/meta/home' },
  {
    name: 'robots update',
    verb: 'put',
    path: '/admin/seo/robots',
    body: { content: 'User-agent: *' },
  },
  {
    name: 'sitemap update',
    verb: 'put',
    path: '/admin/seo/sitemap',
    body: { content: '<urlset />' },
  },
  { name: 'blogs list', verb: 'get', path: '/admin/blogs' },
  { name: 'blog detail', verb: 'get', path: '/admin/blogs/hello' },
  {
    name: 'blog create',
    verb: 'post',
    path: '/admin/blogs',
    body: { title: 'Hello', slug: 'hello', content: 'Body' },
  },
  {
    name: 'blog update',
    verb: 'put',
    path: `/admin/blogs/${uuidA}`,
    body: { title: 'Updated' },
  },
  { name: 'blog delete', verb: 'delete', path: `/admin/blogs/${uuidA}` },
  { name: 'blog categories list', verb: 'get', path: '/admin/blog-categories' },
  {
    name: 'blog category create',
    verb: 'post',
    path: '/admin/blog-categories',
    body: { name: 'Guides', slug: 'guides' },
  },
  {
    name: 'blog category update',
    verb: 'put',
    path: `/admin/blog-categories/${uuidA}`,
    body: { name: 'Manuals' },
  },
  {
    name: 'blog category delete',
    verb: 'delete',
    path: `/admin/blog-categories/${uuidA}`,
  },
  { name: 'blog tags list', verb: 'get', path: '/admin/blog-tags' },
  {
    name: 'blog tag create',
    verb: 'post',
    path: '/admin/blog-tags',
    body: { name: 'Ideas', slug: 'ideas' },
  },
  {
    name: 'blog tag update',
    verb: 'put',
    path: `/admin/blog-tags/${uuidA}`,
    body: { name: 'Advice' },
  },
  {
    name: 'blog tag delete',
    verb: 'delete',
    path: `/admin/blog-tags/${uuidA}`,
  },
  { name: 'footer settings read', verb: 'get', path: '/admin/footer-settings' },
  {
    name: 'footer settings update',
    verb: 'put',
    path: '/admin/footer-settings',
    body: { copyrightInfo: '©', shortDescription: 'Store' },
  },
  { name: 'policy settings read', verb: 'get', path: '/admin/policy-settings' },
  {
    name: 'policy settings update',
    verb: 'put',
    path: '/admin/policy-settings',
    body: { key: 'policy_terms', value: 'Terms' },
  },
  { name: 'payment settings read', verb: 'get', path: '/admin/payment-config' },
  {
    name: 'bKash settings update',
    verb: 'put',
    path: '/admin/payment-config/bkash',
    body: {},
  },
  {
    name: 'Nagad settings update',
    verb: 'put',
    path: '/admin/payment-config/nagad',
    body: {},
  },
  {
    name: 'SSL settings update',
    verb: 'put',
    path: '/admin/payment-config/ssl',
    body: {},
  },
];

const serviceMock = (methods: string[]) =>
  Object.fromEntries(methods.map((method) => [method, vi.fn()]));

describe('admin role authorization HTTP contracts', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const tokenService = {
      accessUser: vi.fn(async (token: string) => ({
        id: 'user-1',
        role: token === 'admin' ? RoleEnum.ADMIN : RoleEnum.CUSTOMER,
        status: 'ACTIVE',
      })),
    };
    const module = await Test.createTestingModule({
      controllers: [
        OrdersAdminController,
        OrdersController,
        CategoriesAdminController,
        AttributesAdminController,
        SeoAdminController,
        BlogsAdminController,
        PaymentConfigAdminController,
      ],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        BlogAdminGuard,
        PaymentConfigAdminGuard,
        Reflector,
        { provide: TokenService, useValue: tokenService },
        {
          provide: OrdersService,
          useValue: serviceMock([
            'listAll',
            'getMine',
            'cancelMine',
            'requestReturn',
            'getById',
            'listShippingRates',
            'saveShippingRate',
            'updateStatus',
            'updatePaymentStatus',
            'addRemark',
            'updateReturnStatus',
          ]),
        },
        {
          provide: CategoriesService,
          useValue: serviceMock(['listAll', 'create', 'update', 'remove']),
        },
        {
          provide: AttributesService,
          useValue: serviceMock([
            'listAll',
            'create',
            'update',
            'remove',
            'createOption',
            'updateOption',
            'removeOption',
          ]),
        },
        {
          provide: SeoService,
          useValue: serviceMock([
            'listMeta',
            'createMeta',
            'updateMeta',
            'deleteMeta',
            'saveRobots',
            'saveSitemap',
          ]),
        },
        {
          provide: BlogsService,
          useValue: serviceMock([
            'listAdmin',
            'getAdmin',
            'create',
            'update',
            'remove',
            'listCategories',
            'createCategory',
            'updateCategory',
            'removeCategory',
            'listTags',
            'createTag',
            'updateTag',
            'removeTag',
            'getFooter',
            'saveFooter',
            'getPolicies',
            'savePolicy',
          ]),
        },
        {
          provide: PaymentConfigService,
          useValue: serviceMock([
            'getSettings',
            'saveBkash',
            'saveNagad',
            'saveSsl',
          ]),
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it.each(routes)(
    '$name rejects CUSTOMER and permits ADMIN',
    async ({ verb, path, body }) => {
      const dispatch = (token: 'customer' | 'admin') => {
        const route = request(app.getHttpServer())
          [verb](path)
          .set('Authorization', `Bearer ${token}`);
        return body ? route.send(body) : route;
      };
      await dispatch('customer').expect(403);
      const response = await dispatch('admin');
      expect(response.status).toBeLessThan(400);
    },
  );

  it.each([
    [
      'admin order detail id',
      'get',
      `/admin/orders/not-a-uuid`,
      undefined,
      'admin',
    ],
    [
      'admin order status id',
      'patch',
      `/admin/orders/not-a-uuid/status`,
      { status: 'CONFIRMED' },
      'admin',
    ],
    [
      'admin order payment id',
      'patch',
      `/admin/orders/not-a-uuid/payment`,
      { status: 'PAID' },
      'admin',
    ],
    [
      'admin order remark id',
      'post',
      `/admin/orders/not-a-uuid/remarks`,
      { note: 'Review' },
      'admin',
    ],
    [
      'admin return id',
      'patch',
      `/admin/orders/returns/not-a-uuid`,
      { status: 'APPROVED' },
      'admin',
    ],
    [
      'admin category id',
      'put',
      '/admin/categories/not-a-uuid',
      { name: 'Updated' },
      'admin',
    ],
    [
      'admin attribute id',
      'put',
      '/admin/attributes/not-a-uuid',
      { name: 'Updated' },
      'admin',
    ],
    [
      'admin attribute option parent id',
      'post',
      '/admin/attributes/not-a-uuid/options',
      { name: 'Blue' },
      'admin',
    ],
    [
      'admin attribute option id',
      'delete',
      `/admin/attributes/${uuidA}/options/not-a-uuid`,
      undefined,
      'admin',
    ],
    [
      'admin blog id',
      'put',
      '/admin/blogs/not-a-uuid',
      { title: 'Updated' },
      'admin',
    ],
    [
      'admin blog category id',
      'delete',
      '/admin/blog-categories/not-a-uuid',
      undefined,
      'admin',
    ],
    [
      'admin blog tag id',
      'delete',
      '/admin/blog-tags/not-a-uuid',
      undefined,
      'admin',
    ],
    [
      'customer order detail id',
      'get',
      '/orders/not-a-uuid',
      undefined,
      'customer',
    ],
    [
      'customer cancel order id',
      'post',
      '/orders/not-a-uuid/cancel',
      {},
      'customer',
    ],
    [
      'customer return order id',
      'post',
      '/orders/not-a-uuid/returns',
      { itemId: uuidA },
      'customer',
    ],
  ] as const)(
    '%s returns 400 for a malformed UUID',
    async (_name, verb, path, body, role) => {
      const route = request(app.getHttpServer())
        [verb](path)
        .set('Authorization', `Bearer ${role}`);
      await (body ? route.send(body) : route).expect(400);
    },
  );
});
