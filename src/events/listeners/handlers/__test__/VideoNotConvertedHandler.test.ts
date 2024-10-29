import {
  NotificationVideoConvertedEvent,
  NotificationVideoNotConvertedEvent,
  VideoConvertedEvent,
  VideoNotConvertedEvent,
  VideoStates,
} from "@daconverter/common-libs";
import { ConsumeMessage } from "amqplib";
import mongoose from "mongoose";
import { videoConvertedHandler } from "../VideoConvertedHandler";
import { Resource } from "../../../../models/resource";
import { rabbitmqWrapper } from "../../../../rabbitmq-wrapper";
import { NotificationVideoConvertedPublisher } from "../../../publishers/NotificationVideoConverted";
import { videoNotConvertedHandler } from "../VideoNotConvertedHandler";

it("should handle a video not converted event", async () => {
  const resource = Resource.build({
    name: "asdf",
    user: new mongoose.Types.ObjectId().toHexString(),
    video: "asdf",
  });
  await resource.save();

  const data: VideoNotConvertedEvent["data"] = {
    id: resource.id,
  };

  // Create a fake channel object and message object.
  // @ts-ignore
  const msg: ConsumeMessage = {};
  // @ts-ignore
  const channel: Channel = {
    ack: jest.fn().mockImplementation((msg: ConsumeMessage) => {}),
  };

  await videoNotConvertedHandler(data, msg, channel);

  const updatedResource = await Resource.findById(resource.id);
  expect(updatedResource?.audio.length).toBe(0);
  expect(updatedResource?.status).toBe(VideoStates.FAILED);
});

it("should publish a video not converted event", async () => {
  const resource = Resource.build({
    name: "asdf",
    user: new mongoose.Types.ObjectId().toHexString(),
    video: "asdf",
  });
  await resource.save();

  const data: VideoNotConvertedEvent["data"] = {
    id: resource.id,
  };

  // Create a fake channel object and message object.
  // @ts-ignore
  const msg: ConsumeMessage = {};
  // @ts-ignore
  const channel: Channel = {
    ack: jest.fn().mockImplementation((msg: ConsumeMessage) => {}),
  };

  await videoNotConvertedHandler(data, msg, channel);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const notificationVideoNotConvertedPublisher =
    new NotificationVideoConvertedPublisher(rabbitmqWrapper.client);
  const publishSpy = jest.spyOn(
    notificationVideoNotConvertedPublisher,
    "publish"
  );
  const mockEventData: NotificationVideoNotConvertedEvent["data"] = {
    resourceId: resource.id,
  };
  await notificationVideoNotConvertedPublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});
