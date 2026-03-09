# Media Storage Architecture

This document describes how images are uploaded, stored, and retrieved in the SAPAA SIR system.  
The goal is to help future development teams understand how media files flow through the system and how AWS S3 is used.

---

## Overview

Images uploaded through the SAPAA application are stored in **AWS S3**, while their metadata is stored in the **Supabase PostgreSQL database**.

The system uses **presigned URLs** so that users upload files directly to S3 instead of routing large files through the application server.

This approach improves:

- performance
- scalability
- security

---

## High-Level Architecture

### Image Upload Architecture
![Image Upload Architecture](images/awsupload.png)

---

### Image Download Architecture
![Image Download Architecture](images/awsdownload.png)



---

## Image Upload Flow

### Step 1 – User selects an image

A user uploads an image through:

- through a **Site Inspection Report (SIR)** or
- through the **Standalone Image Upload** feature (to be implemented in Sprint-4)

The user may enter metadata such as:

- caption
- description
- identifier    (Sprint-4)
- photographer  (Sprint-4)

---

### Step 2 – Client requests a presigned upload URL

The frontend sends a request to:

```
POST /api/s3/presign
```

The request contains:

- filename
- contentType
- fileSize
- siteId
- responseId
- questionId


The API validates:

- user authentication
- file size
- allowed file types
- required metadata


---

## S3 Storage Structure

**Images are stored in the S3 bucket:** sapaa-inspection-images


**Objects are stored using the following structure:** ```inspections/{siteId}/{responseId}/{questionId}/{uuid}.jpg```


**Example:** ```inspections/207/3235/27/a1b2c3d4.jpg```


### Why a UUID is added

Even if two images have identical metadata, the UUID  prevents file collisions.

This ensures files are **never overwritten**.

---

## Database Metadata Storage

Image metadata is stored in the table: W26_attachments


Important fields include:

| Field | Description |
|-----|-----|
| id | Attachment ID |
| site_id | Associated site |
| response_id | Associated SIR response |
| question_id | Question the image belongs to |
| filename | SAPAA formatted filename |
| storage_key | S3 object key |
| caption | Image caption |
| description | Optional description |
| file_size_bytes | File size |
| content_type | MIME type |


---

## Gallery API Endpoints

This section documents the API endpoints used to retrieve uploaded images and their metadata.

Images are stored in AWS S3 while metadata is stored in the Supabase PostgreSQL database.  
These endpoints generate **temporary signed URLs** so that images can be securely accessed by authenticated users.

---

## API Access Control

Some API endpoints in the SAPAA system are restricted based on user roles.  
In particular, the **gallery administration endpoint** is only accessible to users with the **admin role**.

---

## Admin-only Endpoints


### ``` GET /api/gallery ```


This endpoint returns all uploaded images across all sites along with their associated metadata.

Because this endpoint exposes all media files and metadata in the system, it is protected with a **server-side authorization check**.


#### Access Level

Only users whose role is set to `admin` in their authentication metadata are allowed to access this endpoint.

#### Authorization Logic

When a request is received, the server:

1. Retrieves the currently authenticated user using Supabase authentication.
2. Reads the user's role from their authentication metadata.
3. Verifies that the role is `admin`.
4. Returns a **403 Forbidden** response if the user is not an administrator.

#### Response

Returns a JSON object containing a list of images and their metadata.

Example response:

```json
{
  "items": [
    {
      "id": 14,
      "response_id": 3235,
      "question_id": 27,
      "caption": "Cracked Tree",
      "filename": "ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg",
      "content_type": "image/jpeg",
      "file_size_bytes": 2433304,
      "description": "Large crack running up the trunk of a tree.",
      "storage_key": "inspections/207/3226/27/4c88c01f-8afb-4085-9140-c3bc41e3e00d.jpg",
      "site_id": 207,
      "site_name": "Riverlot 56 (NA)",
      "imageUrl": "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/..."
    }
  ]
}
```
---

## Authentication based endpoint

### ```GET /api/sites/{siteId}/gallery```

