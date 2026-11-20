export interface MagicSuggestion {
  steps: { opId: string; args: Record<string, unknown> }[];
  score: number;
  preview: string;
}
