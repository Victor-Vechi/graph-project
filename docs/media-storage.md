# Media storage

The backend uses one S3-compatible abstraction for both local development and production.

## Local development

`docker compose up --build`

This starts:

- PostgreSQL
- MinIO API on `http://localhost:9000`
- MinIO console on `http://localhost:9001`
- a one-shot `minio-init` service that creates:
  - `graph-public-media`
  - `graph-private-materials`
- the NestJS API

The public bucket receives anonymous read access. The private bucket is accessed with short-lived presigned URLs.

## Environment

See `.env.example`.

`S3_ENDPOINT` is the endpoint used by the backend. Inside Docker it is `http://minio:9000`.

`S3_PUBLIC_ENDPOINT` is the endpoint returned to browsers for public files. Locally it is normally `http://localhost:9000`.

For AWS S3, omit `S3_ENDPOINT`, set AWS credentials/region and set `S3_PUBLIC_ENDPOINT` to the desired public S3 or CDN base URL.

## Post cover uploads

`POST /api/posts/create` and `PUT /api/posts/:id` accept `multipart/form-data`.

Fields:

- `title`
- `content`
- `tags`: JSON array (`[1,2]`) or comma-separated IDs
- `coverAlt` optional
- `cover` optional image file
- `removeCover=true` on update to remove the current cover

The author is taken from the JWT. `userId` from the request body is not trusted.

Accepted post cover formats:

- JPEG
- PNG
- WebP
- GIF

## Materials

`POST /api/materials` and `PUT /api/materials/:id` accept `multipart/form-data`.

Fields:

- `title`
- `description`
- `category`
- `year`
- `tags`: JSON array or comma-separated text
- `file`

Create/update/delete require an admin token.

Public read endpoints:

- `GET /api/materials`
- `GET /api/materials/:id`
- `GET /api/materials/:id/download-url`

Private material files are returned through temporary signed URLs.

Supported material formats include images, PDF, common Office documents, ZIP, text, CSV and JSON.

## Database

The canonical storage reference is `bucket + storageKey`. Environment-specific URLs are never stored in the database.

`MediaAsset` also stores the original filename, MIME type, size, SHA-256 checksum, ETag, kind, visibility and uploader.
