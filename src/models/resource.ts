import mongoose from "mongoose";
import { UserDoc } from "./user";
import { VideoStates } from "@daconverter/common-libs";

// An interface that describes the properties required to create a new resource
interface ResourceAttrs {
  name: string;
  video: string;
  user: UserDoc | string;
}

// An interface that describes the properties that a Resource documents has
export interface ResourceDoc extends mongoose.Document {
  name: string;
  video: string;
  audio: string;
  user: UserDoc;
  status: VideoStates;
  updatedAt: string;
  createdAt: string;
}

// An interface that describes the properties that a Resource Model has
interface ResourceModel extends mongoose.Model<ResourceDoc> {
  build(attrs: ResourceAttrs): ResourceDoc;
}

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    audio: {
      type: String,
      required: false,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(VideoStates),
      default: VideoStates.UPLOADED,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

resourceSchema.statics.build = (attrs: ResourceAttrs) => {
  return new Resource(attrs);
};

const Resource = mongoose.model<ResourceDoc, ResourceModel>(
  "Resource",
  resourceSchema
);

export { Resource };
