import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUsage extends Document {
  month: string; // YYYY-MM
  providers: {
    serpapi: number;
    scaleserp: number;
    valueserp: number;
    zenserp: number;
    brave: number;
  };
  totalSearches: number;
  lastUpdated: Date;
}

const UsageSchema = new Schema<IUsage>(
  {
    month: { type: String, required: true, unique: true },
    providers: {
      serpapi: { type: Number, default: 0 },
      scaleserp: { type: Number, default: 0 },
      valueserp: { type: Number, default: 0 },
      zenserp: { type: Number, default: 0 },
      brave: { type: Number, default: 0 },
    },
    totalSearches: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  }
);

export const Usage: Model<IUsage> = mongoose.models.Usage || mongoose.model<IUsage>('Usage', UsageSchema);
