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
            description: "Forbidden — admin access required",
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
            description: "Forbidden — admin access required",
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
          "Returns homepage image uploads for a specific site, including metadata and signed image URLs. Admin only.",
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
          "Generates a short-lived presigned S3 URL for uploading an inspection attachment and returns the generated SAPAA filename.",
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
          "Returns all homepage image uploads with metadata and signed S3 URLs, ordered by date descending. Requires authentication.",
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
          "Returns all inspection image attachments (JPEG, PNG, WebP) across all sites, with resolved site names and signed S3 URLs. Ordered by id descending. Requires authentication.",
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
        summary: "Generate PDF reports for site inspections",
        tags: ["PDF Export"],
        description:
          "Generates PDF inspection reports in single, site, or multi-site mode. Admin only.",
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
          "200": {
            description: "PDF generated successfully",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
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
            description: "Forbidden — admin access required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Failed to generate PDF",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};