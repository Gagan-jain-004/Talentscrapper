import mongoose, { Schema, Document, Model } from 'mongoose';

export type CandidateStatus = 'to_contact' | 'contacted' | 'interviewing' | 'hired' | 'rejected';

export interface ICandidate extends Document {
  listId: mongoose.Types.ObjectId;
  name: string;
  profileUrl: string;
  headline: string;
  location: string;
  snippet: string;
  relevanceScore: number;
  status: CandidateStatus;
  notes: string;
  tags: string[];
  savedAt: Date;
  updatedAt: Date;
  searchQuery: string;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
    name: { type: String, required: true },
    profileUrl: { type: String, required: true },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    snippet: { type: String, default: '' },
    relevanceScore: { type: Number, required: true, min: 1, max: 10 },
    status: {
      type: String,
      enum: ['to_contact', 'contacted', 'interviewing', 'hired', 'rejected'],
      default: 'to_contact',
    },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    searchQuery: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'savedAt', updatedAt: 'updatedAt' },
  }
);

// Ensure a candidate URL is unique within a single list
CandidateSchema.index({ listId: 1, profileUrl: 1 }, { unique: true });

export const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
