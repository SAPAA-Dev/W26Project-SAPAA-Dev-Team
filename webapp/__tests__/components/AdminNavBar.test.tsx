import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminNavBar from "@/app/admin/AdminNavBar";
import * as auth from "@/services/auth";
import { navigate } from "@/components/HeaderDropdown";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...properties }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...properties}>{children}</a>
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/admin/dashboard"),
}));

jest.mock("@/services/auth", () => ({
  logout: jest.fn(),
}));

jest.mock("@/components/HeaderDropdown", () => ({
  navigate: jest.fn(),
}));

describe("AdminNavBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Logout when the menu is open", () => {
    render(<AdminNavBar />);

    fireEvent.click(screen.getByTitle("admin dropdown menu"));

    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("links to the all-reports page when the menu is open", () => {
    render(<AdminNavBar />);

    fireEvent.click(screen.getByTitle("admin dropdown menu"));

    expect(screen.getByRole("link", { name: /Reports/ })).toHaveAttribute("href", "/reports");
  });

  it("signs out and returns to the login page", async () => {
    (auth.logout as jest.Mock).mockResolvedValue(undefined);
    render(<AdminNavBar />);

    fireEvent.click(screen.getByTitle("admin dropdown menu"));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith("/login");
    });
  });
});