Returns images associated with a specific site or inspection response.

This endpoint allows authenticated users to retrieve media files linked to a site inspection or site record.

#### Access Level

Authenticated users only.

Unlike `/api/gallery`, which is restricted to administrators, this endpoint allows normal users to view images associated with sites they have access to.


#### Response

Returns a JSON object containing a list of images and their metadata.

Example response:

```json
{
  "items": [
    {
      "id": 14,
      "caption": "Cracked Tree",
      "filename": "ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg",
      "file_size_bytes": 2433304,
      "description": "Large crack running up the trunk of a tree.",
      "site_name": "Riverlot 56 (NA)",
      "imageUrl": "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/..."
    }
  ]
}
```

---

### ```GET /api/site-images```

Returns image attachments associated with a site or inspection response.

Images are stored in AWS S3 while metadata is stored in the Supabase database.  
This endpoint generates temporary **signed URLs** that allow images to be securely viewed.


#### Access Level

Authenticated users only.

The server verifies that the requester is logged in before returning any image metadata.


#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `siteid` | integer | No | Filters images belonging to a specific site |
| `responseid` | integer | No | Filters images belonging to a specific inspection response |

At least **one** parameter must be provided.


#### Example Requests

**Retrieve images for a site:** ```/api/site-images?siteid=207```


**Retrieve images for an inspection response:** ```/api/site-images?responseid=3235```


**Retrieve images filtered by both:** ```/api/site-images?siteid=207&responseid=3235```



#### Response Format

Returns a JSON object containing an array of images.

Example:

```json
{
  "items": [
    {
      "id": 14,
      "response_id": 3235,
      "question_id": 27,
      "filename": "ClydeFen-2025-01-23-BobSuruncle-ATVTrack.jpg",
      "storage_key": "inspections/207/3235/27/ClydeFen-2025-01-23-BobSuruncle-ATVTrack-a1b2c3d4.jpg",
      "content_type": "image/jpeg",
      "file_size_bytes": 2433304,
      "caption": "Cracked Tree",
      "description": "Large crack running up the trunk of a tree.",
      "site_id": 207,
      "imageUrl": "https://sapaa-inspection-images.s3.ca-central-1.amazonaws.com/..."
    }
  ]
}
```



---

## Security Model

The system protects images using several mechanisms:

### Authentication

Only authenticated users can:

- upload images
- request presigned URLs

---

### Private S3 bucket

The S3 bucket is **not publicly accessible**.

Images are accessed through **temporary signed URLs**. This endpoint generates temporary signed URLs for each image using AWS S3.
These URLs expire after 1 hour, preventing public access to stored images.

---

### Signed URLs

Two types of signed URLs are used:

| Type | Purpose |
|-----|-----|
| Upload URL | Allows client to upload file to S3 |
| Download URL | Allows temporary viewing of image |

Signed URLs expire after a short time.

---

## Why Direct S3 Uploads Are Used

Uploading files directly to S3 provides several benefits:

### Performance

Large files do not pass through the application server.

### Scalability

The backend does not become a bottleneck when many users upload images.

### Security

The server validates requests before issuing upload permissions.

---

## Admin Gallery

Admins can view all uploaded images through the gallery interface.

Features include:

- viewing images
- viewing metadata
- viewing storage path
- inspecting captions and descriptions

Images are displayed using signed S3 URLs generated by the server.

---

## Related API Endpoints

| Endpoint | Purpose |
|-----|-----|
| `/api/s3/presign` | Generate S3 upload URL |
| `/api/gallery` | Retrieve all images |
| `/api/sites/site-images` | Retrieve images for an inspection response |
| `/api/sites/{siteId}/gallery` | Retrieve images for a specific site |

---

## Summary

The SAPAA SIR system stores images in AWS S3 while maintaining metadata in Supabase.

Key features of the architecture include:

- direct client uploads using presigned URLs
- structured storage paths
- standardized file naming
- secure private storage
- scalable image retrieval

This architecture allows SAPAA to efficiently store and organize large numbers of inspection images while maintaining strong security and performance