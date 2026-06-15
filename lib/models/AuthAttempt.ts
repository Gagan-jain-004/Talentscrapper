import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthAttempt extends Document {
  ip: string;
  createdAt: Date;
}

const AuthAttemptSchema = new Schema<IAuthAttempt>({
  ip: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL Index: automatically delete document 30 seconds after createdAt
AuthAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 });

export const AuthAttempt: Model<IAuthAttempt> =
  mongoose.models.AuthAttempt || mongoose.model<IAuthAttempt>('AuthAttempt', AuthAttemptSchema);
