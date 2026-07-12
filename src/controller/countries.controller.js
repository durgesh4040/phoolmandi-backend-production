import { db } from "../configuration/db.js";
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

//======================> Create Countries <===============
export async function createCountry(req, res, next) {
    try {
        const body = {
            ...req.body,
            createdBy: req.user?.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const [data] = await db.insert(countries).values(body).returning();

        res.status(200).send({
            status: "success",
            message: res.__("countries.countriesCreate"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//========================> Update Countries By Id <===============
export async function updateCountry(req, res, next) {
    try {
        const body = {
            ...req.body,
            updatedBy: req.user?.id,
            updatedAt: new Date(),
        };

        const [existing] = await db
            .select({ id: countries.id })
            .from(countries)
            .where(eq(countries.id, Number(req.params.id)))
            .limit(1);

        if (!existing) {
            return res.status(404).send({
                status: "error",
                message: res.__("countries.noFound"),
            });
        }

        const [data] = await db
            .update(countries)
            .set(body)
            .where(eq(countries.id, Number(req.params.id)))
            .returning();

        res.status(200).send({
            status: "success",
            message: res.__("countries.countriesUpdate"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//========================> Update Countries Status By Id <==============
export async function updateCountryStatus(req, res, next) {
    try {
        const body = {
            status: req.body.status,
            updatedBy: req.user?.id,
            updatedAt: new Date(),
        };

        const [existing] = await db
            .select({ id: countries.id })
            .from(countries)
            .where(eq(countries.id, Number(req.params.id)))
            .limit(1);

        if (!existing) {
            return res.status(404).send({
                status: "error",
                message: res.__("countries.noFound"),
            });
        }

        const [data] = await db
            .update(countries)
            .set(body)
            .where(eq(countries.id, Number(req.params.id)))
            .returning();

        if (req.body.status === "Active") {
            return res.status(200).send({
                status: "success",
                message: res.__("countries.countriesActive"),
                data: data,
            });
        }

        if (req.body.status === "Inactive") {
            return res.status(200).send({
                status: "success",
                message: res.__("countries.countriesInActive"),
                data: data,
            });
        }

        res.status(200).send({
            status: "success",
            message: res.__("countries.updateCountriesStatus"),
            data: data,
        });
    } catch (error) {
        next(error);
    }
}

//=========================> Countries Listing Api <===============
export async function getCountries(req, res, next) {
    try {
        const limit = req.query?.limit ? Number(req.query.limit) : 10;
        const page = req.query?.page ? Number(req.query.page) : 1;
        const offset = (page - 1) * limit;
        const order = req.query?.order === "asc" ? asc : desc;
        const orderByCol =
            req.query?.orderBy === "name"
                ? countries.name
                : req.query?.orderBy === "dialCode"
                ? countries.dialCode
                : req.query?.orderBy === "status"
                ? countries.status
                : countries.id;

        const baseConditions = [
            inArray(countries.status, ["Active", "Inactive"]),
            isNull(countries.deletedAt),
        ];

        let searchConditions = [];
        let orderByClause = order(orderByCol);

        if (req.query?.search) {
            const searchTerm = String(req.query.search).trim();
            const searchTerms = searchTerm.split(" ").filter(Boolean);

            if (searchTerms.length > 1) {
                searchConditions = searchTerms.map((term) =>
                    or(
                        ilike(countries.name, `%${term}%`),
                        ilike(countries.dialCode, `%${term}%`)
                    )
                );
            } else {
                searchConditions.push(
                    or(
                        ilike(countries.name, `%${searchTerm}%`),
                        ilike(countries.dialCode, `%${searchTerm}%`)
                    )
                );
            }

            orderByClause = sql`CASE
                WHEN ${countries.name} = ${searchTerm} THEN 1
                WHEN ${countries.name} ILIKE ${searchTerm + "%"} THEN 2
                WHEN ${countries.dialCode} = ${searchTerm} THEN 3
                ELSE 5
            END`;
        }

        if (req.query?.status) {
            baseConditions.push(eq(countries.status, String(req.query.status)));
        }

        if (req.query?.where) {
            const extraWhere = req.query.where;
            for (const [key, value] of Object.entries(extraWhere)) {
                if (key === "name") baseConditions.push(ilike(countries.name, `%${value}%`));
                else if (key === "dialCode") baseConditions.push(ilike(countries.dialCode, `%${value}%`));
                else if (key === "code") baseConditions.push(ilike(countries.code, `%${value}%`));
            }
        }

        const whereClause = and(...baseConditions, ...searchConditions);

        const [{ value: total }] = await db
            .select({ value: count() })
            .from(countries)
            .where(whereClause);

        const rows = await db
            .select({
                id: countries.id,
                name: countries.name,
                dialCode: countries.dialCode,
                createdAt: countries.createdAt,
                status: countries.status,
            })
            .from(countries)
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
        console.log(error)
        next(error);
    }
}

//=========================> Countries Listing By Id <===============
export async function getCountryById(req, res, next) {
    try {
        const [data] = await db
            .select({
                id: countries.id,
                name: countries.name,
                dialCode: countries.dialCode,
                createdAt: countries.createdAt,
                status: countries.status,
            })
            .from(countries)
            .where(eq(countries.id, Number(req.params.id)));

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

//==========================> Delete Countries By Id <================
export async function deleteCountry(req, res, next) {
    try {
        const [data] = await db
            .update(countries)
            .set({ deletedAt: new Date() })
            .where(eq(countries.id, Number(req.params.id)))
            .returning();

        if (data) {
            res.status(200).send({
                status: "success",
                message: res.__("countries.countriesDelete"),
                data: data,
            });
        } else {
            res.status(404).send({
                status: "error",
                message: res.__("countries.noFound"),
                data: data,
            });
        }
    } catch (error) {
        next(error);
    }
}