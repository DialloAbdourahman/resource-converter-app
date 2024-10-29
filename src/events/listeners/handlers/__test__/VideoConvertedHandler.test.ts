import {
  NotificationVideoConvertedEvent,
  VideoConvertedEvent,
  VideoStates,
} from "@daconverter/common-libs";
import { ConsumeMessage } from "amqplib";
import mongoose from "mongoose";
import { videoConvertedHandler } from "../VideoConvertedHandler";
import { Resource } from "../../../../models/resource";
import { rabbitmqWrapper } from "../../../../rabbitmq-wrapper";
import { NotificationVideoConvertedPublisher } from "../../../publishers/NotificationVideoConverted";
import { User } from "../../../../models/user";

it("should handle a video converted event", async () => {
  const user = User.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
    fullname: "test",
    version: 1,
  });
  await user.save();

  const resource = Resource.build({
    name: "asdf",
    user: user.id,
    video: "asdf",
  });
  await resource.save();

  const data: VideoConvertedEvent["data"] = {
    id: resource.id,
    audio: "fdsa",
  };

  // Create a fake channel object and message object.
  // @ts-ignore
  const msg: ConsumeMessage = {};
  // @ts-ignore
  const channel: Channel = {
    ack: jest.fn().mockImplementation((msg: ConsumeMessage) => {}),
  };

  await videoConvertedHandler(data, msg, channel);

  const updatedResource = await Resource.findById(resource.id);
  expect(updatedResource?.audio.length).not.toBe(0);
  expect(updatedResource?.status).toBe(VideoStates.COMPLETE);
});

it("should publish a video converted event", async () => {
  const user = User.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
    fullname: "test",
    version: 1,
  });
  await user.save();

  const resource = Resource.build({
    name: "asdf",
    user: user.id,
    video: "asdf",
  });
  await resource.save();

  const data: VideoConvertedEvent["data"] = {
    id: resource.id,
    audio: "fdsa",
  };

  // Create a fake channel object and message object.
  // @ts-ignore
  const msg: ConsumeMessage = {};
  // @ts-ignore
  const channel: Channel = {
    ack: jest.fn().mockImplementation((msg: ConsumeMessage) => {}),
  };

  await videoConvertedHandler(data, msg, channel);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const notificationVideoConvertedPublisher =
    new NotificationVideoConvertedPublisher(rabbitmqWrapper.client);
  const publishSpy = jest.spyOn(notificationVideoConvertedPublisher, "publish");
  const mockEventData: NotificationVideoConvertedEvent["data"] = {
    resourceId: resource.id,
    email: user.email,
  };
  await notificationVideoConvertedPublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});
