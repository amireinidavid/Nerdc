import Joi from 'joi';

// Define validation schema for journal data
const journalSchema = Joi.object({
  title: Joi.string().required().min(5).max(255)
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required'
    }),

  abstract: Joi.string().required().min(50).max(2000)
    .messages({
      'string.base': 'Abstract must be a string',
      'string.empty': 'Abstract is required',
      'string.min': 'Abstract must be at least 50 characters long',
      'string.max': 'Abstract cannot exceed 2000 characters',
      'any.required': 'Abstract is required'
    }),

  content: Joi.string().allow(null, ''),

  pdfUrl: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'PDF URL must be a valid URL'
  }),

  thumbnailUrl: Joi.string().uri().allow(null, '').messages({
    'string.uri': 'Thumbnail URL must be a valid URL'
  }),

  doi: Joi.string().pattern(/^10.\d{4,9}\/[-._;()\/:A-Za-z0-9]+$/).allow(null, '').messages({
    'string.pattern.base': 'DOI must be in a valid format (e.g., 10.1234/abc123)'
  }),

  pageCount: Joi.number().integer().min(1).allow(null).messages({
    'number.base': 'Page count must be a number',
    'number.integer': 'Page count must be an integer',
    'number.min': 'Page count must be at least 1'
  }),

  price: Joi.number().precision(2).min(0).allow(null).messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'number.precision': 'Price must have at most 2 decimal places'
  }),

  categoryId: Joi.alternatives().try(
    Joi.number().integer().required(), 
    Joi.string().pattern(/^\d+$/)
  ).messages({
    'alternatives.types': 'Category ID must be a number or a numeric string',
    'any.required': 'Category ID is required'
  }),

  tags: Joi.array().items(
    Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/)
    )
  ).messages({
    'array.base': 'Tags must be an array',
    'alternatives.types': 'Each tag must be a number or a numeric string',
    'any.only': 'Tag ID must be a positive integer'
  }),

  // For admin updates
  reviewStatus: Joi.string().valid('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'),
  isPublished: Joi.boolean(),
  reviewNotes: Joi.string().allow(null, '')
});

// Validate journal data
export const validateJournalData = (data: any) => {
  const { error, value } = journalSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return { error: errors, data: value };
  }
  
  return { error: null, data: value };
}; 