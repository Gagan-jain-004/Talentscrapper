import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IList extends Document {
  name: string;
  color: string;
  emoji: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  candidateCount?: number;
}

const ListSchema = new Schema<IList>(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    emoji: { type: String, required: true },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ListSchema.virtual('candidateCount', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'listId',
  count: true,
});

export const List: Model<IList> = mongoose.models.List || mongoose.model<IList>('List', ListSchema);
