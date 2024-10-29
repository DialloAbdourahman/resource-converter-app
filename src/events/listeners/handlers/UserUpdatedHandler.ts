import { UserUpdateedEvent } from "@daconverter/common-libs";
import { Channel, ConsumeMessage } from "amqplib";
import { User } from "../../../models/user";

export const userUpdatedHandler = async (
  data: UserUpdateedEvent["data"],
  message: ConsumeMessage,
  channel: Channel
) => {
  try {
    console.log("User updated handler called");

    const user = await User.findByEvent(data);

    if (!user) {
      throw new Error("User not found");
    }

    user.email = data.email;
    user.fullname = data.fullname;
    user.version = data.version;

    await user.save();

    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, true);
  }
};
