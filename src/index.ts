#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NotSignedInError, requireAccessToken, resolveAccessToken } from "./auth.js";
import { HhApiError, hhFetch } from "./hh-client.js";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown) {
  const message =
    error instanceof NotSignedInError || error instanceof HhApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : String(error);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

async function optionalToken(): Promise<string | undefined> {
  try {
    return await resolveAccessToken();
  } catch (error) {
    if (error instanceof NotSignedInError) throw error;
    return undefined;
  }
}

const server = new McpServer({
  name: "mcp-hh-ru",
  version: "0.1.0",
});

server.tool(
  "search_vacancies",
  "Search hh.ru vacancies. Works without a token; with a token personalization may apply.",
  {
    text: z.string().optional().describe("Search query"),
    area: z.union([z.string(), z.number()]).optional().describe("Area id (1 = Moscow)"),
    experience: z.string().optional().describe("noExperience | between1And3 | between3And6 | moreThan6"),
    employment: z.string().optional(),
    schedule: z.string().optional(),
    only_with_salary: z.boolean().optional(),
    salary: z.number().optional().describe("Salary from, RUB"),
    page: z.number().int().min(0).optional(),
    per_page: z.number().int().min(1).max(100).optional(),
  },
  async (args) => {
    try {
      const token = await optionalToken();
      const data = await hhFetch({
        path: "/vacancies",
        token,
        query: {
          text: args.text,
          area: args.area,
          experience: args.experience,
          employment: args.employment,
          schedule: args.schedule,
          only_with_salary: args.only_with_salary,
          salary: args.salary,
          page: args.page ?? 0,
          per_page: args.per_page ?? 20,
        },
      });
      return textResult(data);
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_vacancy",
  "Vacancy card by id.",
  { vacancy_id: z.string().describe("Vacancy id") },
  async (args) => {
    try {
      const token = await optionalToken();
      return textResult(
        await hhFetch({ path: `/vacancies/${args.vacancy_id}`, token }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_similar_vacancies",
  "Vacancies similar to the given one.",
  { vacancy_id: z.string() },
  async (args) => {
    try {
      const token = await optionalToken();
      return textResult(
        await hhFetch({
          path: `/vacancies/${args.vacancy_id}/similar_vacancies`,
          token,
        }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_employer",
  "Employer (company) card by id.",
  { employer_id: z.string() },
  async (args) => {
    try {
      const token = await optionalToken();
      return textResult(
        await hhFetch({ path: `/employers/${args.employer_id}`, token }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_areas",
  "Regions and cities tree (or one area by id).",
  { area_id: z.string().optional() },
  async (args) => {
    try {
      const path = args.area_id ? `/areas/${args.area_id}` : "/areas";
      return textResult(await hhFetch({ path }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_dictionaries",
  "hh.ru dictionaries: experience, employment, schedule, and others.",
  {},
  async () => {
    try {
      return textResult(await hhFetch({ path: "/dictionaries" }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_professional_roles",
  "Professional roles catalog used in vacancy filters.",
  {},
  async () => {
    try {
      return textResult(await hhFetch({ path: "/professional_roles" }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_me",
  "Current hh.ru account (/me): applicant and/or employer manager.",
  {},
  async () => {
    try {
      const token = await requireAccessToken();
      return textResult(await hhFetch({ path: "/me", token }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "list_mine_resumes",
  "Resumes of the signed-in applicant.",
  {},
  async () => {
    try {
      const token = await requireAccessToken();
      return textResult(await hhFetch({ path: "/resumes/mine", token }));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_resume",
  "One resume by id (own resume, or a viewed resume for an employer).",
  { resume_id: z.string() },
  async (args) => {
    try {
      const token = await requireAccessToken();
      return textResult(
        await hhFetch({ path: `/resumes/${args.resume_id}`, token }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "list_negotiations",
  "Negotiations (applications / responses). Applicant: own applications. Employer manager: responses to vacancies.",
  {
    page: z.number().int().min(0).optional(),
    per_page: z.number().int().min(1).max(50).optional(),
    vacancy_id: z.string().optional().describe("Employer: filter by vacancy"),
  },
  async (args) => {
    try {
      const token = await requireAccessToken();
      return textResult(
        await hhFetch({
          path: "/negotiations",
          token,
          query: {
            page: args.page ?? 0,
            per_page: args.per_page ?? 20,
            vacancy_id: args.vacancy_id,
          },
        }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "get_negotiation",
  "One negotiation (application) by id, including messages when available.",
  { negotiation_id: z.string() },
  async (args) => {
    try {
      const token = await requireAccessToken();
      return textResult(
        await hhFetch({
          path: `/negotiations/${args.negotiation_id}`,
          token,
        }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "list_employer_vacancies",
  "Vacancies of the employer the signed-in manager belongs to (active by default).",
  {
    employer_id: z
      .string()
      .optional()
      .describe("Defaults to employer.id from /me"),
    page: z.number().int().min(0).optional(),
    per_page: z.number().int().min(1).max(50).optional(),
    archived: z.boolean().optional().describe("If true, list archived"),
  },
  async (args) => {
    try {
      const token = await requireAccessToken();
      let employerId = args.employer_id;
      if (!employerId) {
        const me = await hhFetch<{
          employer?: { id?: string };
        }>({ path: "/me", token });
        employerId = me.employer?.id;
      }
      if (!employerId) {
        return errorResult(
          new Error(
            "No employer on this account. Sign in as an employer manager on hh.ru.",
          ),
        );
      }
      const suffix = args.archived ? "archived" : "active";
      return textResult(
        await hhFetch({
          path: `/employers/${employerId}/vacancies/${suffix}`,
          token,
          query: {
            page: args.page ?? 0,
            per_page: args.per_page ?? 20,
          },
        }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.tool(
  "search_resumes",
  "Employer resume search. Needs an employer account with resume-database access; applicants get 403.",
  {
    text: z.string().optional(),
    area: z.union([z.string(), z.number()]).optional(),
    experience: z.string().optional(),
    page: z.number().int().min(0).optional(),
    per_page: z.number().int().min(1).max(50).optional(),
  },
  async (args) => {
    try {
      const token = await requireAccessToken();
      return textResult(
        await hhFetch({
          path: "/resumes",
          token,
          query: {
            text: args.text,
            area: args.area,
            experience: args.experience,
            page: args.page ?? 0,
            per_page: args.per_page ?? 20,
          },
        }),
      );
    } catch (error) {
      return errorResult(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
