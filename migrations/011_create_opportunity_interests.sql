-- Migration: Create opportunity_interests table
-- Description: Table to track user interest in opportunities

CREATE TABLE IF NOT EXISTS public.opportunity_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Ensure a user can only express interest once per opportunity
  UNIQUE(opportunity_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_opportunity_id ON public.opportunity_interests(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_user_id ON public.opportunity_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interests_status ON public.opportunity_interests(status);

-- Enable RLS
ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all interests
CREATE POLICY "Users can view all opportunity interests"
  ON public.opportunity_interests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can express interest
CREATE POLICY "Users can express interest"
  ON public.opportunity_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own interests
CREATE POLICY "Users can update own interests"
  ON public.opportunity_interests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own interests
CREATE POLICY "Users can delete own interests"
  ON public.opportunity_interests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opportunity_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunity_interests_updated_at
  BEFORE UPDATE ON public.opportunity_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_interests_updated_at();
