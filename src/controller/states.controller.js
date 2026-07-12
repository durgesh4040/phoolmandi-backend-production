// src/controllers/states.controller.ts
import { db } from "../configuration/db.js";
import { states } from "../db/schema/states.js";
import { countries } from "../db/schema/countries.js";
import {
    eq,
    and,
    or,
    ilike,
    isNull,
    desc,
    asc,
    sql,
    count,
    inArray,
} from "drizzle-orm";

//=========================> Create State <=================
export async function createState(req, res, next) {
    try {
        const body = {
            ...req.body,
            createdBy: req.user?.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [data] = await db.insert(states).values(body).returning();

        res.status(201).send({
            status: "success",
            message: res.__("states.statesCreate"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//========================> Update State By Id <=============
export async function updateState(req, res, next) {
    try {
        const body = {
            ...req.body,
            updatedBy: req.user?.id,
            updatedAt: new Date(),
        };

        const [existing] = await db
            .select({ id: states.id })
            .from(states)
            .where(eq(states.id, Number(req.params.id)))
            .limit(1);

        if (!existing) {
            return res.status(404).send({
                status: "error",
                message: res.__("states.notFound"),
            });
        }

        const [data] = await db
            .update(states)
            .set(body)
            .where(eq(states.id, Number(req.params.id)))
            .returning();

        res.status(200).send({
            status: "success",
            message: res.__("states.statesUpdate"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//==========================> Update State Status By Id <=======
export async function updateStateStatus(req, res, next) {
    try {
        const body = {
            status: req.body.status,
            updatedBy: req.user?.id,
            updatedAt: new Date(),
        };

        const [existing] = await db
            .select({ id: states.id })
            .from(states)
            .where(eq(states.id, Number(req.params.id)))
            .limit(1);

        if (!existing) {
            return res.status(404).send({
                status: "error",
                message: res.__("states.notFound"),
            });
        }

        const [data] = await db
            .update(states)
            .set(body)
            .where(eq(states.id, Number(req.params.id)))
            .returning();

        if (req.body.status === "Active") {
            return res.status(200).send({
                status: "success",
                message: res.__("states.statesActive"),
                data: data,
            });
        }

        if (req.body.status === "Inactive") {
            return res.status(200).send({
                status: "success",
                message: res.__("states.statesInActive"),
                data: data,
            });
        }

        res.status(200).send({
            status: "success",
            message: res.__("states.statusUpdate"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//======================> States Listing Api <============
export async function getStates(req, res, next) {
    try {
        const limit = req.query?.limit ? Number(req.query.limit) : 10;
        const page = req.query?.page ? Number(req.query.page) : 1;
        const offset = (page - 1) * limit;
        const order = req.query?.order === "asc" ? asc : desc;
        const orderByCol =
            req.query?.orderBy === "stateName"
                ? states.stateName
                : req.query?.orderBy === "countryId"
                ? states.countryId
                : req.query?.orderBy === "status"
                ? states.status
                : states.id;

        const baseConditions = [
            inArray(states.status, ["Active", "Inactive"]),
            isNull(states.deletedAt),
        ];

        let searchConditions = [];
        let orderByClause = order(orderByCol);

        if (req.query?.search) {
            const searchTerm = String(req.query.search).trim();
            const searchTerms = searchTerm.split(" ").filter(Boolean);

            if (searchTerms.length > 1) {
                searchConditions = searchTerms.map((term) =>
                    or(
                        ilike(states.stateName, `%${term}%`),
                        ilike(countries.name, `%${term}%`)
                    )
                );
            } else {
                searchConditions.push(
                    or(
                        ilike(states.stateName, `%${searchTerm}%`),
                        ilike(countries.name, `%${searchTerm}%`)
                    )
                );
            }

            orderByClause = sql`CASE
                WHEN ${states.stateName} = ${searchTerm} THEN 1
                WHEN ${states.stateName} ILIKE ${searchTerm + "%"} THEN 2
                WHEN ${countries.name} = ${searchTerm} THEN 3
                ELSE 5
            END`;
        }

        if (req.query?.status) {
            baseConditions.push(eq(states.status, String(req.query.status)));
        }

        if (req.query?.where) {
            const extraWhere = req.query.where;
            for (const [key, value] of Object.entries(extraWhere)) {
                if (key === "countryId") baseConditions.push(eq(states.countryId, Number(value)));
                else if (key === "stateName") baseConditions.push(ilike(states.stateName, `%${value}%`));
            }
        }

        const whereClause = and(...baseConditions, ...searchConditions);

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(states)
            .leftJoin(countries, eq(states.countryId, countries.id))
            .where(whereClause);

        const rows = await db
            .select({
                id: states.id,
                countryId: states.countryId,
                stateName: states.stateName,
                createdAt: states.createdAt,
                status: states.status,
                country: {
                    id: countries.id,
                    name: countries.name,
                },
            })
            .from(states)
            .leftJoin(countries, eq(states.countryId, countries.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(orderByClause);

        res.status(200).send({
            status: "success",
            message: "",
            total: total,
            data: rows,
        });
    } catch (error) {
        next(error);
    }
}

//==================> Get States By Country Id <============
export async function getStatesByCountryId(req, res, next) {
    try {
        const limit = req.query?.limit ? Number(req.query.limit) : 10;
        const page = req.query?.page ? Number(req.query.page) : 1;
        const offset = (page - 1) * limit;
        const order = req.query?.order === "asc" ? asc : desc;
        const orderByCol =
            req.query?.orderBy === "stateName"
                ? states.stateName
                : req.query?.orderBy === "status"
                ? states.status
                : states.id;

        const baseConditions = [
            inArray(states.status, ["Active", "Inactive"]),
            isNull(states.deletedAt),
            eq(states.countryId, Number(req.params.countryId)),
        ];

        let searchConditions = [];

        if (req.query?.search) {
            const searchTerm = `%${String(req.query.search)}%`;
            searchConditions.push(
                or(
                    ilike(states.stateName, searchTerm),
                    ilike(states.status, searchTerm)
                )
            );
        }

        if (req.query?.status) {
            baseConditions.push(eq(states.status, String(req.query.status)));
        }

        if (req.query?.where) {
            const extraWhere = req.query.where;
            for (const [key, value] of Object.entries(extraWhere)) {
                if (key === "stateName") baseConditions.push(ilike(states.stateName, `%${value}%`));
            }
        }

        const whereClause = and(...baseConditions, ...searchConditions);

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(states)
            .leftJoin(countries, eq(states.countryId, countries.id))
            .where(whereClause);

        const rows = await db
            .select({
                id: states.id,
                countryId: states.countryId,
                stateName: states.stateName,
                createdAt: states.createdAt,
                status: states.status,
                country: {
                    id: countries.id,
                    name: countries.name,
                },
            })
            .from(states)
            .leftJoin(countries, eq(states.countryId, countries.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(order(orderByCol));

        res.status(200).send({
            status: "success",
            message: "",
            total: total,
            data: rows,
        });
    } catch (error) {
        next(error);
    }
}

//======================> Get States By Id <==============
export async function getStateById(req, res, next) {
    try {
        const [data] = await db
            .select({
                id: states.id,
                countryId: states.countryId,
                stateName: states.stateName,
                createdAt: states.createdAt,
                status: states.status,
                country: {
                    id: countries.id,
                    name: countries.name,
                },
            })
            .from(states)
            .leftJoin(countries, eq(states.countryId, countries.id))
            .where(eq(states.id, Number(req.params.id)));

        if (!data) {
            return res.status(404).send({
                status: "error",
                message: res.__("noData"),
                data: data,
            });
        }

        res.status(200).send({
            status: "success",
            message: "",
            data,
        });
    } catch (error) {
        next(error);
    }
}

//=====================> Delete States By Id <==============
export async function deleteState(req, res, next) {
    try {
        const [data] = await db
            .update(states)
            .set({ deletedAt: new Date() })
            .where(eq(states.id, Number(req.params.id)))
            .returning();

        if (data) {
            res.status(200).send({
                status: "success",
                message: res.__("states.statesDelete"),
                data: data,
            });
        } else {
            res.status(404).send({
                status: "error",
                message: res.__("states.notFound"),
                data: data,
            });
        }
    } catch (error) {
        next(error);
    }
}