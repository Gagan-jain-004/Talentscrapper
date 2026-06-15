export type CandidateStatus = 'to_contact' | 'contacted' | 'interviewing' | 'hired' | 'rejected';

export interface CandidateType {
  _id: string;
  listId: string;
  name: string;
  profileUrl: string;
  headline: string;
  location: string;
  snippet: string;
  relevanceScore: number;
  status: CandidateStatus;
  notes: string;
  tags: string[];
  savedAt: string;
  updatedAt: string;
  searchQuery: string;
}
