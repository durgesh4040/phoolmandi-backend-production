// src/controllers/cities.controller.ts
import { db } from "../configuration/db.js";
import { cities } from "../db/schema/cities.js";
import { states } from "../db/schema/states.js";
import { countries } from "../db/schema/countries.js";
import {
  eq,
  and,
  or,
  like,
  ilike,
  isNull,
  desc,
  asc,
  sql,
  count,
  inArray,
} from "drizzle-orm";

//====================> Create City <==============
export async function createCity(req, res, next) {
  try {
    const body = {
      ...req.body,
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [data] = await db.insert(cities).values(body).returning();
    res.status(201).send({
      status: "success",
      message: res.__("cities.citiesCreate"),
      data: data,
    });
  } catch (error) {
    next(error);
  }
}

//====================> Update City By Id <=========
export async function updateCity(req, res, next) {
  try {
    const body = {
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, Number(req.params.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).send({
        status: "error",
        message: res.__("cities.notFound"),
      });
    }

    const [data] = await db
      .update(cities)
      .set(body)
      .where(eq(cities.id, Number(req.params.id)))
      .returning();

    res.status(200).send({
      status: "success",
      message: res.__("cities.citiesUpdate"),
      data: data,
    });
  } catch (error) {
    next(error);
  }
}

//=====================> Update City Status By Id <======
export async function updateCityStatus(req, res, next) {
  try {
    const body = {
      status: req.body.status,
      updatedBy: req.user?.id,
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, Number(req.params.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).send({
        status: "error",
        message: res.__("cities.notFound"),
      });
    }

    const [data] = await db
      .update(cities)
      .set(body)
      .where(eq(cities.id, Number(req.params.id)))
      .returning();

    if (req.body.status === "Active") {
      return res.status(200).send({
        status: "success",
        message: res.__("cities.citiesActive"),
        data: data,
      });
    }

    if (req.body.status === "Inactive") {
      return res.status(200).send({
        status: "success",
        message: res.__("cities.citiesInActive"),
        data: data,
      });
    }

    res.status(200).send({
      status: "success",
      message: res.__("cities.updateCitiesStatus"),
      data: data,
    });
  } catch (error) {
    next(error);
  }
}

//=====================> Get City Listing <=========
export async function getCities(req, res, next) {
  try {
    const limit = req.query?.limit ? Number(req.query.limit) : 10;
    const page = req.query?.page ? Number(req.query.page) : 1;
    const offset = (page - 1) * limit;
    const order = req.query?.order === "asc" ? asc : desc;
    const orderByCol =
      req.query?.orderBy === "cityName"
        ? cities.cityName
        : req.query?.orderBy === "stateId"
        ? cities.stateId
        : req.query?.orderBy === "status"
        ? cities.status
        : cities.id;

    // Base where: Active/Inactive only, not soft-deleted
    const baseConditions = [
      inArray(cities.status, ["Active", "Inactive"]),
      isNull(cities.deletedAt),
    ];

    let searchConditions = [];
    let orderByClause = order(orderByCol);

    if (req.query?.search) {
      const searchTerm = String(req.query.search).trim();
      const searchTerms = searchTerm.split(" ").filter(Boolean);

      if (searchTerms.length > 1) {
        // Multi-term: AND of ORs per term
        searchConditions = searchTerms.map((term) =>
          or(
            ilike(cities.cityName, `%${term}%`),
            ilike(cities.status, `%${term}%`),
            ilike(states.stateName, `%${term}%`),
            ilike(countries.name, `%${term}%`)
          )
        );
      } else {
        // Single-term: OR across all fields
        searchConditions.push(
          or(
            ilike(cities.cityName, `%${searchTerm}%`),
            ilike(cities.status, `%${searchTerm}%`),
            ilike(states.stateName, `%${searchTerm}%`),
            ilike(countries.name, `%${searchTerm}%`)
          )
        );
      }

      // Custom relevance ordering
      orderByClause = sql`CASE
        WHEN ${cities.cityName} = ${searchTerm} THEN 1
        WHEN ${cities.cityName} ILIKE ${searchTerm + "%"} THEN 2
        WHEN ${states.stateName} = ${searchTerm} THEN 3
        WHEN ${states.stateName} ILIKE ${searchTerm + "%"} THEN 4
        WHEN ${countries.name} = ${searchTerm} THEN 5
        WHEN ${countries.name} ILIKE ${searchTerm + "%"} THEN 6
        ELSE 7
      END`;
    }

    // Status filter
    if (req.query?.status) {
      baseConditions.push(eq(cities.status, String(req.query.status)));
    }

    // Extra where filters from query
    if (req.query?.where) {
      const extraWhere = req.query.where
      for (const [key, value] of Object.entries(extraWhere)) {
        if (key === "stateId") baseConditions.push(eq(cities.stateId, Number(value)));
        else if (key === "cityName") baseConditions.push(ilike(cities.cityName, `%${value}%`));
        // add more as needed
      }
    }

    const whereClause = and(...baseConditions, ...searchConditions);

    // Count query
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(whereClause);

    // Data query
    const rows = await db
      .select({
        id: cities.id,
        stateId: cities.stateId,
        cityName: cities.cityName,
        createdAt: cities.createdAt,
        status: cities.status,
        state: {
          id: states.id,
          countryId: states.countryId,
          stateName: states.stateName,
          country: {
            id: countries.id,
            name: countries.name,
          },
        },
      })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
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

//=====================> Get City Listing By State Id <=======
export async function getCityByStateId(req, res, next) {
  try {
    const limit = req.query?.limit ? Number(req.query.limit) : 10;
    const page = req.query?.page ? Number(req.query.page) : 1;
    const offset = (page - 1) * limit;
    const order = req.query?.order === "asc" ? asc : desc;
    const orderByCol =
      req.query?.orderBy === "cityName"
        ? cities.cityName
        : req.query?.orderBy === "status"
        ? cities.status
        : cities.id;

    const baseConditions = [
      inArray(cities.status, ["Active", "Inactive"]),
      isNull(cities.deletedAt),
      eq(cities.stateId, Number(req.params.stateId)),
    ];

    let searchConditions = [];

    if (req.query?.search) {
      const searchTerm = `%${String(req.query.search)}%`;
      searchConditions.push(
        or(
          ilike(cities.cityName, searchTerm),
          ilike(cities.status, searchTerm)
        )
      );
    }

    if (req.query?.status) {
      baseConditions.push(eq(cities.status, String(req.query.status)));
    }

    if (req.query?.where) {
      const extraWhere = req.query.where;
      for (const [key, value] of Object.entries(extraWhere)) {
        if (key === "cityName") baseConditions.push(ilike(cities.cityName, `%${value}%`));
      }
    }

    const whereClause = and(...baseConditions, ...searchConditions);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(whereClause);

    const rows = await db
      .select({
        id: cities.id,
        stateId: cities.stateId,
        cityName: cities.cityName,
        createdAt: cities.createdAt,
        status: cities.status,
        state: {
          id: states.id,
          countryId: states.countryId,
          stateName: states.stateName,
          country: {
            id: countries.id,
            name: countries.name,
          },
        },
      })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
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
    console.log(error);
    next(error);
  }
}

//====================> Get City By Id <============
export async function getCityById(req,res,next) {
  try {
    const [data] = await db
      .select({
        id: cities.id,
        stateId: cities.stateId,
        cityName: cities.cityName,
        createdAt: cities.createdAt,
        status: cities.status,
        state: {
          id: states.id,
          countryId: states.countryId,
          stateName: states.stateName,
          country: {
            id: countries.id,
            name: countries.name,
          },
        },
      })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(eq(cities.id, Number(req.params.id)));

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

//=====================> Delete City By Id <===========
export async function deleteCity(req,res,next) {
  try {
    const [data] = await db
      .update(cities)
      .set({ deletedAt: new Date() })
      .where(eq(cities.id, Number(req.params.id)))
      .returning();

    if (data) {
      res.status(200).send({
        status: "success",
        message: res.__("cities.citiesDelete"),
        data: data,
      });
    } else {
      res.status(404).send({
        status: "error",
        message: res.__("cities.notFound"),
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
}