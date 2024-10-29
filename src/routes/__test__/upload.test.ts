import request from "supertest";
import { app } from "../../app";
import fs from "fs";
import path from "path";
import {
  CODE,
  VideoStates,
  VideoUploadedEvent,
} from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { Resource } from "../../models/resource";
import { rabbitmqWrapper } from "../../rabbitmq-wrapper";
import { VideoUploadedPublisher } from "../../events/publishers/VideoUploadedPublisher";

it("does not allow an unauthenticated user to upload a video", async () => {
  const response = await request(app).post("/api/resources").send();
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);

  const resources = await Resource.find({});
  expect(resources.length).toBe(0);
});

it("should not allow an authenticated user to upload video without entering all the info", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");

  const { cookie } = await getLoginUser();
  const name = "asdf";

  const responseOne = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .attach("video", fs.createReadStream(videoPath));
  expect(responseOne.status).toEqual(400);
  expect(responseOne.body.code).toBe(CODE.VALIDATION_REQUEST_ERROR);

  const responseTwo = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name);
  expect(responseTwo.status).toEqual(400);
  expect(responseTwo.body.code).toBe(CODE.MULTER_FILE_DOES_NOT_EXIST);

  const resources = await Resource.find({});
  expect(resources.length).toBe(0);
});

it("allow an authenticated user to upload a video", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const response = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(response.status).toBe(201);

  const resource = await Resource.findOne({ name });
  expect(resource?.name).toBe(name);
  expect(resource?.video.length).not.toBe(0);
  expect(resource?.audio.length).toBe(0);
  expect(resource?.status).toBe(VideoStates.UPLOADED);
});

it("should publish an event after uploading a video", async () => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const response = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(response.status).toBe(201);

  expect(rabbitmqWrapper.client.createChannel).toHaveBeenCalled();

  const videoUploadedPublisher = new VideoUploadedPublisher(
    rabbitmqWrapper.client
  );
  const publishSpy = jest.spyOn(videoUploadedPublisher, "publish");
  const mockEventData: VideoUploadedEvent["data"] = {
    id: "dd",
    video: "asdf",
  };
  await videoUploadedPublisher.publish(mockEventData);

  expect(publishSpy).toHaveBeenCalled();
  expect(publishSpy).toHaveBeenCalledWith(mockEventData);
});
