// src/db/seed.ts
import { db } from "../configuration/db.js";
import { countries } from "./schema/countries.js";
import { states } from "./schema/states.js";
import { cities } from "./schema/cities.js";
import { Country, State, City } from "country-state-city";
import { eq, and } from "drizzle-orm";

async function seed() {
  const allCountries = Country.getAllCountries();
  await db.insert(countries).values(
    allCountries.map((c) => ({
      name: c.name,
      dialCode: c.phonecode,
      code: c.isoCode,
      flagUrl: c.flag,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  const allStates = State.getAllStates();
  const countryRows = await db.select().from(countries);
  const countryMap = new Map(countryRows.map((c) => [c.code, c.id]));

  await db.insert(states).values(
    allStates
      .map((s) => ({
        countryId: countryMap.get(s.countryCode),
        stateName: s.name,
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      .filter((s) => s.countryId !== undefined)
  );
  const allCities = City.getAllCities();
  const stateRows = await db
    .select({ id: states.id, stateName: states.stateName, countryCode: countries.code })
    .from(states)
    .innerJoin(countries, eq(states.countryId, countries.id));

  const stateMap = new Map(
    stateRows.map((s) => [`${s.countryCode}-${s.stateName}`, s.id])
  );

  const cityChunks = [];
  const chunkSize = 1000;
  const cityValues = allCities
    .map((c) => ({
      stateId: stateMap.get(`${c.countryCode}-${c.name}`) || stateMap.get(`${c.countryCode}-${c.stateCode}`),
      cityName: c.name,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    .filter((c) => c.stateId !== undefined);

  for (let i = 0; i < cityValues.length; i += chunkSize) {
    await db.insert(cities).values(cityValues.slice(i, i + chunkSize));
  }
  process.exit(0);
}

seed().catch((err) => {
  process.exit(1);
});