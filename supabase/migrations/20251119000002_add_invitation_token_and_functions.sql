-- Migration: Add secure token to invitations and utility functions
-- Description: Secure invitation tokens and helper functions for auth flows

-- =============================================================================
-- ADD TOKEN TO INVITATIONS
-- =============================================================================

-- Add secure token column (using gen_random_uuid for cryptographically secure tokens)
ALTER TABLE invitations
ADD COLUMN token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Index for token lookups
CREATE INDEX idx_invitations_token ON invitations(token);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Get all organizations for current user
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    user_role membership_role,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        m.role,
        m.joined_at
    FROM organizations o
    INNER JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
    ORDER BY m.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in a specific organization
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID)
RETURNS membership_role AS $$
    SELECT role FROM memberships
    WHERE user_id = auth.uid()
    AND organization_id = org_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Accept an invitation by token
-- Returns the organization_id if successful, NULL if failed
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token UUID)
RETURNS UUID AS $$
DECLARE
    inv RECORD;
    user_email TEXT;
BEGIN
    -- Get current user's email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Get and validate invitation
    SELECT * INTO inv FROM invitations
    WHERE token = invitation_token
    AND email = user_email
    AND accepted_at IS NULL
    AND expires_at > NOW();

    IF inv IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;

    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND organization_id = inv.organization_id
    ) THEN
        RAISE EXCEPTION 'User is already a member of this organization';
    END IF;

    -- Create membership
    INSERT INTO memberships (user_id, organization_id, role)
    VALUES (auth.uid(), inv.organization_id, inv.role);

    -- Mark invitation as accepted
    UPDATE invitations
    SET accepted_at = NOW()
    WHERE id = inv.id;

    RETURN inv.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique slug from organization name
CREATE OR REPLACE FUNCTION generate_unique_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from name (lowercase, alphanumeric, hyphens)
    base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := substring(base_slug from 1 for 80);

    -- Ensure not empty
    IF base_slug = '' THEN
        base_slug := 'org';
    END IF;

    new_slug := base_slug;

    -- Find unique slug
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter::text;
    END LOOP;

    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Create organization with automatic admin membership
CREATE OR REPLACE FUNCTION create_organization_with_membership(
    org_name TEXT,
    org_slug TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    final_slug TEXT;
BEGIN
    -- Generate slug if not provided
    IF org_slug IS NULL OR org_slug = '' THEN
        final_slug := generate_unique_slug(org_name);
    ELSE
        final_slug := org_slug;
    END IF;

    -- Create organization
    INSERT INTO organizations (name, slug, created_by)
    VALUES (org_name, final_slug, auth.uid())
    RETURNING id INTO new_org_id;

    -- Create admin membership for creator
    INSERT INTO memberships (user_id, organization_id, role)
    VALUES (auth.uid(), new_org_id, 'admin');

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get invitation details by token (for display before accepting)
CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token UUID)
RETURNS TABLE (
    invitation_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    role membership_role,
    invited_by_name TEXT,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        o.name,
        o.slug,
        i.role,
        COALESCE(p.full_name, 'Usuario'),
        i.expires_at,
        (i.accepted_at IS NULL AND i.expires_at > NOW())
    FROM invitations i
    INNER JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN profiles p ON p.id = i.invited_by
    WHERE i.token = invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN invitations.token IS 'Secure UUID token for invitation links';
COMMENT ON FUNCTION get_user_organizations IS 'Get all organizations for current authenticated user';
COMMENT ON FUNCTION get_user_role IS 'Get user role in a specific organization';
COMMENT ON FUNCTION accept_invitation IS 'Accept invitation by token, creates membership';
COMMENT ON FUNCTION generate_unique_slug IS 'Generate unique URL-friendly slug from name';
COMMENT ON FUNCTION create_organization_with_membership IS 'Create org and auto-assign creator as admin';
COMMENT ON FUNCTION get_invitation_by_token IS 'Get invitation details for display';
