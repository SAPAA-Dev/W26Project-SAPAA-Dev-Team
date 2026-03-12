// __tests__/pages/AdminDashboard.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Must mock these BEFORE importing Dashboard
jest.mock('@/utils/supabase/queries', () => ({
  getTotalInspectionCount: jest.fn().mockResolvedValue(5),
  getLastInspectionDate: jest.fn().mockResolvedValue('2025-11-30T00:00:00Z'),
  getNaturalnessDistribution: jest.fn().mockResolvedValue([{ naturalness_score: 'Good', count: 3 }]),
  getTopSitesDistribution: jest.fn().mockResolvedValue([{ namesite: 'Alpha', count: 5 }]),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    rpc: jest.fn(),
  })),
}));

jest.mock('@/utils/supabase/server', () => ({
  createServerSupabase: jest.fn(),
  createClient: jest.fn(),
}));

jest.mock("../../app/admin/dashboard/components/Map", () => () => <div>MapMock</div>);
jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt} />);
jest.mock("../../app/admin/AdminNavBar", () => () => <div>AdminNavBarMock</div>);
jest.mock("@/components/ProtectedRoute", () => ({ children }: any) => <div>{children}</div>);

// Mock Chart.js to prevent canvas errors in jsdom
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="pie-chart">PieChartMock</div>,
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}));

// Import AFTER mocks
import Dashboard from "../../app/admin/dashboard/page";

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-apply mocks after clearAllMocks since it resets mock implementations
    const queries = require('@/utils/supabase/queries');
    queries.getTotalInspectionCount.mockResolvedValue(5);
    queries.getLastInspectionDate.mockResolvedValue('2025-11-30T00:00:00Z');
    queries.getNaturalnessDistribution.mockResolvedValue([{ naturalness_score: 'Good', count: 3 }]);
    queries.getTopSitesDistribution.mockResolvedValue([{ namesite: 'Alpha', count: 5 }]);

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/api/homepage-images")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes("/api/gallery")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    });
    
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders loading initially", () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("renders stats cards after successful fetch", async () => {
    render(<Dashboard />);
    await waitFor(() =>
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
    );
    expect(screen.getByText("Total Records")).toBeInTheDocument();
    const allText = screen.getAllByText(/5/);
    expect(allText.length).toBeGreaterThan(0);
    expect(screen.getByText("Last Record")).toBeInTheDocument();
    const novemberElements = screen.queryAllByText(/November/);
    const yearElements = screen.queryAllByText(/2025/);
    expect(novemberElements.length + yearElements.length).toBeGreaterThan(0);
  });

  it("renders charts with data", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
    expect(screen.getByText("Naturalness Distribution")).toBeInTheDocument();
    expect(screen.getByText("Top 5 Sites")).toBeInTheDocument();
  });

  it("handles search flow with points", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage-images") || url.includes("/api/gallery")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes("/api/heatmap")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [{ namesite: "SiteA", count: 1 }] }) });
      }
      if (url.includes("/api/geocode")) {
        return Promise.resolve({ ok: true, json: async () => ({ latitude: 1, longitude: 2 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  
    render(<Dashboard />);
    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
  
    const input = screen.getByPlaceholderText(/enter keyword/i);
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
  
    await waitFor(() => {
      expect(screen.getByText(/found 1 location/i)).toBeInTheDocument();
      expect(screen.getByText("MapMock")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("handles search flow with points", async () => {
    jest.useFakeTimers();
  
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage-images") || url.includes("/api/gallery")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes("/api/heatmap")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [{ namesite: "SiteA", count: 1 }] }) });
      }
      if (url.includes("/api/geocode")) {
        return Promise.resolve({ ok: true, json: async () => ({ latitude: 1, longitude: 2 }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  
    render(<Dashboard />);
  
    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
  
    const input = screen.getByPlaceholderText(/enter keyword/i);
    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
  
    // Fast-forward past the 1000ms geocoding delay
    await act(async () => {
      jest.runAllTimers();
    });
  
    await waitFor(() => {
      expect(screen.getByText(/found 1 location/i)).toBeInTheDocument();
      expect(screen.getByText("MapMock")).toBeInTheDocument();
    });
  
    jest.useRealTimers();
  });
  
  it("handles search fetch error", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage-images") || url.includes("/api/gallery")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      if (url.includes("/api/heatmap")) {
        return Promise.reject(new Error("Failed"));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  
    render(<Dashboard />);
    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
  
    const input = screen.getByPlaceholderText(/enter keyword/i);
    fireEvent.change(input, { target: { value: "ErrorTest" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
  
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Search failed: Failed");
    });
  });
  
  it("alerts when search returns no data", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage-images") || url.includes("/api/gallery")) {
        return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
  
    render(<Dashboard />);
    await waitFor(() => expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument());
  
    const input = screen.getByPlaceholderText(/enter keyword/i);
    fireEvent.change(input, { target: { value: "Empty" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
  
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('No sites found matching "Empty"');
    });
  });
});