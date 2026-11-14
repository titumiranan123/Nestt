-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'REGISTER', 'CREATE', 'UPDATE', 'DELETE', 'READ', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'ACCESS_DENIED', 'SUSPEND', 'BAN', 'ACTIVATE');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('DROPDOWN');

-- CreateEnum
CREATE TYPE "UseEnvironment" AS ENUM ('indoor', 'outdoor');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('active', 'inactive', 'draft');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PREORDER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('product', 'image', 'video');

-- CreateEnum
CREATE TYPE "SpecificationItemType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('CORRECTION', 'RESTOCK', 'DAMAGE', 'RETURN', 'SALE');

-- CreateEnum
CREATE TYPE "PriceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'PHONE', 'POS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'SSL_COMMERZ');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "RemarkType" AS ENUM ('NOTE', 'CALL');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ANSWERED', 'NO_ANSWER', 'BUSY');

-- CreateEnum
CREATE TYPE "TrackingSource" AS ENUM ('SYSTEM', 'ADMIN', 'COURIER');

-- CreateEnum
CREATE TYPE "CourierSubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "CourierType" AS ENUM ('IN_HOUSE', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "CourierProviderCode" AS ENUM ('MANUAL');

-- CreateEnum
CREATE TYPE "DeliveryZone" AS ENUM ('INSIDE_DHAKA', 'OUTSIDE_DHAKA');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320),
    "passwordHash" TEXT,
    "phone" VARCHAR(20),
    "role" "RoleEnum" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role" "RoleEnum" NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "grantedById" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "targetId" UUID,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_meta" (
    "id" UUID NOT NULL,
    "pageName" VARCHAR(50) NOT NULL,
    "metaTitle" VARCHAR(255) NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "metaKeywords" TEXT,
    "canonicalUrl" VARCHAR(255),
    "metaRobots" VARCHAR(50),
    "schema" TEXT,
    "twitterCardType" VARCHAR(50),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_robots" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "updatedBy" VARCHAR(100),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "site_robots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_sitemap" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "updatedBy" VARCHAR(100),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "site_sitemap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "reading_time_min" INTEGER,
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "category_id" UUID,
    "author_id" UUID NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tag_maps" (
    "blog_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "blog_tag_maps_pkey" PRIMARY KEY ("blog_id","tag_id")
);

