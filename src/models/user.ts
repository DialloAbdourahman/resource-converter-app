import mongoose from "mongoose";

// An interface that describes the properties required to create a new user
interface UserAttrs {
  id: string;
  email: string;
  fullname: string;
  version: number;
}

// An interface that describes the properties that a User documents has
export interface UserDoc extends mongoose.Document {
  id: string;
  email: string;
  fullname: string;
  version: number;
  updatedAt: string;
  createdAt: string;
}

// An interface that describes the properties that a User Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
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

userSchema.set("versionKey", "version");

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User({
    _id: attrs.id,
    email: attrs.email,
    fullname: attrs.fullname,
    version: attrs.version,
  });
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
