import {
  AwsS3Helper,
  VideoConvertedEvent,
  VideoStates,
} from "@daconverter/common-libs";
import { Channel, ConsumeMessage } from "amqplib";
import { Resource } from "../../../models/resource";
import { NotificationVideoConvertedPublisher } from "../../publishers/NotificationVideoConverted";
import { rabbitmqWrapper } from "../../../rabbitmq-wrapper";

export const videoConvertedHandler = async (
  data: VideoConvertedEvent["data"],
  message: ConsumeMessage,
  channel: Channel
) => {
  try {
    console.log("Video converted handler called");

    const resource = await Resource.findById(data.id).populate("user");

    if (!resource) {
      throw new Error("Resource not found");
    }

    resource.audio = data.audio;
    resource.status = VideoStates.COMPLETE;
    await resource?.save();

    // Send a notification using a notification publisher
    await new NotificationVideoConvertedPublisher(
      rabbitmqWrapper.client
    ).publish({
      resourceId: resource.id,
      email: resource.user.email,
      fullname: resource.user.fullname,
    });

    // Delete the video from s3
    const awsHelper = new AwsS3Helper();
    await awsHelper.deleteVideoFromS3(resource.video);

    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, true);
  }
};
