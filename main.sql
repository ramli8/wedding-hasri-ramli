-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              VARCHAR(255) NOT NULL UNIQUE,
  full_name          VARCHAR(255) NOT NULL,
  password_hash      TEXT NOT NULL,
  email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_super_admin     BOOLEAN NOT NULL DEFAULT FALSE,
  super_admin_status VARCHAR(20) CHECK (super_admin_status IN ('active', 'inactive')),
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,

  CONSTRAINT super_admin_status_check CHECK (
    (is_super_admin = FALSE AND super_admin_status IS NULL)
    OR (is_super_admin = TRUE AND super_admin_status IS NOT NULL)
  )
);


-- ============================================================
-- 2. CLIENTS
-- ============================================================
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id),
  event_name    VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 3. CLIENT_MEMBERS
-- ============================================================
CREATE TABLE client_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  -- Username only needs to be unique within the same client
  UNIQUE (client_id, username)
);


-- ============================================================
-- 4. PERMISSIONS
-- ============================================================
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. ROLES
-- ============================================================
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (client_id, name)
);


-- ============================================================
-- 6. ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (role_id, permission_id)
);

-- ============================================================
-- 7. CLIENT_MEMBER_ROLES
-- ============================================================
CREATE TABLE client_member_roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_member_id UUID NOT NULL REFERENCES client_members(id) ON DELETE CASCADE,
  role_id          UUID NOT NULL REFERENCES roles(id),
  assigned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (client_member_id, role_id)
);



-- ============================================================
-- 8. USER_ACTIVITIES (AUDIT LOG)
-- ============================================================
CREATE TABLE user_activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  -- Only one of these will be set per row
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  member_id    UUID REFERENCES client_members(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT actor_check CHECK (
    (user_id IS NOT NULL AND member_id IS NULL)
    OR (user_id IS NULL AND member_id IS NOT NULL)
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email                ON users(email);
CREATE INDEX idx_users_super_admin          ON users(is_super_admin) WHERE is_super_admin = TRUE;
CREATE INDEX idx_clients_slug               ON clients(slug);
CREATE INDEX idx_clients_owner              ON clients(owner_id);
CREATE INDEX idx_clients_active             ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_client_members_client      ON client_members(client_id);
CREATE INDEX idx_client_members_active      ON client_members(client_id) WHERE is_active = TRUE;
CREATE INDEX idx_roles_client               ON roles(client_id);
CREATE INDEX idx_role_permissions_role      ON role_permissions(role_id);
CREATE INDEX idx_client_member_roles_member ON client_member_roles(client_member_id);
CREATE INDEX idx_user_activities_client     ON user_activities(client_id);
CREATE INDEX idx_user_activities_user       ON user_activities(user_id);
CREATE INDEX idx_user_activities_member     ON user_activities(member_id);
CREATE INDEX idx_user_activities_created    ON user_activities(created_at DESC);


-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_client_members_updated_at
  BEFORE UPDATE ON client_members
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_client_member_roles_updated_at
  BEFORE UPDATE ON client_member_roles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();