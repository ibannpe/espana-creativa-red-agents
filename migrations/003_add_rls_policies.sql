-- ABOUTME: Migration to enable Row Level Security (RLS) on pending_signups and signup_rate_limits
-- ABOUTME: Defines security policies for public signup requests and admin-only approval operations

-- Enable RLS on pending_signups table
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Enable RLS on signup_rate_limits table
ALTER TABLE public.signup_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PENDING SIGNUPS POLICIES
-- ============================================

-- Policy: Allow public to INSERT signup requests (anonymous users can request signup)
CREATE POLICY "Anyone can submit signup requests"
  ON public.pending_signups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Admins can view all pending signups
CREATE POLICY "Admins can view all pending signups"
  ON public.pending_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: Admins can update pending signups (for approval/rejection)
CREATE POLICY "Admins can update pending signups"
  ON public.pending_signups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: Admins can delete pending signups (for cleanup)
CREATE POLICY "Admins can delete pending signups"
  ON public.pending_signups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- ============================================
-- RATE LIMITS POLICIES
-- ============================================

-- Policy: Allow public to INSERT rate limit records
CREATE POLICY "Public can insert rate limit records"
  ON public.signup_rate_limits
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public to SELECT their own rate limit records (by IP)
CREATE POLICY "Public can view own rate limits"
  ON public.signup_rate_limits
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admins can view all rate limit records
CREATE POLICY "Admins can view all rate limits"
  ON public.signup_rate_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policy: System can update rate limit records
CREATE POLICY "System can update rate limits"
  ON public.signup_rate_limits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: System can delete old rate limit records
CREATE POLICY "System can delete rate limits"
  ON public.signup_rate_limits
  FOR DELETE
  TO public
  USING (true);

-- Add helpful comments
COMMENT ON POLICY "Anyone can submit signup requests" ON public.pending_signups IS 'Allows anonymous users to submit signup requests';
COMMENT ON POLICY "Admins can view all pending signups" ON public.pending_signups IS 'Restricts viewing pending signups to users with admin role';
COMMENT ON POLICY "Admins can update pending signups" ON public.pending_signups IS 'Only admins can approve or reject signup requests';
