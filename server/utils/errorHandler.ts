import { Response } from 'express';

type ErrorWithMessage = {
  message: string;
};

type PrismaError = {
  code: string;
  meta?: {
    target?: string[];
  };
};

const isPrismaError = (error: any): error is PrismaError => {
  return error && typeof error === 'object' && 'code' in error;
};

const isErrorWithMessage = (error: any): error is ErrorWithMessage => {
  return (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  );
};

const toErrorWithMessage = (maybeError: any): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
};

const getErrorMessage = (error: unknown): string => {
  return toErrorWithMessage(error).message;
};

export const handleErrorResponse = (
  error: unknown,
  res: Response,
  defaultMessage: string = 'An unexpected error occurred'
) => {
  console.error('Error:', error);

  if (isPrismaError(error)) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target?.join(', ') || 'field';
        return res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists`,
        });
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      default:
        return res.status(500).json({
          success: false,
          message: `Database error: ${getErrorMessage(error)}`,
        });
    }
  }

  // Handle standard errors
  return res.status(500).json({
    success: false,
    message: getErrorMessage(error) || defaultMessage,
  });
}; 