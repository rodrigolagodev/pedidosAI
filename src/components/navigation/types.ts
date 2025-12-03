export type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  pattern: RegExp; // For matching active route
  adminOnly?: boolean;
};

export type FabConfig = {
  show: boolean;
  href?: string;
  onClick?: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  isAdmin: boolean;
};

export type TopBarProps = {
  organization: Organization;
  organizations: Organization[];
  user: {
    email: string;
    fullName?: string | null;
  };
};

export type BottomNavBarProps = {
  currentPath: string;
  organizationSlug: string;
  isAdmin: boolean;
};

export type FloatingActionButtonProps = {
  currentPath: string;
  organizationSlug: string;
};
