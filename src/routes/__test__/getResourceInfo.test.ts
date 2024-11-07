import request from "supertest";
import { app } from "../../app";
import { CODE } from "@daconverter/common-libs";
import path from "path";
import fs from "fs";
import { getLoginUser } from "../../test/get-login-user";

export const createResource = async (cookie: string[], name: string) => {
  const videoPath = path.join(__dirname, "../../../testVideo/test.mp4");

  const resourceCreationResponse = await request(app)
    .post("/api/resources")
    .set("Cookie", cookie)
    .field("name", name)
    .attach("video", fs.createReadStream(videoPath));
  expect(resourceCreationResponse.status).toBe(201);

  return {
    body: {
      data: resourceCreationResponse.body.data.resource,
    },
  };
};

it("should not allow an unauthenitated user to see his resource", async () => {
  const response = await request(app).get("/api/resources/asdf").send();
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);
});

it("should not allow a user to view another user's info resource", async () => {
  const { cookie } = await getLoginUser();
  const { cookie: anotherCookie } = await getLoginUser();
  const name = "asdf";

  const resource = await createResource(cookie, name);

  const response = await request(app)
    .get(`/api/resources/${resource.body.data.id}`)
    .set("Cookie", anotherCookie)
    .send();
  expect(response.status).toEqual(404);
  expect(response.body.code).toBe(CODE.NOT_FOUND);
});

it("allow a user to view another user's info resource", async () => {
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resource = await createResource(cookie, name);

  const response = await request(app)
    .get(`/api/resources/${resource.body.data.id}`)
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);
});
