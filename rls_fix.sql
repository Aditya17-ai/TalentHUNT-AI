-- Add external_link column to jobs table if it doesn't exist
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Enable RLS just in case (idempotent)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert jobs
CREATE POLICY "Authenticated users can insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update jobs (optional, for now allow all auth)
CREATE POLICY "Authenticated users can update jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (true);
