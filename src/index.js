import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import connection from './dbconnection/db.js';
import cors from 'cors';
import user from './router/user.routes.js';
import NodeCache from 'node-cache';
import index from "./router/"
const app=express();
app.use(express.json());
app.use(cors());

if (process.env.APP_ENV === "prod") {
  app.use("/",require("./routes/index.routes"));

} else {
   app.use("/api",require("./routes/index.routes"));
}

const otpCache = new NodeCache({ stdTTL: 300 }); 
app.listen(`${process.env.PORT}`,async ()=>{
 await  connection()
    console.log(`server port start ${process.env.PORT} `)
})