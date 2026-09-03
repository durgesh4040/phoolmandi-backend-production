import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import indexRoutes from "./router/index.routes.js";
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import morgan from 'morgan';
import { I18n } from "i18n";
import logger from './configuration/winston.js';
import { fileURLToPath } from 'url';

import configLocal from './configuration/config.local.js';
import configProd from './configuration/config.prod.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Body parsing (only once)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

export const i18n = new I18n({
  locales: ["en","hi"],
  directory: path.join(__dirname, "transaltion"),
  defaultLocale: "en",
  // enable object notation
  objectNotation: true,
  header: "locale",
});
app.use(i18n.init);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(cors());




// Logging
app.use(morgan("dev"));

app.use("/public", express.static(path.join(__dirname, "../public")));

// Cache control
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

app.set("etag", false);

app.get("/demo", (req, res) => {
  res.status(200).send({
    status: "success",
    message: "hello world"
  });
});
if (process.env.APP_ENV === "prod") {
  global.config = configProd;
  app.use("/", indexRoutes);
} else {
  global.config = configLocal;
  app.use("/api", indexRoutes);
}
if (process.env.APP_ENV === "prod") {
  global.config = configProd;
  app.use("/", indexRoutes);
} else {
  global.config = configLocal;
  app.use("/api", indexRoutes);
}

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).send({
    status: "error",
    message: err.message || err.code || "Internal server error",
    errorDetail: err
  });
});

app.listen(Number(process.env.PORT), () => {
  console.log(`server port start ${process.env.PORT}`);
});