-- CreateTable
CREATE TABLE "blog_images" (
    "id" UUID NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "alt" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "blog_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_settings" (
    "id" UUID NOT NULL,
    "facebook_url" TEXT,
    "messenger_url" TEXT,
    "youtube_url" TEXT,
    "twitter_url" TEXT,
    "tiktok_url" TEXT,
    "linkedin_url" TEXT,
    "instagram_url" TEXT,
    "copyright_info" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "footer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "logo" VARCHAR(500),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" VARCHAR(160),
    "metaDescription" VARCHAR(320),
    "metaKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logo" VARCHAR(255),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isPopularCat" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" VARCHAR(160),
    "metaDescription" VARCHAR(320),
    "metaKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attributes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "type" "AttributeType" NOT NULL DEFAULT 'DROPDOWN',
    "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "showInFilter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_options" (
    "id" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500),
    "image" VARCHAR(500),
    "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attribute_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" UUID NOT NULL,
    "brandId" UUID,
    "description" TEXT,
    "useEnvironment" "UseEnvironment" NOT NULL DEFAULT 'indoor',
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isContractGrade" BOOLEAN NOT NULL DEFAULT false,
    "isCustomizable" BOOLEAN NOT NULL DEFAULT false,
    "isPriceOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "customizableTextNote" TEXT,
    "assemblyRequired" BOOLEAN NOT NULL DEFAULT true,
    "assemblyDuration" INTEGER,
    "assemblyPdfUrl" TEXT,
    "guaranteeDays" INTEGER,
    "guaranteeLabel" TEXT,
    "guaranteeUrl" TEXT,
    "avgRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "VariantStatus" NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlertQty" INTEGER NOT NULL DEFAULT 5,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "price" DECIMAL(10,2) NOT NULL,
    "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    "costPrice" DECIMAL(10,2),
    "requiresWhiteGlove" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantOption" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "attributeOptionId" UUID NOT NULL,
    "displayValue" TEXT,
    "displayImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'product',
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "videoUrl" TEXT,
    "videoThumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specifications" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "variantId" UUID,
    "title" TEXT NOT NULL DEFAULT 'Specifications',
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specification_items" (
    "id" UUID NOT NULL,
    "specificationId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SpecificationItemType" NOT NULL DEFAULT 'TEXT',
    "href" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specification_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairWellWith" (
    "id" UUID NOT NULL,
    "sourceProductId" UUID NOT NULL,
    "pairedProductId" UUID NOT NULL,
    "heading" TEXT,
    "subheading" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PairWellWith_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "AdjustmentType" NOT NULL DEFAULT 'CORRECTION',
    "reason" VARCHAR(255),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_requests" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "productNameSnapshot" TEXT NOT NULL,
    "variantNameSnapshot" TEXT,
    "skuSnapshot" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "status" "PriceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "quotedPrice" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "supportNote" TEXT,
    "quotedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_products" (
    "collectionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_products_pkey" PRIMARY KEY ("collectionId","productId")
);

-- CreateTable
CREATE TABLE "collection_bundles" (
    "collectionId" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_bundles_pkey" PRIMARY KEY ("collectionId","bundleId")
);

-- CreateTable
CREATE TABLE "collection_bundle_categories" (
    "collectionId" UUID NOT NULL,
    "bundleCategoryId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_bundle_categories_pkey" PRIMARY KEY ("collectionId","bundleCategoryId")
);

-- CreateTable
CREATE TABLE "bundle_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "imageUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundles" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "subtitle" VARCHAR(500),
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "bundlePrice" DECIMAL(10,2) NOT NULL,
    "savings" DECIMAL(10,2),
    "discountPercent" DECIMAL(5,2),
    "saleBundlePrice" DECIMAL(10,2),
    "saleStartAt" TIMESTAMP(3),
    "saleEndAt" TIMESTAMP(3),
    "metaTitle" VARCHAR(255),
    "metaDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "bundleCategoryId" UUID NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "overridePrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_media" (
    "id" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'image',
    "url" VARCHAR(500) NOT NULL,
    "alt" VARCHAR(255),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productVariantId" UUID,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_votes" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "value" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "customerName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "designation" VARCHAR(120),
    "customerAvatar" VARCHAR(500),
    "coverImage" VARCHAR(500),
    "productName" VARCHAR(160),
    "title" VARCHAR(160),
    "experienceStory" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL DEFAULT 5,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlist_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "added_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" VARCHAR(100),
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "area" VARCHAR(100) NOT NULL,
    "addressLine" VARCHAR(500) NOT NULL,
    "postalCode" VARCHAR(20),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" UUID NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanas" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" UUID NOT NULL,
    "deliveryZone" "DeliveryZone" NOT NULL DEFAULT 'OUTSIDE_DHAKA',
    "shippingFee" DECIMAL(10,2),
    "isDeliverable" BOOLEAN NOT NULL DEFAULT true,
    "freeDeliveryAbove" DECIMAL(10,2),

    CONSTRAINT "thanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zone_configs" (
    "id" UUID NOT NULL,
    "zone" "DeliveryZone" NOT NULL,
    "flatFee" DECIMAL(10,2) NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "minOrderFree" DECIMAL(10,2),
    "estimatedDaysMin" INTEGER,
    "estimatedDaysMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "delivery_zone_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" UUID NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "area" VARCHAR(100) NOT NULL,
    "charge" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_code" VARCHAR(100) NOT NULL,
    "user_id" UUID,
    "address_id" UUID,
    "sub_total" DECIMAL(12,2) NOT NULL,
    "shipping_charge" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "order_source" "OrderSource" NOT NULL DEFAULT 'ONLINE',
    "shipping_name" VARCHAR(100) NOT NULL,
    "shipping_phone" VARCHAR(20) NOT NULL,
    "shipping_region" VARCHAR(100) NOT NULL,
    "shipping_city" VARCHAR(100) NOT NULL,
    "shipping_area" VARCHAR(100) NOT NULL,
    "shipping_address" VARCHAR(500) NOT NULL,
    "cancel_reason" VARCHAR(500),
    "notes" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "courierAssignedAt" TIMESTAMP(3),
    "courierConsignmentId" TEXT,
    "courierLastSyncedAt" TIMESTAMP(3),
    "courierStatus" TEXT,
    "courierTrackingCode" TEXT,
    "courierProviderId" UUID,
    "courierSubmissionStatus" "CourierSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "guest_phone" VARCHAR(20),
    "guest_email" VARCHAR(255),
    "guest_session_id" VARCHAR(255),
    "shipping_postal_code" VARCHAR(20),
    "billing_same_as_shipping" BOOLEAN NOT NULL DEFAULT true,
    "billing_name" VARCHAR(100),
    "billing_phone" VARCHAR(20),
    "billing_region" VARCHAR(100),
    "billing_city" VARCHAR(100),
    "billing_area" VARCHAR(100),
    "billing_address" VARCHAR(500),
    "billing_postal_code" VARCHAR(20),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "stock_reserved" BOOLEAN NOT NULL DEFAULT true,
    "variant_id" UUID,
    "product_name" VARCHAR(255) NOT NULL,
    "variant_name" VARCHAR(255),
    "sku" VARCHAR(100),
    "image" VARCHAR(500),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_returns" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "reason" VARCHAR(500),
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_remarks" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "type" "RemarkType" NOT NULL DEFAULT 'NOTE',
    "note" VARCHAR(1000),
    "callStatus" "CallStatus",
    "calledAt" TIMESTAMP(6),
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_histories" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changedBy" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "source" "TrackingSource" NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
    "is_emi" BOOLEAN NOT NULL DEFAULT false,
    "emi_bank" VARCHAR(100),
    "emi_interest" DECIMAL(5,2),
    "emi_months" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_configs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ssl_configs" (
    "id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_pass" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "payment_config_id" UUID NOT NULL,

    CONSTRAINT "ssl_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "gateway_transaction_id" TEXT,
    "status" "TransactionStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
    "raw_response" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" VARCHAR(500),
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "processed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_resource_key" ON "permissions"("action", "resource");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_permissions_permissionId_idx" ON "user_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "seo_meta_pageName_key" ON "seo_meta"("pageName");

-- CreateIndex
CREATE INDEX "seo_meta_pageName_idx" ON "seo_meta"("pageName");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_is_visible_display_order_idx" ON "blog_categories"("is_visible", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_status_published_at_idx" ON "blogs"("status", "published_at");

-- CreateIndex
CREATE INDEX "blogs_category_id_idx" ON "blogs"("category_id");

-- CreateIndex
CREATE INDEX "blogs_author_id_idx" ON "blogs"("author_id");

-- CreateIndex
CREATE INDEX "blog_tag_maps_tag_id_idx" ON "blog_tag_maps"("tag_id");

-- CreateIndex
CREATE INDEX "blog_images_blog_id_sort_order_idx" ON "blog_images"("blog_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_key_key" ON "store_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_isPublished_idx" ON "brands"("isPublished");

-- CreateIndex
CREATE INDEX "brands_verified_isPublished_idx" ON "brands"("verified", "isPublished");

-- CreateIndex
CREATE INDEX "brands_deletedAt_idx" ON "brands"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_isPublished_idx" ON "categories"("isPublished");

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_name_key" ON "attributes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attributes_slug_key" ON "attributes"("slug");

-- CreateIndex
CREATE INDEX "attributes_deletedAt_idx" ON "attributes"("deletedAt");

-- CreateIndex
CREATE INDEX "attribute_options_attributeId_idx" ON "attribute_options"("attributeId");

-- CreateIndex
CREATE INDEX "attribute_options_isPublished_idx" ON "attribute_options"("isPublished");

-- CreateIndex
CREATE INDEX "attribute_options_deletedAt_idx" ON "attribute_options"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_options_attributeId_name_key" ON "attribute_options"("attributeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_slug_key" ON "product_variants"("slug");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_price_idx" ON "product_variants"("price");

-- CreateIndex
CREATE INDEX "product_variants_productId_price_idx" ON "product_variants"("productId", "price");

-- CreateIndex
CREATE INDEX "product_variants_isOnSale_idx" ON "product_variants"("isOnSale");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_status_idx" ON "product_variants"("status");

-- CreateIndex
CREATE INDEX "product_variants_stockStatus_idx" ON "product_variants"("stockStatus");

-- CreateIndex
CREATE INDEX "product_variants_slug_idx" ON "product_variants"("slug");

-- CreateIndex
CREATE INDEX "ProductVariantOption_variantId_idx" ON "ProductVariantOption"("variantId");

-- CreateIndex
CREATE INDEX "ProductVariantOption_attributeOptionId_idx" ON "ProductVariantOption"("attributeOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOption_variantId_attributeId_key" ON "ProductVariantOption"("variantId", "attributeId");

-- CreateIndex
CREATE INDEX "ProductMedia_variantId_idx" ON "ProductMedia"("variantId");

-- CreateIndex
CREATE INDEX "ProductMedia_type_idx" ON "ProductMedia"("type");

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_productId_key" ON "product_specifications"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_variantId_key" ON "product_specifications"("variantId");

-- CreateIndex
CREATE INDEX "product_specifications_productId_idx" ON "product_specifications"("productId");

-- CreateIndex
CREATE INDEX "product_specifications_variantId_idx" ON "product_specifications"("variantId");

-- CreateIndex
CREATE INDEX "specification_items_specificationId_idx" ON "specification_items"("specificationId");

-- CreateIndex
CREATE INDEX "PairWellWith_sourceProductId_isActive_displayOrder_idx" ON "PairWellWith"("sourceProductId", "isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "PairWellWith_pairedProductId_idx" ON "PairWellWith"("pairedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PairWellWith_sourceProductId_pairedProductId_key" ON "PairWellWith"("sourceProductId", "pairedProductId");

-- CreateIndex
CREATE INDEX "stock_adjustments_variantId_idx" ON "stock_adjustments"("variantId");

-- CreateIndex
CREATE INDEX "stock_adjustments_type_idx" ON "stock_adjustments"("type");

-- CreateIndex
CREATE INDEX "stock_adjustments_createdAt_idx" ON "stock_adjustments"("createdAt");

-- CreateIndex
CREATE INDEX "stock_adjustments_createdBy_idx" ON "stock_adjustments"("createdBy");

-- CreateIndex
CREATE INDEX "price_requests_productId_idx" ON "price_requests"("productId");

-- CreateIndex
CREATE INDEX "price_requests_variantId_idx" ON "price_requests"("variantId");

-- CreateIndex
CREATE INDEX "price_requests_status_idx" ON "price_requests"("status");

-- CreateIndex
CREATE INDEX "price_requests_phone_idx" ON "price_requests"("phone");

-- CreateIndex
CREATE INDEX "price_requests_createdAt_idx" ON "price_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_isActive_idx" ON "collections"("isActive");

-- CreateIndex
CREATE INDEX "collections_slug_idx" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collection_products_productId_idx" ON "collection_products"("productId");

-- CreateIndex
CREATE INDEX "collection_bundles_bundleId_idx" ON "collection_bundles"("bundleId");

-- CreateIndex
CREATE INDEX "collection_bundles_collectionId_isActive_sortOrder_idx" ON "collection_bundles"("collectionId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "collection_bundle_categories_bundleCategoryId_idx" ON "collection_bundle_categories"("bundleCategoryId");

-- CreateIndex
CREATE INDEX "collection_bundle_categories_collectionId_isActive_sortOrde_idx" ON "collection_bundle_categories"("collectionId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_categories_slug_key" ON "bundle_categories"("slug");

-- CreateIndex
CREATE INDEX "bundle_categories_isActive_idx" ON "bundle_categories"("isActive");

-- CreateIndex
CREATE INDEX "bundle_categories_slug_idx" ON "bundle_categories"("slug");

-- CreateIndex
CREATE INDEX "bundle_categories_isActive_sortOrder_idx" ON "bundle_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "bundles_sku_key" ON "bundles"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "bundles_slug_key" ON "bundles"("slug");

-- CreateIndex
CREATE INDEX "bundles_bundleCategoryId_idx" ON "bundles"("bundleCategoryId");

-- CreateIndex
CREATE INDEX "bundles_isPublished_idx" ON "bundles"("isPublished");

-- CreateIndex
CREATE INDEX "bundles_isOnSale_idx" ON "bundles"("isOnSale");

-- CreateIndex
CREATE INDEX "bundles_slug_idx" ON "bundles"("slug");

-- CreateIndex
CREATE INDEX "bundles_isFeatured_idx" ON "bundles"("isFeatured");

-- CreateIndex
CREATE INDEX "bundles_isAvailable_idx" ON "bundles"("isAvailable");

-- CreateIndex
CREATE INDEX "bundles_bundleCategoryId_isPublished_idx" ON "bundles"("bundleCategoryId", "isPublished");

-- CreateIndex
CREATE INDEX "bundles_isPublished_isActive_deletedAt_idx" ON "bundles"("isPublished", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "bundles_deletedAt_idx" ON "bundles"("deletedAt");

-- CreateIndex
CREATE INDEX "bundle_items_bundleId_idx" ON "bundle_items"("bundleId");

-- CreateIndex
CREATE INDEX "bundle_items_variantId_idx" ON "bundle_items"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_items_bundleId_variantId_key" ON "bundle_items"("bundleId", "variantId");

-- CreateIndex
CREATE INDEX "bundle_media_bundleId_idx" ON "bundle_media"("bundleId");

-- CreateIndex
CREATE INDEX "bundle_media_bundleId_isPrimary_idx" ON "bundle_media"("bundleId", "isPrimary");

-- CreateIndex
CREATE INDEX "bundle_media_bundleId_position_idx" ON "bundle_media"("bundleId", "position");

-- CreateIndex
CREATE INDEX "reviews_productId_idx" ON "reviews"("productId");

-- CreateIndex
CREATE INDEX "reviews_orderId_idx" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_productId_key" ON "reviews"("userId", "productId");

-- CreateIndex
CREATE INDEX "review_images_reviewId_idx" ON "review_images"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_votes_reviewId_userId_key" ON "review_votes"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "testimonials_isApproved_isFeatured_displayOrder_idx" ON "testimonials"("isApproved", "isFeatured", "displayOrder");

-- CreateIndex
CREATE INDEX "testimonials_createdAt_idx" ON "testimonials"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlist_items_variant_id_idx" ON "wishlist_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_variant_id_key" ON "wishlist_items"("wishlist_id", "variant_id");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE INDEX "addresses_userId_isDefaultShipping_idx" ON "addresses"("userId", "isDefaultShipping");

-- CreateIndex
CREATE INDEX "addresses_userId_isDefaultBilling_idx" ON "addresses"("userId", "isDefaultBilling");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");

-- CreateIndex
CREATE INDEX "districts_divisionId_idx" ON "districts"("divisionId");

-- CreateIndex
CREATE INDEX "thanas_districtId_idx" ON "thanas"("districtId");

-- CreateIndex
CREATE INDEX "thanas_deliveryZone_idx" ON "thanas"("deliveryZone");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zone_configs_zone_key" ON "delivery_zone_configs"("zone");

-- CreateIndex
CREATE INDEX "shipping_rates_isActive_idx" ON "shipping_rates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rates_region_city_area_key" ON "shipping_rates"("region", "city", "area");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_code_key" ON "orders"("order_code");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_guest_phone_idx" ON "orders"("guest_phone");

-- CreateIndex
CREATE INDEX "orders_guest_email_idx" ON "orders"("guest_email");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_order_source_idx" ON "orders"("order_source");

-- CreateIndex
CREATE INDEX "orders_courierProviderId_idx" ON "orders"("courierProviderId");

-- CreateIndex
CREATE INDEX "orders_courierProviderId_courierConsignmentId_idx" ON "orders"("courierProviderId", "courierConsignmentId");

-- CreateIndex
CREATE INDEX "orders_courierTrackingCode_idx" ON "orders"("courierTrackingCode");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_guest_session_id_idx" ON "orders"("guest_session_id");

-- CreateIndex
CREATE INDEX "orders_courierSubmissionStatus_idx" ON "orders"("courierSubmissionStatus");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE INDEX "order_returns_orderId_idx" ON "order_returns"("orderId");

-- CreateIndex
CREATE INDEX "order_remarks_orderId_idx" ON "order_remarks"("orderId");

-- CreateIndex
CREATE INDEX "order_remarks_type_idx" ON "order_remarks"("type");

-- CreateIndex
CREATE INDEX "order_remarks_createdBy_idx" ON "order_remarks"("createdBy");

-- CreateIndex
CREATE INDEX "order_status_histories_orderId_idx" ON "order_status_histories"("orderId");

-- CreateIndex
CREATE INDEX "order_status_histories_source_idx" ON "order_status_histories"("source");

-- CreateIndex
CREATE INDEX "order_status_histories_isPublic_idx" ON "order_status_histories"("isPublic");

-- CreateIndex
CREATE INDEX "order_status_histories_changedBy_idx" ON "order_status_histories"("changedBy");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- CreateIndex
CREATE UNIQUE INDEX "ssl_configs_payment_config_id_key" ON "ssl_configs"("payment_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_gateway_transaction_id_key" ON "transactions"("gateway_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_payment_id_idx" ON "transactions"("payment_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "refunds"("order_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tag_maps" ADD CONSTRAINT "blog_tag_maps_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_tag_maps" ADD CONSTRAINT "blog_tag_maps_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specification_items" ADD CONSTRAINT "specification_items_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "product_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairWellWith" ADD CONSTRAINT "PairWellWith_pairedProductId_fkey" FOREIGN KEY ("pairedProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairWellWith" ADD CONSTRAINT "PairWellWith_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_requests" ADD CONSTRAINT "price_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_requests" ADD CONSTRAINT "price_requests_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_bundles" ADD CONSTRAINT "collection_bundles_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_bundles" ADD CONSTRAINT "collection_bundles_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_bundle_categories" ADD CONSTRAINT "collection_bundle_categories_bundleCategoryId_fkey" FOREIGN KEY ("bundleCategoryId") REFERENCES "bundle_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_bundle_categories" ADD CONSTRAINT "collection_bundle_categories_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_bundleCategoryId_fkey" FOREIGN KEY ("bundleCategoryId") REFERENCES "bundle_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_media" ADD CONSTRAINT "bundle_media_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanas" ADD CONSTRAINT "thanas_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_remarks" ADD CONSTRAINT "order_remarks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_remarks" ADD CONSTRAINT "order_remarks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ssl_configs" ADD CONSTRAINT "ssl_configs_payment_config_id_fkey" FOREIGN KEY ("payment_config_id") REFERENCES "payment_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

