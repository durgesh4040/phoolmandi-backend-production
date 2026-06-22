import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { categories } from "../db/schema/categories.js";
import { db } from "../configuration/db.js";
import bcrypt from "bcrypt";

export async function createcategories(req, res, next) {
    try {
        const {
            name,
            slug,
            description,
            imageUrl,
            createdBy
        } = req.body;
        // createdBy=req.user.id;
        const [data] = await db
            .insert(categories)
            .values({
                name,
                slug,
                description,
                imageUrl,
                createdBy
            })
            .returning();

        res.status(201).send({
            status: "success",
            message: res.__("categories.create") || "Categories created successfully",
            data: data
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllCategories(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query?.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
        const offset = (page - 1) * limit;
        const conditions = [];
        if (req.query?.search) {
            const searchTerm = `%${req.query.search}%`;
            conditions.push(
                or(
                    like(categories.name, searchTerm),
                    like(categories.slug, searchTerm),
                    like(categories.description, searchTerm)
                )
            );
        }
        if (req.query?.status) {
            conditions.push(eq(categories.status, req.query.status));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        let orderBy = [desc(categories.createdAt)];
        if (req.query?.sortBy) {
            const sortColumn = categories[req.query.sortBy];
            if (sortColumn) {
                const order = req.query?.order === "asc" ? asc : desc;
                orderBy = [order(sortColumn)];
            }
        }
        const categoriesList = await db
            .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description: categories.description,
                imageUrl: categories.imageUrl,
                status: categories.status,
                createdAt: categories.createdAt,
                updatedAt: categories.updatedAt,
                createdBy: categories.createdBy,
                updatedBy: categories.updatedBy
            })
            .from(categories)
            .where(whereClause)
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);
        const countResult = await db
            .select({ count: sql`count(*)` })
            .from(categories)
            .where(whereClause);

        const totalCount = parseInt(countResult[0].count);
        const totalPages = Math.ceil(totalCount / limit);
        return res.status(200).send({
            status: "success",
            message: categoriesList.length > 0
                ? "Categories retrieved successfully"
                : "No categories found",
            data: categoriesList,
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

//===================> Get Single User Details <===========
export async function getCategoriesById(req, res, next) {
    try {
        const categoryId = Number(req.params.id);
        if (isNaN(categoryId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid category id",
            });
        }
        const [category] = await db
            .select()
            .from(categories)
            .where(
                and(
                    eq(categories.id, categoryId),
                    sql`${categories.deletedAt} IS NULL`
                )
            )
            .limit(1);
        if (!category) {
            return res.status(404).json({
                status: "error",
                message: "Category not found",
            });
        }
        return res.status(200).json({
            status: "success",
            data: category,
        });
    } catch (error) {
        next(error);
    }
}

//===================> Update User <===========
export async function updateCategories(req, res, next) {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid category Id"
            });
        }

        const updateData = { ...req.body };
        updateData.updatedAt = new Date();

        const [updatedCategory] = await db
            .update(categories)
            .set(updateData)
            .where(
                and(
                    eq(categories.id, categoryId),
                    sql`${categories.deletedAt} IS NULL`
                )
            )
            .returning({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description: categories.description,
                imageUrl: categories.imageUrl,
                createdBy: categories.createdBy,
                updatedBy: categories.updatedBy,
                createdAt: categories.createdAt,
                updatedAt: categories.updatedAt,
                deletedAt: categories.deletedAt
            });

        if (!updatedCategory) {
            return res.status(404).json({
                status: "error",
                message: "Categories not found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Categories updated successfully",
            data: updatedCategory
        });
    } catch (error) {
        next(error);
    }
}

//===================> Soft Delete User <===========
export async function deleteCategory(req, res, next) {
    try {
        const categoryId = parseInt(req.params.id);

        if (isNaN(categoryId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid Category Id"
            });
        }

        const [deletedCategory] = await db
            .update(categories)
            .set({
                deletedAt: new Date(),
                status: "Inactive",
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(categories.id, categoryId),
                    sql`${categories.deletedAt} IS NULL`
                )
            )
            .returning({
                id: categories.id,
                name: categories.name
            });

        if (!deletedCategory) {
            return res.status(404).json({
                status: "error",
                message: "Category not found or already deleted"
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Category deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}