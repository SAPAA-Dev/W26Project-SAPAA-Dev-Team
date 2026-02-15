import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewReportPage from "../../app/detail/[namesite]/new-report/page";

const PRIVATE = {
  uid:    "uid-123",
  email:  "visitor@example.com",
  name:   "Jane Visitor",
  role:   "visitor",
  avatar: "https://example.com/avatar.jpg",
} as const;

const ALLOWED_ANSWER_KEYS = new Set([
  "response_id",
  "question_id",
  "obs_value",
  "obs_comm",
]);



jest.mock("next/navigation", () => ({
  useParams:   () => ({ namesite: "Elk%20Island" }),
  useRouter:   () => ({ back: jest.fn(), push: jest.fn() }),
  usePathname: () => "/sites/Elk%20Island/new-report",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => {
    const resolvedHref =
      typeof href === "object" && href !== null ? href.pathname ?? "/" : href;
    return <a href={resolvedHref}>{children}</a>;
  },
}));


jest.mock("@/utils/supabase/queries", () => ({
  getQuestionsOnline:          jest.fn().mockResolvedValue([]),
  isSteward:                   jest.fn().mockResolvedValue(true), // skip popup by default
  addSiteInspectionReport:     jest.fn().mockResolvedValue({ id: 99 }),
  getSitesOnline:              jest.fn().mockResolvedValue([]),
  getCurrentUserUid:           jest.fn().mockResolvedValue("uid-123"),
  getCurrentSiteId:            jest.fn().mockResolvedValue("site-456"),
  getQuestionResponseType:     jest.fn().mockResolvedValue([]),
  uploadSiteInspectionAnswers: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id:            "uid-123",
            email:         "visitor@example.com",
            user_metadata: {
              role:       "visitor",
              full_name:  "Jane Visitor",
              avatar_url: "https://example.com/avatar.jpg",
            },
          },
        },
      }),
    },
  }),
}));


beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clear mock call history between tests
beforeEach(() => {
  const queries = require("@/utils/supabase/queries");
  Object.values(queries).forEach((fn: any) => {
    if (typeof fn?.mockClear === "function") fn.mockClear();
  });
});
 
async function submitForm() {
  const {
    uploadSiteInspectionAnswers,
    getQuestionsOnline,
    getQuestionResponseType,
  } = require("@/utils/supabase/queries");

  (getQuestionsOnline as jest.Mock).mockResolvedValueOnce([
    {
      id: 1,
      title: "General observation",
      text: null,
      question_type: "text",
      section: 4,         
      answers: [],
      formorder: 1,
      is_required: false,
    },
  ]);


  (getQuestionResponseType as jest.Mock).mockResolvedValueOnce([
    { question_id: 1, obs_value: 1, obs_comm: 0 },
  ]);

  render(<NewReportPage />);

  await waitFor(() =>
    expect(screen.queryByText(/loading inspection form/i)).not.toBeInTheDocument()
  );

  await waitFor(() =>
    expect(screen.queryByText(/loading questions/i)).not.toBeInTheDocument()
  );

  const submitBtn = screen.getByRole("button", { name: /review & submit/i });
  expect(submitBtn).toBeEnabled();
  await userEvent.click(submitBtn);

  await waitFor(() =>
    expect(uploadSiteInspectionAnswers as jest.Mock).toHaveBeenCalled()
  );

  const rows: Record<string, unknown>[] =
    (uploadSiteInspectionAnswers as jest.Mock).mock.calls[0][0];

  return rows;
}


function allStringValues(rows: Record<string, unknown>[]): string[] {
  return rows.flatMap(row =>
    Object.values(row).filter((v): v is string => typeof v === "string")
  );
}

describe("Private user info – never submitted to the database", () => {


  describe("Payload shape", () => {
    it("uploadSiteInspectionAnswers receives an array", async () => {
      const rows = await submitForm();
      expect(Array.isArray(rows)).toBe(true);
    });

    it("every row contains only the four allowed columns", async () => {
      const rows = await submitForm();

      rows.forEach((row, i) => {
        const extraKeys = Object.keys(row).filter(k => !ALLOWED_ANSWER_KEYS.has(k));
        expect(extraKeys).toHaveLength(0);
        if (extraKeys.length > 0) {
          throw new Error(
            `Row ${i} contains unexpected keys: ${extraKeys.join(", ")}`
          );
        }
      });
    });

    it("no row contains a key named 'email'", async () => {
      const rows = await submitForm();
      rows.forEach(row => expect(row).not.toHaveProperty("email"));
    });

    it("no row contains a key named 'name'", async () => {
      const rows = await submitForm();
      rows.forEach(row => expect(row).not.toHaveProperty("name"));
    });

    it("no row contains a key named 'role'", async () => {
      const rows = await submitForm();
      rows.forEach(row => expect(row).not.toHaveProperty("role"));
    });

    it("no row contains a key named 'uid' or 'user_id' or 'userId'", async () => {
      const rows = await submitForm();
      rows.forEach(row => {
        expect(row).not.toHaveProperty("uid");
        expect(row).not.toHaveProperty("user_id");
        expect(row).not.toHaveProperty("userId");
      });
    });

    it("no row contains a key named 'avatar' or 'avatar_url'", async () => {
      const rows = await submitForm();
      rows.forEach(row => {
        expect(row).not.toHaveProperty("avatar");
        expect(row).not.toHaveProperty("avatar_url");
      });
    });
  });


  describe("Payload values", () => {
    it("the user's email address does not appear in any row value", async () => {
      const rows = await submitForm();
      const strings = allStringValues(rows);
      strings.forEach(val =>
        expect(val).not.toContain(PRIVATE.email)
      );
    });

    it("the user's full name does not appear in any row value", async () => {
      const rows = await submitForm();
      const strings = allStringValues(rows);
      strings.forEach(val =>
        expect(val.toLowerCase()).not.toContain(PRIVATE.name.toLowerCase())
      );
    });

    it("the user's role does not appear in any row value", async () => {
      const rows = await submitForm();
      const strings = allStringValues(rows);
      strings.forEach(val =>
        expect(val.toLowerCase()).not.toContain(PRIVATE.role.toLowerCase())
      );
    });

    it("the user's uid does not appear in any row value", async () => {
      const rows = await submitForm();
      const strings = allStringValues(rows);
      strings.forEach(val =>
        expect(val).not.toContain(PRIVATE.uid)
      );
    });

    it("the user's avatar URL does not appear in any row value", async () => {
      const rows = await submitForm();
      const strings = allStringValues(rows);
      strings.forEach(val =>
        expect(val).not.toContain(PRIVATE.avatar)
      );
    });
  });


  describe("uid scoping", () => {
    it("the uid is passed to addSiteInspectionReport to link the report — not stored in answers", async () => {
      const { addSiteInspectionReport } = require("@/utils/supabase/queries");
      const rows = await submitForm();

      expect(addSiteInspectionReport as jest.Mock).toHaveBeenCalledWith(
        "site-456",
        PRIVATE.uid
      );

      const strings = allStringValues(rows);
      strings.forEach(val => expect(val).not.toContain(PRIVATE.uid));
    });

    it("response_id in each row is the report id — not the user uid", async () => {
      const rows = await submitForm();
      rows.forEach(row => {
        expect(row.response_id).toBe(99);
        expect(row.response_id).not.toBe(PRIVATE.uid);
      });
    });
  });
});