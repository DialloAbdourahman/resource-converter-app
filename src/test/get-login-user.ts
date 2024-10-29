import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user";

export const getLoginUser = async (e?: string) => {
  const email = e || "test@test.com";

  const user = User.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
    fullname: "",
    version: 1,
  });
  await user.save();

  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    "1234",
    { expiresIn: "1d" }
  );

  return {
    cookie: [
      `access=${accessToken}; Max-Age=86400; Path=/; Expires=Wed, 23 Oct 2024 11:26:50 GMT; HttpOnly; Secure; SameSite=None`,
    ],
  };
};
