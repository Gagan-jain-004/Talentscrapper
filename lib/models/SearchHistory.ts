import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISearchHistory extends Document {
  query: string;
  builtQuery: string;
  providerUsed: string;
  resultsCount: number;
  searchedAt: Date;
}

const SearchHistorySchema = new Schema<ISearchHistory>(
  {
    query: { type: String, required: true },
    builtQuery: { type: String, required: true },
    providerUsed: { type: String, required: true },
    resultsCount: { type: Number, required: true },
    searchedAt: { type: Date, default: Date.now },
  }
);

export const SearchHistory: Model<ISearchHistory> = mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);
