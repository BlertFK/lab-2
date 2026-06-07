# Agencies & Agents Module - Complete Implementation

## Overview
Complete module for managing real estate agencies and agents with repositories, services, controllers, routes, and validators following the existing backend patterns.

## Files Created/Updated

### 1. Repositories

#### **backend/repositories/agencyRepository.js**
- `create(agency)` - Create new agency
- `findById(id)` - Get agency by ID
- `findAll(filters)` - List all agencies with optional status filter
- `findByEmail(email)` - Find agency by email (for duplicate prevention)
- `findByLicenseNumber(licenseNumber)` - Find agency by license number (for duplicate prevention)
- `update(id, data)` - Update agency fields
- `updateStatus(id, status, updatedBy)` - Update agency status

#### **backend/repositories/agentRepository.js**
- `create(agent)` - Create new agent
- `findById(id)` - Get agent by ID with user and agency details
- `findByUserId(userId)` - Find agent by user ID (ensure 1:1 relationship)
- `findAll(filters)` - List all agents with optional filters (status, agency_id, verified)
- `findByAgency(agencyId, filters)` - Get agents by agency with filters
- `update(id, data)` - Update agent fields
- `updateStatus(id, status, updatedBy)` - Update agent status

### 2. Services

#### **backend/services/agencyService.js**
- `createAgency(body, user)` - Validate and create agency, prevent duplicate emails/licenses
- `listAgencies(filters)` - List agencies with optional filters
- `getAgency(id)` - Get single agency or throw 404
- `updateAgency(id, body, user)` - Update agency with duplicate prevention
- `getAgencyWithAgents(id)` - Get agency with all associated agents and count

#### **backend/services/agentService.js**
- `createAgent(body, user)` - Validate user exists, prevent duplicate agents per user
- `listAgents(filters)` - List agents with optional filters
- `getAgent(id)` - Get single agent or throw 404
- `updateAgent(id, body, user)` - Update agent with agency validation
- `updateAgentStatus(id, status, user)` - Update agent status with validation
- `getAgentsByAgency(agencyId, filters)` - Get agents for specific agency

### 3. Controllers

#### **backend/controllers/agencyController.js**
- `createAgency(req, res)` - POST /agencies - Create agency with validation
- `getAgencies(req, res)` - GET /agencies - List all agencies (public)
- `getAgency(req, res)` - GET /agencies/:id - Get single agency (public)
- `updateAgency(req, res)` - PUT /agencies/:id - Update agency (protected)
- `getAgencyWithAgents(req, res)` - GET /agencies/:id/agents - Get agency with agents

#### **backend/controllers/agentController.js**
- `createAgent(req, res)` - POST /agents - Create agent with validation
- `getAgents(req, res)` - GET /agents - List agents (public)
- `getAgent(req, res)` - GET /agents/:id - Get single agent (public)
- `updateAgent(req, res)` - PUT /agents/:id - Update agent (protected)
- `updateAgentStatus(req, res)` - PATCH /agents/:id/status - Update status (protected)
- `getAgentsByAgency(req, res)` - For use with agency routes

### 4. Routes

#### **backend/routes/agencyRoutes.js**
```
GET    /agencies              - List agencies (public)
GET    /agencies/:id          - Get agency details (public)
GET    /agencies/:id/agents   - Get agency with agents (public)
POST   /agencies              - Create agency (protected)
PUT    /agencies/:id          - Update agency (protected)
```

#### **backend/routes/agentRoutes.js**
```
GET    /agents                - List agents (public)
GET    /agents/:id            - Get agent details (public)
POST   /agents                - Create agent (protected)
PUT    /agents/:id            - Update agent (protected)
PATCH  /agents/:id/status     - Update agent status (protected)
```

### 5. Validators

#### **backend/validators/agencyValidator.js**
- `validateCreateAgency(body)` - Validate name, email, license_number
- `validateUpdateAgency(body)` - Validate optional update fields

#### **backend/validators/agentValidator.js**
- `validateCreateAgent(body)` - Validate user_id, license_number
- `validateUpdateAgent(body)` - Validate optional update fields
- `validateUpdateStatus(body)` - Validate status field

### 6. Server Configuration

#### **backend/server.js** (Updated)
- Added agency routes: `app.use("/api/agencies", agencyRoutes)`
- Added agent routes: `app.use("/api/agents", agentRoutes)`

## API Endpoints

### Agencies
```
GET    /api/agencies?status=active
POST   /api/agencies
GET    /api/agencies/:id
PUT    /api/agencies/:id
GET    /api/agencies/:id/agents
```

### Agents
```
GET    /api/agents?status=active&agency_id=1&verified=true
POST   /api/agents
GET    /api/agents/:id
PUT    /api/agents/:id
PATCH  /api/agents/:id/status
```

## Request/Response Examples

### Create Agency
**Request:**
```json
POST /api/agencies
{
  "name": "Premium Estates",
  "email": "info@premium.com",
  "phone": "+123456789",
  "license_number": "LIC-2024-001",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "website": "https://premium.com"
}
```

**Response:**
```json
{
  "message": "Agency created successfully.",
  "agency": {
    "id": 1,
    "name": "Premium Estates",
    "email": "info@premium.com",
    ...
  }
}
```

### Create Agent
**Request:**
```json
POST /api/agents
{
  "user_id": 5,
  "agency_id": 1,
  "license_number": "AGT-2024-001",
  "specialization": "Residential",
  "phone": "+987654321",
  "commission_rate": 5.5
}
```

**Response:**
```json
{
  "message": "Agent created successfully.",
  "agent": {
    "id": 1,
    "user_id": 5,
    "name": "John Doe",
    "email": "john@email.com",
    "agency_id": 1,
    "agency_name": "Premium Estates",
    ...
  }
}
```

## Error Handling

All endpoints follow consistent error handling patterns:
- 400: Validation errors
- 404: Resource not found
- 409: Conflict (duplicate email, license, etc.)
- 500: Server error

Errors return:
```json
{
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Features Implemented

 Complete CRUD operations for agencies and agents
 Input validation with custom validators
 Duplicate prevention (email, license numbers)
 Status management (active, inactive, suspended)
 Agency-Agent relationship management
 Public read endpoints (no authentication required)
 Protected write endpoints (authentication required)
 Comprehensive error handling
 Database relationships with foreign keys
 User tracking (created_by, updated_by)

## Database Schema

### Agencies Table
- id, name, email, phone, address, city, state_province, postal_code, country
- website, license_number, founded_year, description, logo_url, status
- created_by, updated_by, created_at, updated_at

### Agents Table
- id, user_id (unique), agency_id, license_number (unique)
- specialization, phone, bio, profile_image_url, commission_rate
- verified, verified_at, status
- total_sales, total_revenue
- created_by, updated_by, created_at, updated_at

## Integration Notes

1. All modules use existing auth middleware for protected routes
2. Error handling follows existing patterns from offerService/offerController
3. Validators follow existing patterns from offerValidator
4. Database queries use parametrized queries for SQL injection prevention
5. All user operations tracked via created_by/updated_by fields
6. Timestamps automatically managed by database

## Testing

All files have been validated for syntax correctness and are ready for integration testing.
