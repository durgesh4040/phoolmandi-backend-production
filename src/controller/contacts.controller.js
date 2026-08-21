import { db } from "../configuration/db.js";
import { contacts } from "../db/schema/contact.js";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";


// ==============> Create Contact <============
export async function createContacts(req, res, next) {
    try {
        const {
            name,
            email,
            phone,
            message
        } = req.body;

        const [contact] = await db
            .insert(contacts)
            .values({
                name,
                email,
                phone,
                message,
                createdBy: req.user?.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return res.status(201).json({
            status: "success",
            message: res.__("contacts.create") || "Contacts created successfully",
            data: contact,
        });
    } catch (error) {
        next(error);
    }
}

// ==============> Update Contact <============
export async function updateContacts(req, res, next) {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            phone,
            message,
        } = req.body;

        const [contact] = await db
            .update(contacts)
            .set({
                name,
                email,
                phone,
                message,
                updatedAt: new Date(),
            })
            .where(eq(contacts.id, Number(id)))
            .returning();

        return res.status(200).json({
            status: "success",
            message: res.__("contacts.update") || "Contacts updated successfully",
            data: contact,
        });
    } catch (error) {
        next(error);
    }
}

// ==============> Delete Contact <============
export async function deleteContacts(req, res, next) {
    try {
        const { id } = req.params;

        const [contact] = await db
            .delete(contacts)
            .where(eq(contacts.id, Number(id)))
            .returning();

        return res.status(200).json({
            status: "success",
            message: res.__("contacts.delete") || "Contacts deleted successfully",
            data: contact,
        });
    } catch (error) {
        next(error);
    }
}

// ==============> Get All Contacts <============
export async function getAllContacts(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query?.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
        const offset = (page - 1) * limit;

        const conditions = [];

        // Search filter
        if (req.query?.search) {
            const searchTerm = `%${req.query.search}%`;
            conditions.push(
                or(
                    like(contacts.name, searchTerm),
                    like(contacts.email, searchTerm),
                    like(contacts.phone, searchTerm)
                )
            );
        }

        // Soft delete filter (exclude deleted users by default)
        if (req.query?.includeDeleted !== "true") {
            conditions.push(sql`${contacts.deletedAt} IS NULL`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Sorting
        let orderBy = [desc(contacts.createdAt)];
        if (req.query?.sortBy) {
            const sortColumn = contacts[req.query.sortBy];
            if (sortColumn) {
                const order = req.query?.order === "asc" ? asc : desc;
                orderBy = [order(sortColumn)];
            }
        }

        // Execute count and query in parallel
        const [contactsList, totalCount] = await Promise.all([
            db
                .select()
                .from(contacts)
                .where(whereClause)
                .orderBy(...orderBy)
                .limit(limit)
                .offset(offset),
            db
                .select({ count: sql`count(*)` })
                .from(contacts)
                .where(whereClause)
                .then(result => parseInt(result[0].count))
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            status: "success",
            message: "Contacts fetched successfully",
            data: contactsList,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        next(error);
    }
}

// ==============> Get Contact By ID <============
export async function getContactById(req, res, next) {
    try {
        const { id } = req.params;

        const [contact] = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, Number(id)))
            .limit(1);

        if (!contact) {
            return res.status(404).json({
                status: "error",
                message: "Contact not found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Contact fetched successfully",
            data: contact
        });
    } catch (error) {
        next(error);
    }
}
