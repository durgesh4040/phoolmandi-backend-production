import {router} from "express";
app.use("/lives",require("./live.routes"));
app.use("/seller",require("./seller.routes"));
app.use("/users",require("./user.routes"));
export default router;

