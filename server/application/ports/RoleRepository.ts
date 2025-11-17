// ABOUTME: Port (interface) for Role repository in hexagonal architecture
// ABOUTME: Defines contract for role data operations without coupling to specific implementation

export interface Role {
  id: number
  name: string
  description: string | null
  createdAt: Date
}

export interface RoleRepository {
  /**
   * Find a role by its ID
   */
  findById(roleId: number): Promise<Role | null>

  /**
   * Find a role by its name
   */
  findByName(name: string): Promise<Role | null>

  /**
   * Get all roles
   */
  findAll(): Promise<Role[]>
}
