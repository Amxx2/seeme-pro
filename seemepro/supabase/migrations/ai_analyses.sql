-- Unified AI Analyses History Table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Voice', 'Video', 'Toxic', 'Hunger', 'Live'
  truth_score INT,
  summary TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analyses"
  ON ai_analyses FOR SELECT
  USING (auth.uid() = user_id);
