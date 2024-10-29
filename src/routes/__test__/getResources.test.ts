import request from "supertest";
import { app } from "../../app";
import { CODE } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { createResource } from "./getResourceInfo.test";

it("should not allow an unauthenitated user to see his resource", async () => {
  const response = await request(app).get("/api/resources").send();
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);
});

it("should not allow a user to view another user's info resource", async () => {
  const { cookie } = await getLoginUser();
  const { cookie: anotherCookie } = await getLoginUser();
  const name = "asdf";

  await createResource(cookie, name);

  const response = await request(app)
    .get(`/api/resources`)
    .set("Cookie", anotherCookie)
    .send();
  expect(response.status).toEqual(200);
  expect(response.body.data.length).toBe(0);
});

it("allow a user to view his resources", async () => {
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resource = await createResource(cookie, name);

  const response = await request(app)
    .get(`/api/resources`)
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(200);
  expect(response.body.data.length).toBe(1);
  expect(response.body.data[0].resource.id).toBe(resource.body.data.id);
  expect(response.body.data[0].videoUrl).toBeDefined();
  expect(response.body.data[0].audioUrl).not.toBeDefined();
});
