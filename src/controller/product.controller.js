import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { categories } from "../db/schema/categories.js";
import { flowers } from "../db/schema/flower.js";
import { db } from "../configuration/db.js";
import  slugify from "slugify"
import bcrypt from "bcrypt";

export async function createProducts(req, res, next) {
    try {
        const {
            name,
            categoryId,
            imageUrl,
            thumbnailUrl,
            shortDescription,
            description,
            price,
            compareAtPrice,
            stockQuantity,
            sku,
            metaTitle,
            metaDescription,
        } = req.body;

        let slug = slugify(name, { lower: true, strict: true });
        const existingProduct = await db
            .select()
            .from(flowers)
            .where(eq(flowers.slug, slug))
            .limit(1);
        if (existingProduct.length > 0) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        const [product] = await db
            .insert(flowers)
            .values({
                name,
                slug,
                categoryId: Number(categoryId),
                imageUrl:req.file ? global.config.productImageFilePath+"/"+req.file.filename:"",
                shortDescription,
                description,
                price: Number(price),
                compareAtPrice: compareAtPrice
                    ? Number(compareAtPrice)
                    : null,
                stockQuantity: Number(stockQuantity || 0),
                sku,
                metaTitle,
                metaDescription,
                createdBy: req.user?.id,
                updatedBy: req.user?.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return res.status(201).json({
            status: "success",
            message: res.__("categories.create") || "Categories created successfully",
            data: product,
        });
    } catch (error) {
        console.error("Error in createProducts:", error);
        next(error);
    }
}

export async function getAllProducts(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query?.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
        const offset = (page - 1) * limit;
        const conditions = [];
        let categorySearchActive = false;
        if (req.query?.search) {
            const searchTerm = `%${req.query.search}%`;
            conditions.push(
                or(
                    like(flowers.name, searchTerm),
                    like(flowers.description, searchTerm),
                    like(flowers.sku, searchTerm),
                    like(categories.name, searchTerm),
                    like(categories.slug, searchTerm),
                    like(categories.description, searchTerm)
                )
            );
            categorySearchActive = true;
        }
        if (req.query?.categoryId) {
            conditions.push(eq(categories.id, req.query.categoryId));
            categorySearchActive = true;
        }
        if (req.query?.categorySlug) {
            conditions.push(eq(categories.slug, req.query.categorySlug));
            categorySearchActive = true;
        }
        if (req.query?.status) {
            conditions.push(eq(products.status, req.query.status));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        let orderBy = [desc(flowers.createdAt)];
        if (req.query?.sortBy) {
            const sortColumn = flowers[req.query.sortBy] || categories[req.query.sortBy];
            if (sortColumn) {
                const order = req.query?.order === "asc" ? asc : desc;
                orderBy = [order(sortColumn)];
            }
        }
        const useInnerJoin = categorySearchActive;
        let query = db
            .select({
                id: flowers.id,
                name: flowers.name,
                description: flowers.description,
                price: flowers.price,
                sku: flowers.sku,
                stockQuantity: flowers.stockQuantity,
                imageUrl:flowers.imageUrl,
                categoryId: flowers.categoryId,
                createdAt: flowers.createdAt,
                updatedAt: flowers.updatedAt,
                createdBy: flowers.createdBy,
                updatedBy: flowers.updatedBy,
                category: {
                    id: categories.id,
                    name: categories.name,
                    slug: categories.slug,
                    description: categories.description,
                    imageUrl: categories.imageUrl,
                    status: categories.status,
                    createdAt: categories.createdAt
                }
            })
            .from(flowers);
        if (useInnerJoin) {
            query = query.innerJoin(categories, eq(flowers.categoryId, categories.id));
        } else {
            query = query.leftJoin(categories, eq(flowers.categoryId, categories.id));
        }
        const productsList = await query
            .where(whereClause)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);
        let countQuery = db
            .select({ count: sql`count(*)` })
            .from(flowers);

        if (useInnerJoin) {
            countQuery = countQuery.innerJoin(categories, eq(flowers.categoryId, categories.id));
        } else {
            countQuery = countQuery.leftJoin(categories, eq(flowers.categoryId, categories.id));
        }

        const countResult = await countQuery.where(whereClause);
        const totalCount = parseInt(countResult[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).send({
            status: "success",
            message: productsList.length > 0
                ? "Products retrieved successfully"
                : "No products found",
            meta: {
                joinUsed: useInnerJoin ? 'INNER JOIN' : 'LEFT JOIN',
                categorySearchActive: categorySearchActive,
                appliedFilters: {
                    search: req.query?.search || null,
                    categoryId: req.query?.categoryId || null,
                    categorySlug: req.query?.categorySlug || null,
                    status: req.query?.status || null,
                    categoryStatus: req.query?.categoryStatus || null
                }
            },
            data: productsList,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: totalCount,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                startIndex: offset + 1,
                endIndex: Math.min(offset + limit, totalCount)
            }
        });

    } catch (error) {
        next(error);
    }
}

export async function getAllProductsById(req, res, next) {
    try {
        const productId = Number(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid Product id",
            });
        }
        const [flowersData] = await db
            .select(
                {
                    id: flowers.id,
                    name: flowers.name,
                    slug: flowers.slug,
                    imageUrl: flowers.imageUrl,
                    thumbnailUrl: flowers.thumbnailUrl,
                    shortDescription: flowers.shortDescription,
                    description: flowers.description,
                    price: flowers.price,
                    compareAtPrice: flowers.compareAtPrice,
                    stockQuantity: flowers.stockQuantity,
                    sku: flowers.sku,
                    metaTitle: flowers.metaTitle,
                    metaDescription: flowers.metaDescription,
                    createdBy: flowers.createdBy,
                    updatedBy: flowers.updatedBy,
                    createdAt: flowers.createdAt,
                    updatedAt: flowers.updatedAt,
                    deletedAt: flowers.deletedAt,
                    category: {
                        id: categories.id,
                        name: categories.name,
                        slug: categories.slug
                    }
                }
            )
            .from(flowers)
            .leftJoin(categories, eq(flowers.categoryId, categories.id))
            .where(
                and(
                    eq(flowers.id, productId),
                    sql`${flowers.deletedAt} IS NULL`
                )
            )
            .limit(1);
        if (!flowers) {
            return res.status(404).json({
                status: "error",
                message: "Flowers not found",
            });
        }
        return res.status(200).json({
            status: "success",
            message:"",
            data: flowersData
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProducts(req, res, next) {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid product Id"
            });
        }
        const updateData = { ...req.body };
        updateData.updatedAt = new Date();
        const [updatedFlowers] = await db
            .update(flowers)
            .set(updateData)
            .where(
                and(
                    eq(flowers.id, productId),
                    sql`${categories.deletedAt} IS NULL`
                )
            )      

        if (!updatedFlowers) {
            return res.status(404).json({
                status: "error",
                message: "Flowers not found"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Flowers updated successfully",
            data:updateData
        });
    } catch (error) {
        next(error);
    }
}


export async function deleteProducts(req, res, next) {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({
                status: "error",
                message: "Product Id not found"
            });
        }
        const [productCategory] = await db
            .update(flowers)
            .set({
                deletedAt: new Date(),
                status: "Inactive",
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(products.id, productId),
                    sql`${categories.deletedAt} IS NULL`
                )
            )
        if (!productIdy) {
            return res.status(404).json({
                status: "error",
                message: "Product not found or already deleted"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Product deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}