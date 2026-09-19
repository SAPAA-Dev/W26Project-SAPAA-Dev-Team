// Create mock functions before the mock is defined
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

// Mock must be defined before importing the module that uses it
jest.mock("../../utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
    },
  }),
}));

// Import the module AFTER the mock is set up
import * as authModule from "../../services/auth";

describe("Supabase Auth Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("logs in successfully", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: "1", email: "a@b.com" } },
        error: null,
      });

      const result = await authModule.login("a@b.com", "pass123");
      expect(result).toEqual({ success: true });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "pass123",
      });
    });

    it("returns error if Supabase fails", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid" },
      });

      const result = await authModule.login("a@b.com", "pass123");
      expect(result).toEqual({ success: false, error: "Invalid" });
    });

    it("handles thrown errors", async () => {
      mockSignInWithPassword.mockRejectedValue(new Error("Fail"));

      const result = await authModule.login("a@b.com", "pass123");
      expect(result).toEqual({ success: false, error: "Fail" });
    });
  });

  describe("signup", () => {
    it("validates email and password", async () => {
      expect(await authModule.signup("invalid", "123456")).toEqual({
        success: false,
        error: "Please enter a valid email",
      });
      expect(await authModule.signup("a@b.com", "123")).toEqual({
        success: false,
        error: "Password must be at least 6 characters",
      });
    });

    it("signs up successfully with authenticated: false and needs confirmation", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "1", email: "a@b.com", confirmed_at: null, user_metadata: { role: 'steward', authenticated: false } } },
        error: null,
      });

      const result = await authModule.signup("a@b.com", "123456");
      expect(result).toEqual({ success: true, needsConfirmation: true });
    });

    it("signs up successfully with authenticated: false and already confirmed", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "1", email: "a@b.com", confirmed_at: "2025-11-30", user_metadata: { role: 'steward', authenticated: false } } },
        error: null,
      });

      const result = await authModule.signup("a@b.com", "123456");
      expect(result).toEqual({ success: true, needsConfirmation: false });
    });

    it("returns error if Supabase fails", async () => {
      mockSignUp.mockResolvedValue({ data: null, error: { message: "Fail" } });

      const result = await authModule.signup("a@b.com", "123456");
      expect(result).toEqual({ success: false, error: "Fail" });
    });
  });

  describe("OAuth login", () => {
    it("Google login success", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      const result = await authModule.signInWithGoogle();
      expect(result).toEqual({ success: true });
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: expect.any(Object),
      });
    });

    it("Google login failure", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: { message: "Fail" } });
      const result = await authModule.signInWithGoogle();
      expect(result).toEqual({ success: false, error: "Fail" });
    });

    it("Microsoft login success", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
      const result = await authModule.signInWithMicrosoft();
      expect(result).toEqual({ success: true });
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "azure",
        options: expect.any(Object),
      });
    });

    it("Microsoft login failure", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: { message: "Fail" } });
      const result = await authModule.signInWithMicrosoft();
      expect(result).toEqual({ success: false, error: "Fail" });
    });
  });

  describe("logout", () => {
    it("logs out successfully", async () => {
      mockSignOut.mockResolvedValue({});
      await expect(authModule.logout()).resolves.toBeUndefined();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("handles logout failure", async () => {
      mockSignOut.mockRejectedValue(new Error("Fail"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await authModule.logout();
      expect(consoleSpy).toHaveBeenCalledWith("Logout failed", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});