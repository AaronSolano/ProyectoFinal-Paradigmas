## Purpose

Especifica las reglas de validación de formato, tamaño y persistencia para la carga de imágenes didácticas asociadas a las preguntas.

## ADDED Requirements

### Requirement: Multipart Image Validation and Storage
The system SHALL provide an endpoint `POST /api/upload` that validates file format, enforces size limits, and persists accepted images to `/app/uploads`.

#### Scenario: Successful image upload
- **WHEN** an authenticated user uploads an image of MIME type `image/jpeg`, `image/png`, or `image/webp` with size $\le 5\text{MB}$
- **THEN** the system generates a unique UUID filename, saves the file in `/app/uploads`, and returns HTTP 201 with the public resource URL.

#### Scenario: Disallowed file type rejection
- **WHEN** a client attempts to upload an executable, script, or unsupported MIME type
- **THEN** the system rejects the file with HTTP 400 Bad Request.

#### Scenario: Oversized file rejection
- **WHEN** a client uploads an image exceeding 5MB
- **THEN** the system rejects the file with HTTP 413 Payload Too Large.
