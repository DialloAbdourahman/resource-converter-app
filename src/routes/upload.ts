// https://akshay9.medium.com/integrate-aws-s3-with-your-node-js-project-a-step-by-step-guide-f7f160ea8d29

import express, { Request, Response } from "express";
import { validateUpload } from "../middleware/validate-request";
import { User } from "../models/user";
import {
  BadRequestError,
  CODE,
  UnauthorizedError,
} from "@daconverter/common-libs";
import { UserCreatedPublisher } from "../events/publishers/UserCreatedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";

const router = express.Router();

router.post("/", validateUpload, async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("Provide a video", CODE.MULTER_ERROR);
  }

  //   const user = await User.findById(req.currentUser?.id);
  //   if (!user) {
  //     throw new UnauthorizedError("No user found");
  //   }

  console.log(req.file);
});

export { router as uploadRouter };
