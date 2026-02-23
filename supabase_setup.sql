-- Create a public bucket "avatars" if it doesn't already exist.
-- In Supabase UI: Storage -> New Bucket -> name: "avatars", public: YES.

-- 1. Enable RLS on the bucket (optional if managed via UI, but good practice)
-- Note: Buckets are rows in `storage.buckets`. Objects in `storage.objects`.

-- 2. CREATE POLICIES FOR 'avatars' BUCKET

-- Allow anyone to VIEW avatars (Public read access)
CREATE POLICY "Public profiles are viewable by everyone" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

-- Allow authenticated users to UPLOAD avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1] -- This assumes the filename starts with 'user_id/' or similar structure, wait.
  -- Our JS code uses `${user.id}-${Math.random()}.${fileExt}`.
  -- Simpler check: Allow any authenticated user to upload if the name starts with their ID.
  bucket_id = 'avatars' AND
  (auth.uid() = uuid((string_to_array(name, '-'))[1])) -- Extract user ID from filename prefix
);

-- Alternatively, allow Authenticated users to upload ANY file to the bucket (simpler but less secure)
-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
-- FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to UPDATE their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (string_to_array(name, '-'))[1]
);

-- Allow users to DELETE their own avatars (if implemented later)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (string_to_array(name, '-'))[1]
);


-- 3. CREATE RPC FUNCTION FOR ACCOUNT DELETION
-- This function allows a user to delete their own account via `supabase.rpc('delete_user')`.
-- It must run with SECURITY DEFINER to escalate privileges.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Provide safety check: Ensure the function is called by the authenticated user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
