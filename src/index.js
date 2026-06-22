import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import cors from 'cors';
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
app.get("/demo",async(req , res)=>{
  try{

    return res.status(200).send({
      status:"success",
      message:"hello world"
    })

  }catch(error){
    console.log(error)
  }
})

if (process.env.APP_ENV === "prod") {
  app.use("/",indexRoutes);
} else {
   app.use("/api",indexRoutes);
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    status: "error",
    message: err.message || "Internal server error"
  });
});

app.listen(`${process.env.PORT}`,async ()=>{
    console.log(`server port start ${process.env.PORT} `)
})