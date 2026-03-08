// was generated with the help of ChatGPT based on the API implementation in the route.ts files. It is used to generate the OpenAPI spec for our API routes, which can be used for documentation.

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SAPAA API",
    version: "1.0.0",
    description: "API documentation for the SAPAA web app",
  },
  servers: [
    { url: "http://localhost:3000"},
    { url: "https://w26-project-sapaa-dev-team.vercel.app" },
    { url: "https://unbribed-veola-quaky.ngrok-free.dev" }
  ],
  paths: {
    "/api/sites/{siteId}/gallery": {
      get: {
        summary: "Get gallery images for a site",
        tags: ["Gallery"],
        parameters: [
          {
            name: "siteId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Site ID",
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
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          caption: { type: "string", nullable: true },
                          description: { type: "string", nullable: true },
                          filename: { type: "string" },
                          site_name: { type: "string", nullable: true },
                          imageUrl: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid site id" },
          "401": { description: "Unauthorized" },
          "500": { description: "Server error" },
        },
      },
    },



    "/api/s3/presign": {
      post: {
        summary: "Generate a presigned S3 upload URL",
        tags: ["Uploads"],
        description:
          "Generates a short-lived presigned S3 URL for uploading an image attachment.",
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
                      example: "inspections/207/3226/27/abc123.jpg",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid input, missing ids, unsupported type, or file too large",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Invalid file data" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Failed to generate upload URL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to generate upload URL",
                    },
                  },
                },
              },
            },
          },
        },
        },
      },

      
    "/api/site-images": {
        get: {
            summary: "Get site images by site or response",
            tags: ["Gallery"],
            description:
            "Returns uploaded image attachments filtered by site ID and/or response ID. At least one query parameter must be provided.",
            parameters: [
            {
                name: "siteid",
                in: "query",
                required: false,
                schema: {
                type: "integer",
                },
                description: "Filter images by site ID",
                example: 207,
            },
            {
                name: "responseid",
                in: "query",
                required: false,
                schema: {
                type: "integer",
                },
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
                        items: {
                            type: "object",
                            properties: {
                            id: { type: "integer", example: 14 },
                            response_id: { type: "integer", example: 3235 },
                            question_id: { type: "integer", example: 27 },
                            storage_key: {
                                type: "string",
                                example:
                                "inspections/207/3235/27/ClydeFen-2025-01-23-BobSuruncle-ATVTrack-a1b2c3d4.jpg",
                            },
                            filename: {
                                type: "string",
                                example:
                                "ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg",
                            },
                            content_type: {
                                type: "string",
                                example: "image/jpeg",
                            },
                            file_size_bytes: {
                                type: "integer",
                                nullable: true,
                                example: 2433304,
                            },
                            caption: {
                                type: "string",
                                nullable: true,
                                example: "Cracked Tree",
                            },
                            description: {
                                type: "string",
                                nullable: true,
                                example:
                                "Large crack running up the trunk of a tree.",
                            },
                            site_id: {
                                type: "integer",
                                example: 207,
                            },
                            imageUrl: {
                                type: "string",
                                example:
                                "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/...",
                            },
                            },
                        },
                        },
                    },
                    },
                },
                },
            },
            "400": {
                description: "Missing required query parameters",
                content: {
                "application/json": {
                    schema: {
                    type: "object",
                    properties: {
                        error: {
                        type: "string",
                        example: "Provide at least one of: siteid, responseid",
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
                    schema: {
                    type: "object",
                    properties: {
                        error: {
                        type: "string",
                        example: "Unauthorized",
                        },
                    },
                    },
                },
                },
            },
            "500": {
                description: "Failed to fetch site images",
                content: {
                "application/json": {
                    schema: {
                    type: "object",
                    properties: {
                        error: {
                        type: "string",
                        example: "Failed to fetch site images",
                        },
                    },
                    },
                },
                },
            },
            },
        },
        },

    "/api/gallery": {
      get: {
        summary: "Get all uploaded gallery images",
        tags: ["Gallery"],
        description:
          "Returns all uploaded image attachments along with metadata and signed image URLs.",
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
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 14 },
                          response_id: { type: "integer", example: 3226 },
                          question_id: { type: "integer", example: 27 },
                          caption: {
                            type: "string",
                            nullable: true,
                            example: "Cracked Tree",
                          },
                          description: {
                            type: "string",
                            nullable: true,
                            example:
                              "Large crack running up the trunk of a tree.",
                          },
                          storage_key: {
                            type: "string",
                            example:
                              "inspections/207/3226/27/4c88c01f-8afb-4085-9140-c3bc41e3e00d.jpg",
                          },
                          content_type: {
                            type: "string",
                            example: "image/jpeg",
                          },
                          file_size_bytes: {
                            type: "integer",
                            nullable: true,
                            example: 2433304,
                          },
                          filename: {
                            type: "string",
                            example:
                              "RiverLot56_01-31-2026_ZoeP_CrackedTree.jpg",
                          },
                          site_id: {
                            type: "integer",
                            example: 207,
                          },
                          site_name: {
                            type: "string",
                            nullable: true,
                            example: "Riverlot 56 (NA)",
                          },
                          imageUrl: {
                            type: "string",
                            example: "https://sapaa-inspection-images.s3....",
                          },
                        },
                      },
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
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Failed to load gallery",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to load gallery",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  
};
