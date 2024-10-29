import { BadRequestError, CODE } from "@daconverter/common-libs";
import multer from "multer";

const fileSize = 50 * 1024 * 1024;

export const upload = multer({
  limits: { fileSize }, // Limit file size to 50MB
  fileFilter(req, file, cb) {
    // Check for video file types
    const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/mkv"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new BadRequestError(
          "Only video files (.mp4, .mov, .avi, .mkv) are allowed!",
          CODE.MULTER_VIDEO_TYPE_ERROR
        )
      );
    }

    cb(null, true);
  },
});
