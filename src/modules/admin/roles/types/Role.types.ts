export interface Role {
  id: string;
  name: string;
  description: string;
  is_default?: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  is_default?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  is_default?: boolean;
}
