import { UserCreatedEvent } from "@daconverter/common-libs";
import { Channel, ConsumeMessage } from "amqplib";
import { User } from "../../../models/user";

export const userCreatedHandler = async (
  data: UserCreatedEvent["data"],
  message: ConsumeMessage,
  channel: Channel
) => {
  try {
    console.log("User created handler called");

    // Find the ticket that the order is reserving
    const user = User.build({
      id: data.id,
      email: data.email,
      fullname: data.fullname,
      version: data.version,
    });
    await user.save();

    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, true);
  }
};
