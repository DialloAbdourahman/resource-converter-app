import path from "path";
import fs from "fs";
import { getLoginUser } from "../../test/get-login-user";
import request from "supertest";
import { app } from "../../app";
import { Resource } from "../../models/resource";
import {
  CODE,
  VideoStates,
  VideoUploadedEvent,
} from "@daconverter/common-libs";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { VideoUploadedPublisher } from "../../events/publishers/VideoUploadedPublisher";

it("should allow a user to retry a faild conversion and publish an event", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resourceCreationResponse = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(resourceCreationResponse.status).toBe(201);

  const updatedResource = await Resource.findById(
    resourceCreationResponse.body.data.id
  );

  if (updatedResource) {
    updatedResource.status = VideoStates.FAILED;
    await updatedResource?.save();
  }

  const response = await request(app)
    .post(`/api/resources/retry/${resourceCreationResponse.body.data.id}`)
    .set("Cookie", cookie);
  expect(response.status).toBe(200);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const videoUploadedPublisher = new VideoUploadedPublisher(
    rabbitmqWrapper.client
  );
  const publishSpy = jest.spyOn(videoUploadedPublisher, "publish");
  const mockEventData: VideoUploadedEvent["data"] = {
    id: updatedResource?.id,
    video: updatedResource?.video as string,
  };
  await videoUploadedPublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});

it("should not allow a user to retry an already converted video", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resourceCreationResponse = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(resourceCreationResponse.status).toBe(201);

  const updatedResource = await Resource.findById(
    resourceCreationResponse.body.data.id
  );

  if (updatedResource) {
    updatedResource.status = VideoStates.COMPLETE;
    await updatedResource?.save();
  }

  const response = await request(app)
    .post(`/api/resources/retry/${resourceCreationResponse.body.data.id}`)
    .set("Cookie", cookie);
  expect(response.status).toBe(400);
  expect(response.body.code).toBe(CODE.VIDEO_CONVERTED_ALREADY);
});

it("should not allow a user to retry a video that is still being converted", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resourceCreationResponse = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(resourceCreationResponse.status).toBe(201);

  const updatedResource = await Resource.findById(
    resourceCreationResponse.body.data.id
  );

  if (updatedResource) {
    updatedResource.status = VideoStates.UPLOADED;
    await updatedResource?.save();
  }

  const response = await request(app)
    .post(`/api/resources/retry/${resourceCreationResponse.body.data.id}`)
    .set("Cookie", cookie);
  expect(response.status).toBe(400);
  expect(response.body.code).toBe(CODE.VIDEO_IS_STILL_BEING_CONVERTED);
});

it("should not allow an unauthenticated user to use this route", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const name = "asdf";

  const resourceCreationResponse = await request(app)
    .post("/api/resources")
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(resourceCreationResponse.status).toBe(401);
});
