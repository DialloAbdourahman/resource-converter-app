import {
  CODE,
  errorHandler,
  NotFoundError,
  requireAuth,
} from "@daconverter/common-libs";
import express from "express";
import cookieParser from "cookie-parser";
import "express-async-errors";
import { resourceRouter } from "./routes/resourceRouter";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/resources", requireAuth, resourceRouter);

app.use("*", () => {
  throw new NotFoundError("Route does not exist", CODE.NOT_FOUND);
});

app.use(errorHandler);

export { app };
