const mockListUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUserById = jest.fn();
const mockDeleteUser = jest.fn();
const mockGetUserById = jest.fn();
const mockCreateClient = jest.fn();

jest.mock("../../utils/supabase/admin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: (...args: unknown[]) => mockListUsers(...args),
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
        getUserById: (...args: unknown[]) => mockGetUserById(...args),
      },
    },
  },
}));

jest.mock("../../utils/supabase/server", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

import {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
} from "../../utils/admin-actions";

function mockCaller(role: string | null, authenticated = true) {
  const user =
    role === null
      ? null
      : { id: "caller-id", app_metadata: { role, authenticated } };
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });
}

describe("admin-actions", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getAllUsers", () => {
    it("returns nothing for a steward and reads nothing", async () => {
      mockCaller("steward");

      expect(await getAllUsers()).toEqual([]);
      expect(mockListUsers).not.toHaveBeenCalled();
    });

    it("lists users for an approved admin", async () => {
      mockCaller("admin");
      mockListUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: "u1",
              email: "a@b.com",
              app_metadata: { role: "admin", authenticated: true },
            },
          ],
        },
        error: null,
      });

      expect(await getAllUsers()).toEqual([
        { id: "u1", email: "a@b.com", role: "admin", authenticated: true },
      ]);
    });

    // Admin route auth checks (Sprint 2 dev task): the accounts page must list every user.
    it("reads every page of users, not only the first", async () => {
      mockCaller("admin");
      const page = (count: number, offset: number) =>
        Array.from({ length: count }, (_, index) => ({
          id: `u${offset + index}`,
          email: `u${offset + index}@b.com`,
          app_metadata: { role: "steward", authenticated: true },
        }));
      mockListUsers
        .mockResolvedValueOnce({ data: { users: page(1000, 0) }, error: null })
        .mockResolvedValueOnce({ data: { users: page(2, 1000) }, error: null });

      const users = await getAllUsers();

      expect(users).toHaveLength(1002);
      expect(users[1001].id).toBe("u1001");
      expect(mockListUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
      expect(mockListUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
    });

    it("returns nothing when a later page fails, so no partial list shows", async () => {
      mockCaller("admin");
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockListUsers
        .mockResolvedValueOnce({
          data: { users: Array.from({ length: 1000 }, (_, index) => ({ id: `u${index}`, app_metadata: {} })) },
          error: null,
        })
        .mockResolvedValueOnce({ data: { users: [] }, error: { message: "boom" } });

      expect(await getAllUsers()).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe("addUser", () => {
    it("refuses a steward and creates nothing", async () => {
      mockCaller("steward");

      const result = await addUser({ email: "x@y.com", password: "pass123" });

      expect(result.success).toBe(false);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("writes role and approval flag to app_metadata for an approved admin", async () => {
      mockCaller("admin");
      mockCreateUser.mockResolvedValue({ data: {}, error: null });

      const result = await addUser({ email: "x@y.com", password: "pass123" });

      expect(result).toEqual({ success: true });
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "x@y.com",
        password: "pass123",
        app_metadata: { role: "steward", authenticated: false },
      });
    });
  });

  describe("deleteUser", () => {
    it("refuses a steward and deletes nothing", async () => {
      mockCaller("steward");

      const result = await deleteUser("u1");

      expect(result.success).toBe(false);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it("deletes for an approved admin", async () => {
      mockCaller("admin");
      mockDeleteUser.mockResolvedValue({ error: null });

      expect(await deleteUser("u1")).toEqual({ success: true });
      expect(mockDeleteUser).toHaveBeenCalledWith("u1");
    });
  });

  describe("updateUser", () => {
    it("refuses a steward and writes nothing", async () => {
      mockCaller("steward");

      const result = await updateUser({
        id: "u1",
        email: "x@y.com",
        role: "admin",
        authenticated: true,
      });

      expect(result.success).toBe(false);
      expect(mockGetUserById).not.toHaveBeenCalled();
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("refuses a signed-out caller", async () => {
      mockCaller(null);

      const result = await updateUser({
        id: "u1",
        email: "x@y.com",
        role: "admin",
        authenticated: true,
      });

      expect(result.success).toBe(false);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("refuses an unapproved admin", async () => {
      mockCaller("admin", false);

      const result = await updateUser({
        id: "u1",
        email: "x@y.com",
        role: "admin",
        authenticated: true,
      });

      expect(result.success).toBe(false);
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("fails without writing when the user lookup fails", async () => {
      mockCaller("admin");
      mockGetUserById.mockResolvedValue({
        data: { user: null },
        error: { message: "not found" },
      });

      const result = await updateUser({
        id: "u1",
        email: "x@y.com",
        role: "admin",
        authenticated: true,
      });

      expect(result).toEqual({ success: false, error: "not found" });
      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it("keeps existing app_metadata keys on success for an approved admin", async () => {
      mockCaller("admin");
      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            id: "u1",
            app_metadata: {
              provider: "email",
              providers: ["email"],
              role: "steward",
            },
          },
        },
        error: null,
      });
      mockUpdateUserById.mockResolvedValue({ data: { id: "u1" }, error: null });

      const result = await updateUser({
        id: "u1",
        email: "x@y.com",
        role: "admin",
        authenticated: true,
      });

      expect(result.success).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith("u1", {
        email: "x@y.com",
        app_metadata: {
          provider: "email",
          providers: ["email"],
          role: "admin",
          authenticated: true,
        },
      });
    });
  });
});
