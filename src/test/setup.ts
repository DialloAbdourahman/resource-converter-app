import mongoose, { mongo } from "mongoose";

jest.mock("../rabbitmq-wrapper.ts");

jest.mock("@daconverter/common-libs", () => {
  const actualLibrary = jest.requireActual("@daconverter/common-libs");
  return {
    ...actualLibrary,
    AwsS3Helper: jest.fn().mockImplementation(() => {
      return {
        uploadVideo: jest.fn().mockImplementation((file, bucket, options) => {
          return Promise.resolve(true);
        }),
        getVideoUrl: jest.fn().mockImplementation((file) => {
          return Promise.resolve("link");
        }),
        deleteVideoFromS3: jest.fn().mockImplementation((file) => {
          return Promise.resolve("link");
        }),
      };
    }),
  };
});

// Runs before all our tests starts
beforeAll(async () => {
  process.env.ACCESS_TOKEN_JWT_KEY = "1234";
  process.env.MONGO_URI = "mongodb://localhost:27017/resource-test";

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongodb successfully");
  } catch (error) {
    console.log("Database connection error", error);
    // process.exit();
  }
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db?.collections();
  if (collections) {
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  console.log("disconnected to mongodb");
});
