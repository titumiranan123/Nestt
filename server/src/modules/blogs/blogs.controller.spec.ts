import { describe, expect, it, vi } from 'vitest';
import type { BlogsService } from './blogs.service.js';
import { BlogsAdminController } from './blogs-admin.controller.js';
import { BlogsController } from './blogs.controller.js';

describe('BlogsController', () => {
  it('delegates public list, category, policy, footer, and detail reads', async () => {
    const blogs = {
      listPublic: vi.fn(),
      listPublicCategories: vi.fn(),
      listPublicTags: vi.fn(),
      getPolicies: vi.fn(),
      getFooter: vi.fn(),
      getPublic: vi.fn(),
    };
    const controller = new BlogsController(blogs as unknown as BlogsService);
    const query = { page: 1, limit: 10, sort: 'newest' } as never;
    await controller.list(query);
    await controller.categories();
    await controller.tags();
    await controller.policies();
    await controller.footer();
    await controller.get('welcome');
    expect(blogs.listPublic).toHaveBeenCalledWith(query);
    expect(blogs.listPublicCategories).toHaveBeenCalledOnce();
    expect(blogs.listPublicTags).toHaveBeenCalledOnce();
    expect(blogs.getPolicies).toHaveBeenCalledOnce();
    expect(blogs.getFooter).toHaveBeenCalledOnce();
    expect(blogs.getPublic).toHaveBeenCalledWith('welcome');
  });
});

describe('BlogsAdminController', () => {
  it('delegates blog, category, tag, footer, and policy management', async () => {
    const blogs = {
      listAdmin: vi.fn(),
      getAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      listCategories: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      removeCategory: vi.fn(),
      listTags: vi.fn(),
      createTag: vi.fn(),
      updateTag: vi.fn(),
      removeTag: vi.fn(),
      getFooter: vi.fn(),
      saveFooter: vi.fn(),
      getPolicies: vi.fn(),
      savePolicy: vi.fn(),
    };
    const controller = new BlogsAdminController(
      blogs as unknown as BlogsService,
    );
    const query = { page: 1, limit: 10, sort: 'newest' } as never;
    const blog = { title: 'Hello', slug: 'hello', content: 'Content' } as never;
    const category = { name: 'Guides', slug: 'guides' } as never;
    const tag = { name: 'Tips', slug: 'tips' } as never;
    const footer = { copyrightInfo: '©', shortDescription: 'Store' } as never;
    const policy = { key: 'policy_terms', value: 'Terms' } as never;
    const request = { authUserId: 'author-1' } as never;
    await controller.listBlogs(query);
    await controller.getBlog('hello');
    await controller.createBlog(blog, request);
    await controller.updateBlog('b1', blog);
    await controller.removeBlog('b1');
    await controller.listCategories();
    await controller.createCategory(category);
    await controller.updateCategory('c1', category);
    await controller.removeCategory('c1');
    await controller.listTags();
    await controller.createTag(tag);
    await controller.updateTag('t1', tag);
    await controller.removeTag('t1');
    await controller.getFooter();
    await controller.saveFooter(footer);
    await controller.getPolicies();
    await controller.savePolicy(policy);
    expect(blogs.listAdmin).toHaveBeenCalledWith(query);
    expect(blogs.getAdmin).toHaveBeenCalledWith('hello');
    expect(blogs.create).toHaveBeenCalledWith(blog, 'author-1');
    expect(blogs.update).toHaveBeenCalledWith('b1', blog);
    expect(blogs.remove).toHaveBeenCalledWith('b1');
    expect(blogs.createCategory).toHaveBeenCalledWith(category);
    expect(blogs.createTag).toHaveBeenCalledWith(tag);
    expect(blogs.saveFooter).toHaveBeenCalledWith(footer);
    expect(blogs.savePolicy).toHaveBeenCalledWith(policy);
  });
});
