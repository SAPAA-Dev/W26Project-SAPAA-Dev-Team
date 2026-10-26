// __tests__/pages/AdminDashboard.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import * as queries from "@/utils/supabase/queries";

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

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/image", () => function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element -- test mock of next/image
  return <img {...props} alt={props.alt} />;
});
jest.mock("../../app/admin/AdminNavBar", () => function MockAdminNavBar() { return <div>AdminNavBarMock</div>; });
jest.mock("@/components/ProtectedRoute", () => function MockProtectedRoute({ children }: { children: React.ReactNode }) { return <div>{children}</div>; });

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
    jest.mocked(queries.getTotalInspectionCount).mockResolvedValue(5);
    jest.mocked(queries.getLastInspectionDate).mockResolvedValue('2025-11-30T00:00:00Z');
    jest.mocked(queries.getNaturalnessDistribution).mockResolvedValue([{ naturalness_score: 'Good', count: 3 }]);
    jest.mocked(queries.getTopSitesDistribution).mockResolvedValue([{ namesite: 'Alpha', count: 5 }]);

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
});
