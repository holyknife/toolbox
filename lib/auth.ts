/** Authentication seam only. Replace with your auth provider's session lookup.
 * Never trust a client-provided user ID for backend authorization.
 * When a backend is introduced, enforce ownership of saved history on the server.
 */
export interface ToolboxUser { id: string; name: string; email?: string }
export interface AuthSession { user: ToolboxUser }
export async function getSession(): Promise<AuthSession | null> { return null; }
