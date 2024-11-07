import { validateRequest } from "@daconverter/common-libs";
import { RequestHandler } from "express";
import { body, ValidationChain } from "express-validator";

// Type alias for Validator Middleware
type ValidatorMiddleware = ValidationChain | RequestHandler;

export const validateUpload: ValidatorMiddleware[] = [
  body("name")
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Name must be at least 1 characters and at most 50 characters"
    ),
  validateRequest,
];
