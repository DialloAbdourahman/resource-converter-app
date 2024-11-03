import express, { Request, Response } from "express";
import { validateUpload } from "../middleware/validate-request";
import { User } from "../models/user";
import {
  AwsS3Helper,
  BadRequestError,
  CODE,
  generateRandomString,
  getPageAndItemsPerPageFromRequestQuery,
  NotFoundError,
  OrchestrationResult,
  VideoStates,
} from "@daconverter/common-libs";
import { Resource, ResourceDoc } from "../models/resource";
import { VideoUploadedPublisher } from "../events/publishers/VideoUploadedPublisher";
import { rabbitmqWrapper } from "../rabbitmq-wrapper";
import { upload } from "../services/multer";

const router = express.Router();

interface ResourceWithUrls {
  resource: ResourceDoc;
  videoUrl?: string;
  audioUrl?: string;
}

router.post(
  "/",
  upload.single("video"),
  validateUpload,
  async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!req.file) {
      throw new BadRequestError(
        "Provide a video",
        CODE.MULTER_FILE_DOES_NOT_EXIST
      );
    }

    const user = await User.findById(req.currentUser?.id);
    if (!user) {
      throw new Error("User not found");
    }

    const key = generateRandomString(20);
    const awsHelper = new AwsS3Helper();
    await awsHelper.uploadVideo(key, req.file.mimetype, req.file.buffer);

    const resource = Resource.build({
      name,
      video: key,
      user: req.currentUser?.id as string,
      size: req.file.size,
    });
    await resource.save();

    await new VideoUploadedPublisher(rabbitmqWrapper.client).publish({
      id: resource.id,
      video: resource.video,
    });

    OrchestrationResult.item(res, resource, 201);
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const resource = await Resource.findOne({
    _id: id,
    user: req.currentUser?.id,
  }).populate("user");

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  const awsHelper = new AwsS3Helper();

  const data: {
    resource: any;
    videoUrl?: string;
    audioUrl?: string;
  } = {
    resource,
  };

  if (resource.video && resource.status !== VideoStates.COMPLETE) {
    data.videoUrl = await awsHelper.getVideoUrl(resource.video);
  }

  if (resource.audio && resource.status === VideoStates.COMPLETE) {
    data.audioUrl = await awsHelper.getAudioUrl(resource.audio);
  }

  OrchestrationResult.item(res, data);
});

router.post("/retry/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const resource = await Resource.findOne({
    _id: id,
    user: req.currentUser?.id,
  }).populate("user");

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  if (resource.status !== VideoStates.FAILED) {
    if (resource.status === VideoStates.COMPLETE) {
      throw new BadRequestError(
        "Video has been converted already",
        CODE.VIDEO_CONVERTED_ALREADY
      );
    }
    if (resource.status === VideoStates.UPLOADED) {
      throw new BadRequestError(
        "Keep waiting, video is still being converted",
        CODE.VIDEO_IS_STILL_BEING_CONVERTED
      );
    }
  }

  await new VideoUploadedPublisher(rabbitmqWrapper.client).publish({
    id: resource.id,
    video: resource.video,
  });

  resource.status = VideoStates.UPLOADED;
  await resource.save();

  OrchestrationResult.success(res);
});

router.get("/", async (req: Request, res: Response) => {
  const { itemsPerPage, page, skip } =
    getPageAndItemsPerPageFromRequestQuery(req);

  const resources = await Resource.find({
    user: req.currentUser?.id,
  })
    .skip(skip)
    .limit(itemsPerPage);
  const count = await Resource.countDocuments();

  const awsHelper = new AwsS3Helper();

  const getResourcesWithUrls: (
    resources: ResourceDoc[]
  ) => Promise<ResourceWithUrls[]> = (resources) => {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await Promise.all(
          resources.map(async (resource) => {
            if (resource.video && resource.status !== VideoStates.COMPLETE) {
              const videoUrl = await awsHelper.getVideoUrl(resource.video);
              return { resource, videoUrl };
            }

            if (resource.audio && resource.status === VideoStates.COMPLETE) {
              const audioUrl = await awsHelper.getAudioUrl(resource.audio);
              return { resource, audioUrl };
            }

            return { resource };
          })
        );
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  };

  const data = await getResourcesWithUrls(resources);

  OrchestrationResult.list(res, data, count, itemsPerPage, page);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const resource = await Resource.findOne({
    _id: id,
    user: req.currentUser?.id,
  });

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  const awsHelper = new AwsS3Helper();

  if (resource.video && resource.status !== VideoStates.COMPLETE) {
    await awsHelper.deleteVideoFromS3(resource.video);
  }

  if (resource.audio && resource.status === VideoStates.COMPLETE) {
    await awsHelper.deleteAudioFromS3(resource.audio);
  }

  await Resource.deleteOne({
    _id: id,
  });

  OrchestrationResult.success(res);
});

export { router as resourceRouter };

// => root user create s3, create iam user to have access keys so that nodejs can use it to store things on the s3 bucket, create policies which will define the rules for what can be accessed by the iam user (I want my nodejs to be able to access only my s3 and only in specific ways)
