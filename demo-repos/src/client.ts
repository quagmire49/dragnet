// LOOSE END LOW: Hardcoded localhost URL
export const API_BASE_URL = "http://localhost:8080/v1";

export async function authenticateUser(credentials: { user: string; pass: string }) {
  // SLOP MEDIUM: Logging raw credentials/password to console
  console.log("Authenticating user with password:", credentials.pass);

  // GAP HIGH: Unhandled promise rejection - no catch handler
  fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then((res) => res.json());
}
