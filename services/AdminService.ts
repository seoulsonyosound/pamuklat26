export class AdminService {
  private static SESSION_KEY = 'photobooth_admin_auth';
  private static DEFAULT_USERNAME = 'ssite2026';
  private static DEFAULT_PASSWORD = 'ssite20262027';

  /**
   * Checks if the current session is authenticated as admin.
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }

  /**
   * Attempts login with username and password.
   */
  static login(username: string, password: string): boolean {
    if (typeof window === 'undefined') return false;
    
    if (username === this.DEFAULT_USERNAME && password === this.DEFAULT_PASSWORD) {
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  /**
   * Clears the active admin session.
   */
  static logout(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}
export default AdminService;
