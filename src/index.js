import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import connection from './dbconnection/db.js';
import cors from 'cors';
import user from './router/user.routes.js';
import NodeCache from 'node-cache';
import indexRoutes from "./router/index.routes.js"
import i18n from 'i18n';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app=express();
app.use(express.json());
i18n.configure({
  locales: ['en', 'hi'],
  directory: path.join(__dirname, 'translation'),
  defaultLocale: 'en',
  objectNotation: true,
  queryParameter: 'lang'
});
app.use(i18n.init);
app.use(cors());
if (process.env.APP_ENV === "prod") {
  app.use("/",indexRoutes);
} else {
   app.use("/api",indexRoutes);
}

const otpCache = new NodeCache({ stdTTL: 300 }); 
app.listen(`${process.env.PORT}`,async ()=>{
    await  connection()
    console.log(`server port start ${process.env.PORT} `)
})