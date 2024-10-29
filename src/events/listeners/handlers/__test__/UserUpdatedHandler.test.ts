import { UserUpdateedEvent } from "@daconverter/common-libs";
import { ConsumeMessage } from "amqplib";
import mongoose from "mongoose";
import { User } from "../../../../models/user";
import { userUpdatedHandler } from "../UserUpdatedHandler";

it("should handle a user updated event", async () => {
  const user = User.build({
    email: "test@test.com",
    fullname: "",
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 1,
  });
  await user.save();

  const data: UserUpdateedEvent["data"] = {
    id: user.id,
    email: "test@test.com",
    fullname: "fullname",
    version: 2,
  };

  // Create a fake channel object and message object.
  // @ts-ignore
  const msg: ConsumeMessage = {};
  // @ts-ignore
  const channel: Channel = {
    ack: jest.fn().mockImplementation((msg: ConsumeMessage) => {}),
  };

  await userUpdatedHandler(data, msg, channel);

  const updatedUser = await User.findById(user.id);
  expect(updatedUser?.id).toBe(user.id);
  expect(updatedUser?.version).toBe(data.version);
  expect(updatedUser?.fullname).toBe(data.fullname);
  expect(updatedUser?.fullname).not.toBe(user.fullname);
});
