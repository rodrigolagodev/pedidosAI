-- =============================================================================
-- Migration: Add email to get_invitation_by_token function
-- Description: Include the invited email in the invitation details
-- =============================================================================

-- Drop and recreate to update return type
DROP FUNCTION IF EXISTS get_invitation_by_token(UUID);

CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token UUID)
RETURNS TABLE (
    invitation_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    role membership_role,
    invited_by_name TEXT,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN,
    email TEXT
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
        (i.accepted_at IS NULL AND i.expires_at > NOW()),
        i.email
    FROM invitations i
    INNER JOIN organizations o ON o.id = i.organization_id
    LEFT JOIN profiles p ON p.id = i.invited_by
    WHERE i.token = invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_invitation_by_token IS 'Get invitation details for display, including invited email';
