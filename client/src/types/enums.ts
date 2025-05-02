export enum ReviewStatus {
  DRAFT = "DRAFT",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
  REVISIONS_NEEDED = "REVISIONS_NEEDED"
}

export enum UserRole {
  USER = "USER",
  AUTHOR = "AUTHOR",
  ADMIN = "ADMIN"
}

export enum ProfileStatus {
  INCOMPLETE = "INCOMPLETE",
  COMPLETE = "COMPLETE"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED"
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING"
} 