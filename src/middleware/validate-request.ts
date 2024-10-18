import { validateRequest } from "@daconverter/common-libs";
import { RequestHandler } from "express";
import { body, ValidationChain } from "express-validator";

// Type alias for Validator Middleware
type ValidatorMiddleware = ValidationChain | RequestHandler;

export const validateUpload: ValidatorMiddleware[] = [
  body("name").exists().withMessage("Name must be valid"),
  validateRequest,
];
