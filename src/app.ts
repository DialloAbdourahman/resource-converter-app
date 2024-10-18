import {
  BadRequestError,
  CODE,
  errorHandler,
  NotFoundError,
  requireAuth,
} from "@daconverter/common-libs";
import express from "express";
import cookieParser from "cookie-parser";
import "express-async-errors";
import { uploadRouter } from "./routes/upload";
import { upload } from "./services/multer";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  "/api/resource",
  requireAuth,
  upload.single("video"),
  requireAuth,
  uploadRouter
);

app.use("*", () => {
  throw new NotFoundError("Route does not exist", CODE.NOT_FOUND);
});

app.use(errorHandler);

export { app };

// => root user create s3, create iam user to have access keys so that nodejs can use it to store things on the s3 bucket, create policies which will define the rules for what can be accessed by the iam user (I want my nodejs to be able to access only my s3 and only in specific ways)
