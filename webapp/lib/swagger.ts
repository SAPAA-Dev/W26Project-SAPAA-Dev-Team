export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SAPAA API",
    version: "1.1.0",
    description: "API documentation for the SAPAA web app",
  },
  servers: [
    { url: "http://localhost:3000" },
    { url: "https://w26-project-sapaa-dev-team.vercel.app" },
    { url: "https://unbribed-veola-quaky.ngrok-free.dev" },
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },

      GalleryItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 14 },
          response_id: { type: "integer", example: 3226 },
          question_id: { type: "integer", example: 27 },
          caption: { type: "string", nullable: true, example: "Cross Country ski trails" },
          identifier: { type: "string", nullable: true, example: "Ski Trails" },
          date: { type: "string", nullable: true, example: "2026-01-31" },
          storage_key: {
            type: "string",
            example: "inspections/207/3226/27/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
          },
          content_type: { type: "string", example: "image/jpeg" },
          file_size_bytes: { type: "integer", nullable: true, example: 506701 },
          filename: {
            type: "string",
            example: "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
          },
          site_id: { type: "integer", example: 207 },
          site_name: { type: "string", nullable: true, example: "Riverlot 56 (NA)" },
          imageUrl: {
            type: "string",
            example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/...",
          },
        },
      },

      SiteImageItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 14 },
          response_id: { type: "integer", example: 3235 },
          question_id: { type: "integer", example: 27 },
          storage_key: {
            type: "string",
            example: "inspections/207/3235/27/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
          },
          filename: {
            type: "string",
            example: "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
          },
          content_type: { type: "string", example: "image/jpeg" },
          file_size_bytes: { type: "integer", nullable: true, example: 506701 },
          caption: { type: "string", nullable: true, example: "Cross Country ski trails" },
          identifier: { type: "string", nullable: true, example: "Ski Trails" },
          site_id: { type: "integer", example: 207 },
          imageUrl: {
            type: "string",
            example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/...",
          },
        },
      },

      SiteGalleryItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 14 },
          caption: { type: "string", nullable: true, example: "Cross Country ski trails" },
          identifier: { type: "string", nullable: true, example: "Ski Trails" },
          filename: {
            type: "string",
            example: "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
          },
          file_size_bytes: { type: "integer", nullable: true, example: 506701 },
          site_name: { type: "string", nullable: true, example: "Riverlot 56 (NA)" },
          response_id: { type: "integer", example: 3235 },
          imageUrl: {
            type: "string",
            example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/...",
          },
        },
      },

      HomepageImageItem: {
      type: "object",
        properties: {
          id: { type: "integer", example: 16 },
          site_id: { type: "integer", example: 207 },
          site_name: { type: "string", nullable: true, example: "Riverlot 56 (NA)" },
          date: { type: "string", example: "2026-01-31" },
          photographer: { type: "string", nullable: true, example: "Raiyana Rahman" },
          caption: { type: "string", nullable: true, example: "Cross Country skil trails" },
          identifier: { type: "string", nullable: true, example: "Ski Trails" },
          filename: {
            type: "string",
            example:
              "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
          },
          file_size_bytes: { type: "integer", nullable: true, example: 506701 },
          storage_key: {
            type: "string",
            example:
              "homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
          },
          imageUrl: {
            type: "string",
            example:
              "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg?...",
          },
        },
      },

      Socials: {
        type: "object",
        description: "Contact details of a person. Every field can be null.",
        properties: {
          email: { type: "string", nullable: true, example: "jane@example.org" },
          phone: { type: "string", nullable: true, example: null },
          website: { type: "string", nullable: true, example: "https://example.org" },
          instagram: { type: "string", nullable: true, example: null },
          facebook: { type: "string", nullable: true, example: null },
          x: { type: "string", nullable: true, example: null },
          linkedin: { type: "string", nullable: true, example: null },
        },
      },

      ProfileResponse: {
        type: "object",
        properties: {
          profile: {
            type: "object",
            properties: {
              id: { type: "integer", example: 12 },
              displayName: { type: "string", example: "Jane Doe" },
              skills: { type: "array", items: { type: "string" }, example: ["Botany"] },
              focusAreas: { type: "array", items: { type: "string" }, example: ["Wetlands"] },
              socials: { $ref: "#/components/schemas/Socials" },
              role: {
                type: "string",
                enum: ["Admin", "Steward"],
                description: "For display only. It never authorizes a request.",
              },
            },
          },
          isOwner: { type: "boolean", example: false },
          stats: {
            type: "object",
            description: "Counts of the active reports that are not archived.",
            properties: {
              inspectionCount: { type: "integer", example: 14 },
              distinctSiteCount: { type: "integer", example: 5 },
            },
          },
          history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 301 },
                siteId: { type: "integer", nullable: true, example: 44 },
                siteName: { type: "string", example: "Elk Island Provincial Park" },
                siteArchived: { type: "boolean", example: false },
                siteInactive: { type: "boolean", example: false },
                inspectionDate: { type: "string", nullable: true, example: "2026-09-30" },
              },
            },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              pageSize: { type: "integer", example: 10 },
              total: { type: "integer", example: 14 },
            },
          },
        },
      },

      PdfOptions: {
        type: "object",
        description: "Optional configuration for PDF generation",
        properties: {
          includeImages: {
            type: "boolean",
            default: false,
          },
          maxImagesPerInspection: {
            type: "integer",
            default: 5,
            minimum: 0,
            maximum: 20,
          },
          includeEmptyAnswers: {
            type: "boolean",
            default: false,
          },
          includeCoverPage: {
            type: "boolean",
            default: true,
          },
          includeNaturalnessSummary: {
            type: "boolean",
            default: true,
          },
          selectedSections: {
            type: "string",
            enum: ["all", "custom"],
            default: "all",
          },
          hiddenQuestionIds: {
            type: "array",
            items: { type: "integer" },
            default: [],
            description: "Question ids to omit from the export. An empty array keeps every question.",
          },
          sortOrder: {
            type: "string",
            enum: ["newest", "oldest"],
            default: "newest",
          },
          pageSize: {
            type: "string",
            enum: ["LETTER", "A4"],
            default: "LETTER",
          },
        },
      },

      PdfJobCreatedResponse: {
        type: "object",
        properties: {
          jobId: {
            type: "string",
            format: "uuid",
            example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
        },
      },

      PdfJobStatusResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "processing", "complete", "failed"],
            example: "complete",
          },
          downloadUrl: {
            type: "string",
            nullable: true,
            description: "Signed S3 URL, present only when status is \"complete\"",
            example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/pdf-exports/...",
          },
          error: {
            type: "string",
            nullable: true,
            description: "Present when status is \"failed\"",
            example: "Site not found",
          },
        },
      },
    },
  },

  paths: {
    "/api/gallery": {
      get: {
        summary: "Get all uploaded inspection gallery images",
        tags: ["Gallery for Image uploads through SITE INSPECTION form"],
        description:
          "Returns all uploaded inspection image attachments with metadata and signed image URLs. Admin only.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Gallery items returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/GalleryItem" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden - admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to load gallery",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/site-images": {
      get: {
        summary: "Get uploaded inspection images by site or response",
        tags: ["Gallery for Image uploads through SITE INSPECTION form"],
        description:
          "Returns uploaded image attachments filtered by site ID and/or response ID. At least one query parameter must be provided.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "siteid",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Filter images by site ID",
            example: 207,
          },
          {
            name: "responseid",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Filter images by response ID",
            example: 3235,
          },
        ],
        responses: {
          "200": {
            description: "Site images returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SiteImageItem" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Provide at least one of: siteid, responseid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to fetch site images",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete one image and its S3 object",
        tags: ["Gallery for Image uploads through SITE INSPECTION form"],
        description:
          "Deletes one attachments or homepage_image_uploads row, then its S3 object. Admin only. When the S3 delete fails after the row is deleted, the response is 200 with storageCleanupComplete false.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            schema: { type: "integer" },
            description: "The id of the image row",
            example: 88,
          },
          {
            name: "kind",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["attachments", "homepage_image_uploads"], default: "attachments" },
            description: "The table of the image row",
          },
        ],
        responses: {
          "200": {
            description: "The row is deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deleted: { type: "boolean", example: true },
                    storageCleanupComplete: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": { description: "Provide a valid image kind, or Provide a numeric attachment id", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Forbidden - not an approved admin", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Attachment not found, or Homepage image not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "422": { description: "The image is stored outside the image folders and cannot be deleted here", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Failed to delete site image", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/sites/{siteId}/gallery": {
      get: {
        summary: "Get gallery images for a specific site",
        tags: ["Gallery for Image uploads through SITE INSPECTION form"],
        description:
          "Returns image attachments for a specific site, including signed URLs. Requires authentication.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "siteId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Site ID",
            example: 207,
          },
        ],
        responses: {
          "200": {
            description: "Gallery items returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SiteGalleryItem" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid site id",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to load gallery",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/homepage-images": {
      get: {
        summary: "Get all homepage image uploads",
        tags: ["Gallery for Image uploads from Homepage"],
        description:
          "Returns all homepage image uploads with metadata and signed URLs. Admin only.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Homepage images returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/HomepageImageItem" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden - admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to load images",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/homepage-images/{siteId}": {
      get: {
        summary: "Get homepage image uploads for a specific site",
        tags: ["Gallery for Image uploads from Homepage"],
        description:
          "Returns homepage image uploads for a specific site, including metadata and signed image URLs. Any signed-in user. RLS returns rows only to approved users.",
        parameters: [
          {
            name: "siteId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Site ID",
            example: 207,
          },
        ],
        responses: {
          "200": {
            description: "Homepage images for site returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/HomepageImageItem" },
                    },
                  },
                  example: {
                    items: [
                      {
                        id: 16,
                        site_id: 207,
                        site_name: "Riverlot 56 (NA)",
                        date: "2026-01-31",
                        photographer: "Raiyana Rahman",
                        caption: "Cross Country skil trails",
                        identifier: "Ski Trails",
                        filename:
                          "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
                        file_size_bytes: 506701,
                        storage_key:
                          "homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg",
                        imageUrl:
                          "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-0642088a-b29f-400a-9ce7-e1003fa1e928.jpg?...",
                      },
                      {
                        id: 21,
                        site_id: 207,
                        site_name: "Riverlot 56 (NA)",
                        date: "2026-01-31",
                        photographer: "Zoe Prefontaine",
                        caption:
                          "A partially broken tree trunk hanging among surrounding tree likely damaged by weather or decay. CMPUT 401 team",
                        identifier: "Broken Tree Trunk",
                        filename:
                          "Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
                        file_size_bytes: 1852012,
                        storage_key:
                          "homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
                        imageUrl:
                          "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/homepage-image-uploads/207/6966742d-b9e7-46c1-842f-030d4a97ba39/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg?...",
                      },
                    ],
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid site id",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to load images",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/s3/presign": {
      post: {
        summary: "Generate a presigned S3 upload URL for inspection images",
        tags: ["Uploads"],
        description:
          "Generates a short-lived presigned S3 URL for uploading an inspection attachment and returns the generated SAPAA filename. The signature pins the content length, so S3 refuses a body of a different size. The route checks the type before it signs. Only the report owner or an approved admin may request a URL for the report.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "filename",
                  "contentType",
                  "fileSize",
                  "responseId",
                  "questionId",
                  "siteId",
                  "siteName",
                  "date",
                  "identifier",
                ],
                properties: {
                  filename: {
                    type: "string",
                    example: "tree-photo.jpg",
                  },
                  contentType: {
                    type: "string",
                    enum: ["image/jpeg", "image/png", "image/webp"],
                    example: "image/jpeg",
                  },
                  fileSize: {
                    type: "integer",
                    example: 245678,
                  },
                  responseId: {
                    type: "integer",
                    example: 3226,
                  },
                  questionId: {
                    type: "integer",
                    example: 27,
                  },
                  siteId: {
                    type: "integer",
                    example: 207,
                  },
                  siteName: {
                    type: "string",
                    example: "Riverlot 56 (NA)",
                  },
                  date: {
                    type: "string",
                    example: "2026-01-31",
                  },
                  photographer: {
                    type: "string",
                    example: "Raiyana Rahman",
                    nullable: true,
                  },
                  identifier: {
                    type: "string",
                    example: "Ski Trails",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Presigned upload URL generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uploadUrl: {
                      type: "string",
                      example: "https://example-bucket.s3.amazonaws.com/...",
                    },
                    key: {
                      type: "string",
                      example: "inspections/207/3226/27/Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
                    },
                    generatedFilename: {
                      type: "string",
                      example: "Riverlot56NA-2026-01-31-RaiyanaRahman-SkiTrails-aa05346a.jpg",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid file data, missing ids, missing image metadata, unsupported file type, or file too large",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "The report does not exist, or the caller is not its owner and is not an approved admin",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to generate upload URL",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/s3/presign-homepage-images": {
      post: {
        summary: "Generate a presigned S3 upload URL for homepage images",
        tags: ["Uploads"],
        description:
          "Generates a short-lived presigned S3 URL for uploading a homepage image using standardized SAPAA filename metadata.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "contentType",
                  "fileSize",
                  "siteId",
                  "siteName",
                  "date",
                  "photographer",
                  "identifier",
                ],
                properties: {
                  contentType: {
                    type: "string",
                    enum: ["image/jpeg", "image/png", "image/webp"],
                    example: "image/jpeg",
                  },
                  fileSize: {
                    type: "integer",
                    example: 688724,
                  },
                  siteId: {
                    type: "integer",
                    example: 207,
                  },
                  siteName: {
                    type: "string",
                    example: "Riverlot 56 (NA)",
                  },
                  date: {
                    type: "string",
                    example: "2026-01-31",
                  },
                  photographer: {
                    type: "string",
                    example: "Zoe Prefontaine",
                  },
                  identifier: {
                    type: "string",
                    example: "Broken Tree Trunk",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Presigned upload URL generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uploadUrl: {
                      type: "string",
                      example: "https://example-bucket.s3.amazonaws.com/...",
                    },
                    key: {
                      type: "string",
                      example: "homepage-image-uploads/207/user-id/Riverlot56NA-2026-01-31-ZoePrefontaine-BrokenTreeTrunk-f6f399ce-3521-4fa4-987a-43cf356c693b.jpg",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid file data, missing metadata, unsupported type, or file too large",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to generate upload URL",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/user-gallery/homepage-upload": {
      get: {
        summary: "Get all homepage image uploads",
        tags: ["User Gallery"],
        description:
          "Returns all homepage image uploads with metadata and signed S3 URLs, ordered by date descending. The items have no storage_key. Requires authentication. RLS returns rows only to approved users.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Homepage images returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/HomepageImageItem" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "500": {
            description: "Failed to load images",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    
    "/api/user-gallery/sir-upload": {
      get: {
        summary: "Get all inspection image attachments",
        tags: ["User Gallery"],
        description:
          "Returns the inspection image attachments (JPEG, PNG, WebP) of active reports that are not archived, across all sites, with resolved site names and signed S3 URLs. Ordered by id descending. The items have no storage_key. Requires authentication. RLS returns rows only to approved users.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Gallery items returned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/GalleryItem" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "500": {
            description: "Failed to load gallery",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/pdf": {
      post: {
        summary: "Start a PDF export job for site inspections",
        tags: ["PDF Export"],
        description:
          "Creates a background job to generate a PDF inspection report in single, site, or multi-site mode. Returns immediately with a jobId — the actual PDF is generated asynchronously. Poll or subscribe to GET /api/pdf/status/{jobId} for completion and the download link. Admins can use every mode. Stewards can only use single mode, and only for a report they submitted.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["mode", "responseId"],
                    properties: {
                      mode: { type: "string", enum: ["single"] },
                      responseId: { type: "integer", example: 3235 },
                      options: { $ref: "#/components/schemas/PdfOptions" },
                    },
                  },
                  {
                    type: "object",
                    required: ["mode", "siteName"],
                    properties: {
                      mode: { type: "string", enum: ["site"] },
                      siteName: { type: "string", example: "Riverlot 56 (NA)" },
                      options: { $ref: "#/components/schemas/PdfOptions" },
                    },
                  },
                  {
                    type: "object",
                    required: ["mode", "siteNames"],
                    properties: {
                      mode: { type: "string", enum: ["multi-site"] },
                      siteNames: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 1,
                        example: ["Riverlot 56 (NA)", "Clyde Fen (NA)"],
                      },
                      options: { $ref: "#/components/schemas/PdfOptions" },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Job created and queued for background processing",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PdfJobCreatedResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description:
              "Forbidden - not an approved admin or steward, a steward requested site or multi-site mode, a steward sent hiddenQuestionIds (only admins can hide fields), or a steward requested a report they did not submit",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Invalid request body, or failed to create export job",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/pdf/status/{jobId}": {
      get: {
        summary: "Get the status of a PDF export job",
        tags: ["PDF Export"],
        description:
          "Returns the current status of a PDF export job. Once status is \"complete\", the response includes a time-limited (1 hour) signed S3 download URL. Only the user who created the job can view it.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "The job ID returned from POST /api/pdf",
            example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
        ],
        responses: {
          "200": {
            description: "Job status retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PdfJobStatusResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "The job belongs to another user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "No job exists with the given ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/profile": {
      get: {
        summary: "Get a profile with its counts and one page of inspection history",
        tags: ["Profiles"],
        description:
          "Returns the profile of personId, or of the caller when personId is not sent. Approved users only. A page has 10 reports. A page that is not a positive number reads page 1, and a page above 100000 reads page 100000. A page after the last report returns an empty history with the real total.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "personId", in: "query", required: false, schema: { type: "integer" }, example: 12 },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 }, example: 1 },
        ],
        responses: {
          "200": {
            description: "The profile",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileResponse" } } },
          },
          "401": { description: "Sign in to view profiles.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Your account is waiting for admin approval.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Profile not found. personId is not a whole number, is larger than a bigint, or no person has that id.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "Unable to load this profile, or Unable to load inspection history", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "503": { description: "The people table does not exist yet", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        summary: "Edit your own profile",
        tags: ["Profiles"],
        description:
          "Updates the profile of the caller with the signed-in client, so row level security and the column grants on people and socials apply. Without socials, the stored contact details do not change.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["displayName", "skills", "focusAreas"],
                properties: {
                  displayName: { type: "string", minLength: 1, maxLength: 29, example: "Jane Doe" },
                  skills: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 40 }, example: ["Botany"] },
                  focusAreas: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 40 }, example: ["Wetlands"] },
                  socials: {
                    $ref: "#/components/schemas/Socials",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "The saved profile. socials is present only when the request sent it.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    profile: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        displayName: { type: "string" },
                        skills: { type: "array", items: { type: "string" } },
                        focusAreas: { type: "array", items: { type: "string" } },
                        socials: { $ref: "#/components/schemas/Socials" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid profile update (not JSON), or the rule that a field breaks. When socials is sent, email is required.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Sign in to edit your profile.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Profile not found.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": {
            description:
              "Unable to save your profile. Or the name, skills and focus areas were saved but the contact details were not; then the body also has profile.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "503": { description: "The people table does not exist yet", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/geocode": {
      get: {
        summary: "Get the coordinates of a place name",
        tags: ["Maps"],
        description: "Calls the OpenCage Geocoding API. The handler has no caller check. The middleware requires an approved session.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, example: "Elk Island Provincial Park" },
        ],
        responses: {
          "200": {
            description: "The coordinates, or coords null when OpenCage finds nothing",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    latitude: { type: "number", example: 53.5731 },
                    longitude: { type: "number", example: -112.8583 },
                    coords: { type: "object", nullable: true, example: null },
                  },
                },
              },
            },
          },
          "400": { description: "Missing q param", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "The OpenCage or network error message", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/heatmap": {
      get: {
        summary: "Count site reports whose name contains a keyword",
        tags: ["Maps"],
        description:
          "Reads the view sites_report_fnr_test with the signed-in client and counts the rows of each site name. Without keyword, data is empty. The handler has no caller check.",
        parameters: [
          { name: "keyword", in: "query", required: false, schema: { type: "string" }, example: "park" },
        ],
        responses: {
          "200": {
            description: "Counts by site name, highest first. message is No sites found when nothing matches.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          namesite: { type: "string", example: "Elk Island Provincial Park" },
                          count: { type: "integer", example: 15 },
                        },
                      },
                    },
                    message: { type: "string", example: "No sites found" },
                  },
                },
              },
            },
          },
          "400": { description: "The Supabase error message", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "500": { description: "The exception message", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/api/openapi": {
      get: {
        summary: "Get this OpenAPI document",
        tags: ["Documentation"],
        description: "Returns webapp/lib/swagger.ts as JSON. /api-docs reads it.",
        responses: {
          "200": { description: "The OpenAPI 3.0 document", content: { "application/json": { schema: { type: "object" } } } },
        },
      },
    },
  },
};
