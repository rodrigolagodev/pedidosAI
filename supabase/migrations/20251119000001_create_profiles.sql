-- Migration: Create profiles table with auto-creation trigger
-- Description: User profiles linked to auth.users with automatic creation on signup

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT CHECK (char_length(full_name) <= 200),
    avatar_url TEXT CHECK (char_length(avatar_url) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profile lookups
CREATE INDEX idx_profiles_id ON profiles(id);

-- Trigger for updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY - PROFILES
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles of members in their organizations
CREATE POLICY "users_can_view_org_member_profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM memberships m1
            JOIN memberships m2 ON m1.organization_id = m2.organization_id
            WHERE m1.user_id = auth.uid()
            AND m2.user_id = profiles.id
        )
        OR id = auth.uid()
    );

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Users can insert their own profile (backup for trigger)
CREATE POLICY "users_can_insert_own_profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profile information linked to auth.users';
COMMENT ON FUNCTION handle_new_user IS 'Automatically creates profile when user signs up';
