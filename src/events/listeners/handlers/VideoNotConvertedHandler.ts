import { VideoNotConvertedEvent, VideoStates } from "@daconverter/common-libs";
import { Channel, ConsumeMessage } from "amqplib";
import { Resource } from "../../../models/resource";
import { NotificationVideoNotConvertedPublisher } from "../../publishers/NotificationVideoNotConverted";
import { rabbitmqWrapper } from "../../../rabbitmq-wrapper";

export const videoNotConvertedHandler = async (
  data: VideoNotConvertedEvent["data"],
  message: ConsumeMessage,
  channel: Channel
) => {
  try {
    console.log("Video not converted handler called");

    const resource = await Resource.findById(data.id);

    if (!resource) {
      throw new Error("Resource not found");
    }

    resource.status = VideoStates.FAILED;
    await resource?.save();

    // Send a notification using a notification publisher
    await new NotificationVideoNotConvertedPublisher(
      rabbitmqWrapper.client
    ).publish({ resourceId: resource.id });

    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, true);
  }
};
