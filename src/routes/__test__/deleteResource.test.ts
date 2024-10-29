import request from "supertest";
import { app } from "../../app";
import { CODE } from "@daconverter/common-libs";
import { getLoginUser } from "../../test/get-login-user";
import { createResource } from "./getResourceInfo.test";

it("should not allow an unauthenticated user to delete a resource", async () => {
  const response = await request(app).delete("/api/resources/ddd").send();
  expect(response.status).toEqual(401);
  expect(response.body.code).toBe(CODE.NO_ACCESS_TOKEN);
});

it("should not allow a user to delete another user's info resource", async () => {
  const { cookie } = await getLoginUser();
  const { cookie: anotherCookie } = await getLoginUser();
  const name = "asdf";

  const resource = await createResource(cookie, name);

  const response = await request(app)
    .delete(`/api/resources/${resource.body.data.id}`)
    .set("Cookie", anotherCookie)
    .send();
  expect(response.status).toEqual(404);
  expect(response.body.code).toBe(CODE.NOT_FOUND);
});

it("should allow a user to delete his resource", async () => {
  const { cookie } = await getLoginUser();
  const name = "asdf";

  const resource = await createResource(cookie, name);

  const response = await request(app)
    .delete(`/api/resources/${resource.body.data.id}`)
    .set("Cookie", cookie)
    .send();
  expect(response.status).toEqual(204);
});
