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
    "/api/homepage-images": {
      get: {
        summary: "Get all homepage image uploads (admin only)",
        tags: ["Homepage Images"],
        description: "Returns all homepage image uploads with metadata and signed URLs. Requires admin role.",
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
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 14 },
                          site_id: { type: "integer", example: 207 },
                          site_name: { type: "string", nullable: true, example: "Riverlot 56 (NA)" },
                          date: { type: "string", example: "2026-03-17" },
                          photographer: { type: "string", nullable: true, example: "Vishal Sivakumar" },
                          caption: { type: "string", nullable: true, example: "CMPUT401W26 Visit" },
                          description: { type: "string", nullable: true, example: "Riverlot56 Visit with Frank Potter!" },
                          filename: { type: "string", example: "Riverlot56NA-2026-03-17-Vishal-CMPUTVisit-A1B2C3D4.jpg" },
                          file_size_bytes: { type: "integer", nullable: true, example: 688724 },
                          storage_key: { type: "string", example: "homepage-image-uploads/207/user-id/filename.jpg" },
                          imageUrl: { type: "string", example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/..." },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden — admin role required" },
          "500": { description: "Failed to load images" },
        },
      },
    },
    
    "/api/homepage-images/{siteId}": {
      get: {
        summary: "Get homepage image uploads for a specific site",
        tags: ["Homepage Images"],
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
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer", example: 14 },
                          site_id: { type: "integer", example: 207 },
                          site_name: { type: "string", nullable: true, example: "Riverlot 56 (NA)" },
                          date: { type: "string", example: "2026-03-17" },
                          photographer: { type: "string", nullable: true, example: "Vishal Sivakumar" },
                          caption: { type: "string", nullable: true, example: "CMPUT401W26 Visit" },
                          description: { type: "string", nullable: true, example: "Riverlot56 Visit with Frank Potter!" },
                          filename: { type: "string", example: "Riverlot56NA-2026-03-17-Vishal-CMPUTVisit-A1B2C3D4.jpg" },
                          file_size_bytes: { type: "integer", nullable: true, example: 688724 },
                          storage_key: { type: "string", example: "homepage-image-uploads/207/user-id/filename.jpg" },
                          imageUrl: { type: "string", example: "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/..." },
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
          "500": { description: "Failed to load images" },
        },
      },
    },
    
    "/api/s3/presign-homepage-images": {
      post: {
        summary: "Generate a presigned S3 upload URL for homepage images",
        tags: ["Uploads"],
        description: "Generates a short-lived presigned S3 URL for uploading a homepage image.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename", "contentType", "fileSize", "siteId"],
                properties: {
                  filename: { type: "string", example: "Riverlot56NA-2026-03-17-Vishal-CMPUTVisit.jpg" },
                  contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp"], example: "image/jpeg" },
                  fileSize: { type: "integer", example: 688724 },
                  siteId: { type: "integer", example: 207 },
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
                    uploadUrl: { type: "string", example: "https://example-bucket.s3.amazonaws.com/..." },
                    key: { type: "string", example: "homepage-image-uploads/207/user-id/filename-A1B2C3D4.jpg" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input, missing siteId, unsupported type, or file too large" },
          "401": { description: "Unauthorized" },
          "500": { description: "Failed to generate upload URL" },
        },
      },
    },

    "/api/pdf": {
      post: {
        summary: "Generate PDF reports for site inspections",
        tags: ["PDF Export"],
        description: "Generates PDF inspection reports in three modes: single inspection response, site summary (all inspections for a site), or multi-site bulk export. Admin-only endpoint. Supports customizable options including image inclusion, page size, sort order, and section selection.",
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    description: "Single inspection response PDF export",
                    required: ["mode", "responseId"],
                    properties: {
                      mode: { type: "string", enum: ["single"], example: "single" },
                      responseId: { type: "integer", example: 3235, description: "ID of the inspection response to export" },
                      options: {
                        $ref: "#/components/schemas/PdfOptions"
                      }
                    }
                  },
                  {
                    type: "object",
                    description: "Site summary PDF export (all inspections for a site)",
                    required: ["mode", "siteName"],
                    properties: {
                      mode: { type: "string", enum: ["site"], example: "site" },
                      siteName: { type: "string", example: "Riverlot 56 (NA)", description: "Name of the site to export" },
                      options: {
                        $ref: "#/components/schemas/PdfOptions"
                      }
                    }
                  },
                  {
                    type: "object",
                    description: "Multi-site bulk PDF export",
                    required: ["mode", "siteNames"],
                    properties: {
                      mode: { type: "string", enum: ["multi-site"], example: "multi-site" },
                      siteNames: {
                        type: "array",
                        minItems: 1,
                        items: { type: "string" },
                        example: ["Riverlot 56 (NA)", "Clyde Fen (NA)"],
                        description: "List of site names to export (minimum 1)"
                      },
                      options: {
                        $ref: "#/components/schemas/PdfOptions"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "PDF generated successfully and returned as binary file",
            content: {
              "application/pdf": {
                schema: {
                  type: "string",
                  format: "binary",
                  description: "PDF file content"
                }
              }
            }
          },
          "400": {
            description: "Invalid request parameters (missing mode, invalid responseId, missing siteName, empty siteNames array, etc.)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Invalid mode, responseId, or siteNames provided"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized — user not authenticated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" }
                  }
                }
              }
            }
          },
          "403": {
            description: "Forbidden — admin role required",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Only admins can generate PDFs" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error — failed to render PDF or fetch data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to render PDF or fetch report data"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  components: {
    schemas: {
      PdfOptions: {
        type: "object",
        description: "Optional configuration for PDF generation",
        properties: {
          includeImages: {
            type: "boolean",
            default: false,
            description: "Whether to include inspection images in the PDF. Note: may significantly increase file size and generation time."
          },
          maxImagesPerInspection: {
            type: "integer",
            default: 5,
            minimum: 0,
            maximum: 20,
            description: "Maximum number of images to include per inspection (clamped to 0-20 range). Only used if includeImages is true."
          },
          includeEmptyAnswers: {
            type: "boolean",
            default: false,
            description: "Whether to include questions that were not answered"
          },
          includeCoverPage: {
            type: "boolean",
            default: true,
            description: "Whether to include a cover page in the PDF"
          },
          includeNaturalnessSummary: {
            type: "boolean",
            default: true,
            description: "Whether to include the naturalness summary section"
          },
          selectedSections: {
            type: "string",
            enum: ["all", "custom"],
            default: "all",
            description: "Which sections to include in the PDF. Currently only 'all' is fully supported."
          },
          sortOrder: {
            type: "string",
            enum: ["newest", "oldest"],
            default: "newest",
            description: "Sort order for inspections in the report"
          },
          pageSize: {
            type: "string",
            enum: ["LETTER", "A4"],
            default: "LETTER",
            description: "Physical page size for the PDF document"
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase JWT authentication token"
      }
    }
  },
  
};
