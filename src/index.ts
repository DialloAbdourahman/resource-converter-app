import mongoose from "mongoose";
import { app } from "./app";
import { rabbitmqWrapper } from "./rabbitmq-wrapper";
import { ResourceServiceListener } from "./events/listeners/listener";
require("dotenv").config();

const PORT = 3000;

const start = async () => {
  console.log("Starting the Resource service...");

  if (!process.env.ACCESS_TOKEN_JWT_KEY) {
    console.log("ACCESS_TOKEN_JWT_KEY must be defined.");
    process.exit();
  }

  if (!process.env.MONGO_URI) {
    console.log("MONGO_URI must be defined.");
    process.exit();
  }

  if (!process.env.RABBITMQ_URL) {
    console.log("RABBITMQ_URL must be defined.");
    process.exit();
  }

  if (!process.env.AWS_BUCKET_NAME) {
    console.log("AWS_BUCKET_NAME must be defined.");
    process.exit();
  }

  if (!process.env.AWS_BUCKET_REGION) {
    console.log("AWS_BUCKET_REGION must be defined.");
    process.exit();
  }

  if (!process.env.AWS_ACCESS_KEY) {
    console.log("AWS_ACCESS_KEY must be defined.");
    process.exit();
  }

  if (!process.env.AWS_SECRET_KEY) {
    console.log("AWS_SECRET_KEY must be defined.");
    process.exit();
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongodb successfully");
  } catch (error) {
    console.log("Database connection error", error);
    process.exit();
  }

  try {
    await rabbitmqWrapper.connect();

    // If for what ever reason we disconnect to skaffold like we delete the skaffold pod
    rabbitmqWrapper.client.on("close", () => {
      console.log("Rabbitmq connection closed.");
      process.exit();
    });

    // when the app terminates
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Closing RabbitMQ connection...");
      await rabbitmqWrapper.client.close();
    });

    // when the app terminates
    process.on("SIGINT", async () => {
      console.log("SIGINT received. Closing RabbitMQ connection...");
      await rabbitmqWrapper.client.close();
    });

    // Running listener
    new ResourceServiceListener(rabbitmqWrapper.client).listen();
  } catch (error) {
    console.log("Error connecting to Rabbitmq.");
    console.log(error);

    // Exit if it cannot connect to rabbit mq and then kubernetes will recreate this pod and retry to connect.
    process.exit();
  }

  app.listen(process.env.PORT || PORT, () => {
    console.log(
      `Resource service listening on port ${process.env.PORT || PORT}`
    );
  });
};

start();
