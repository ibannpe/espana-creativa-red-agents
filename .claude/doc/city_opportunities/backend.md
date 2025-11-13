# Arquitectura Backend: Sistema de Ciudades con Oportunidades

**Fecha**: 2025-11-13
**Feature**: City-based Opportunities
**Arquitectura**: Hexagonal (Ports & Adapters)
**Stack**: TypeScript, Express, Supabase

---

## Índice

1. [Visión General](#visión-general)
2. [Domain Layer: Entidades y Value Objects](#domain-layer)
3. [Application Layer: Puertos](#application-layer-puertos)
4. [Application Layer: Use Cases](#application-layer-use-cases)
5. [Infrastructure Layer: Adaptadores](#infrastructure-layer)
6. [Modificaciones a Sistema Existente](#modificaciones-a-sistema-existente)
7. [Migración de Base de Datos](#migración-de-base-de-datos)
8. [Estructura de Carpetas Completa](#estructura-de-carpetas)
9. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
10. [Testing Strategy](#testing-strategy)
11. [Dependency Injection](#dependency-injection)

---

## Visión General

### Requisitos Core

1. **Entidad City**: Nueva entidad de dominio que representa ciudades donde se publican oportunidades
2. **Gestores de Ciudad (City Managers)**: Rol específico que permite crear oportunidades para ciudades asignadas
3. **Oportunidades por Ciudad**: Las oportunidades ahora están vinculadas obligatoriamente a una ciudad
4. **Control de Permisos**:
   - SOLO gestores de ciudad pueden crear oportunidades (para sus ciudades)
   - SOLO creador + gestores de esa ciudad + admins pueden editar/eliminar
5. **Many-to-Many**: Un usuario puede gestionar múltiples ciudades

### Principios Arquitectónicos

- **Domain Purity**: El dominio NO tiene dependencias externas
- **Dependency Inversion**: Todas las dependencias apuntan hacia el dominio
- **Interface Segregation**: Puertos pequeños y específicos
- **Single Responsibility**: Cada use case tiene un único propósito
- **Testability First**: Todo debe ser unit-testeable sin infraestructura

---

## Domain Layer

### 1. Entidad: City

**Ubicación**: `server/domain/entities/City.ts`

```typescript
// ABOUTME: City domain entity representing a geographic location with opportunities
// ABOUTME: Contains business logic for city validation and activation rules

import { CitySlug } from '../value-objects/CitySlug'

export interface CityProps {
  id: number
  name: string
  slug: CitySlug
  imageUrl: string
  description: string | null
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * City Domain Entity
 *
 * Represents a geographic location where opportunities are published.
 * Each city can have multiple city managers who can create opportunities.
 */
export class City {
  private constructor(
    public readonly id: number,
    private _name: string,
    private _slug: CitySlug,
    private _imageUrl: string,
    private _description: string | null,
    private _active: boolean,
    private _displayOrder: number,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a City from props
   */
  static create(props: CityProps): City {
    return new City(
      props.id,
      props.name,
      props.slug,
      props.imageUrl,
      props.description,
      props.active,
      props.displayOrder,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new City (for initial creation)
   */
  static createNew(
    id: number,
    name: string,
    slug: string,
    imageUrl: string,
    options?: {
      description?: string
      active?: boolean
      displayOrder?: number
    }
  ): City {
    const citySlug = CitySlug.create(slug)
    if (!citySlug) {
      throw new Error('Invalid city slug format')
    }

    const now = new Date()
    return new City(
      id,
      name,
      citySlug,
      imageUrl,
      options?.description || null,
      options?.active ?? true,
      options?.displayOrder ?? 0,
      now,
      now
    )
  }

  // Getters
  get name(): string {
    return this._name
  }

  get slug(): CitySlug {
    return this._slug
  }

  get imageUrl(): string {
    return this._imageUrl
  }

  get description(): string | null {
    return this._description
  }

  get active(): boolean {
    return this._active
  }

  get displayOrder(): number {
    return this._displayOrder
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Update city details
   */
  update(updates: {
    name?: string
    slug?: string
    imageUrl?: string
    description?: string | null
    active?: boolean
    displayOrder?: number
  }): void {
    if (updates.name !== undefined) {
      this._name = updates.name
    }
    if (updates.slug !== undefined) {
      const newSlug = CitySlug.create(updates.slug)
      if (!newSlug) {
        throw new Error('Invalid city slug format')
      }
      this._slug = newSlug
    }
    if (updates.imageUrl !== undefined) {
      this._imageUrl = updates.imageUrl
    }
    if (updates.description !== undefined) {
      this._description = updates.description
    }
    if (updates.active !== undefined) {
      this._active = updates.active
    }
    if (updates.displayOrder !== undefined) {
      this._displayOrder = updates.displayOrder
    }

    this._updatedAt = new Date()
    this.validate()
  }

  /**
   * Activate the city (make it visible)
   */
  activate(): void {
    this._active = true
    this._updatedAt = new Date()
  }

  /**
   * Deactivate the city (hide it from public view)
   */
  deactivate(): void {
    this._active = false
    this._updatedAt = new Date()
  }

  /**
   * Check if city is currently accepting opportunities
   */
  isAcceptingOpportunities(): boolean {
    return this._active
  }

  /**
   * Validate city business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id <= 0) {
      throw new Error('City ID must be a positive number')
    }

    // Name validation
    if (!this._name || this._name.trim() === '') {
      throw new Error('City name cannot be empty')
    }
    if (this._name.length < 2) {
      throw new Error('City name must be at least 2 characters')
    }
    if (this._name.length > 100) {
      throw new Error('City name cannot exceed 100 characters')
    }

    // Image URL validation
    if (!this._imageUrl || this._imageUrl.trim() === '') {
      throw new Error('City image URL cannot be empty')
    }
    try {
      new URL(this._imageUrl)
    } catch {
      throw new Error('City image URL must be a valid URL')
    }

    // Description validation (optional but length limit)
    if (this._description && this._description.length > 500) {
      throw new Error('City description cannot exceed 500 characters')
    }

    // Display order validation
    if (this._displayOrder < 0) {
      throw new Error('Display order cannot be negative')
    }

    // Date validation
    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): CityProps {
    return {
      id: this.id,
      name: this._name,
      slug: this._slug,
      imageUrl: this._imageUrl,
      description: this._description,
      active: this._active,
      displayOrder: this._displayOrder,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
```

**Notas de Diseño**:
- `id` es `number` (SERIAL en PostgreSQL), no UUID
- `slug` es un Value Object para asegurar formato válido (lowercase, guiones)
- `active` permite desactivar ciudades sin eliminarlas
- `displayOrder` permite ordenar ciudades en el frontend
- Validaciones de negocio en el constructor (fail-fast)
- Método `isAcceptingOpportunities()` para lógica futura (ej: pausar creación temporalmente)

---

### 2. Value Object: CitySlug

**Ubicación**: `server/domain/value-objects/CitySlug.ts`

```typescript
// ABOUTME: Value object representing a city slug (URL-friendly identifier)
// ABOUTME: Ensures slug format is valid (lowercase, alphanumeric with hyphens)

export class CitySlug {
  private constructor(private readonly value: string) {}

  static create(slug: string): CitySlug | null {
    if (!CitySlug.isValid(slug)) {
      return null
    }
    return new CitySlug(slug.toLowerCase().trim())
  }

  private static isValid(slug: string): boolean {
    // Only lowercase letters, numbers, and hyphens
    // Must start and end with alphanumeric
    // Length between 2 and 100 characters
    const slugRegex = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/
    return slugRegex.test(slug.toLowerCase())
  }

  getValue(): string {
    return this.value
  }

  equals(other: CitySlug): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

**Notas de Diseño**:
- Formato slug estricto: `cordoba`, `tenerife`, `riveria-sacra`
- Inmutable (característica clave de Value Objects)
- Pattern similar a `Email` y `UserId` existentes
- Factory method `create()` retorna `null` si inválido (patrón del proyecto)

---

### 3. Modificación Entidad: Opportunity

**Ubicación**: `server/domain/entities/Opportunity.ts`

**Cambios necesarios**:

```typescript
// Añadir a OpportunityProps
export interface OpportunityProps {
  id: string
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  skillsRequired: string[]
  location?: string  // MANTENER (ciudad física dentro de la ciudad principal)
  remote: boolean
  duration?: string
  compensation?: string
  cityId: number      // ⭐ NUEVO: Obligatorio
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Modificar constructor de Opportunity
export class Opportunity {
  private constructor(
    public readonly id: string,
    private _title: string,
    private _description: string,
    private _type: OpportunityType,
    private _status: OpportunityStatus,
    private _skillsRequired: string[],
    private _location: string | undefined,
    private _remote: boolean,
    private _duration: string | undefined,
    private _compensation: string | undefined,
    private _cityId: number,  // ⭐ NUEVO
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  // Añadir getter
  get cityId(): number {
    return this._cityId
  }

  // Modificar factory createNew()
  static createNew(
    id: string,
    title: string,
    description: string,
    type: OpportunityType,
    skillsRequired: string[],
    cityId: number,        // ⭐ NUEVO parámetro requerido
    createdBy: string,
    options?: {
      location?: string
      remote?: boolean
      duration?: string
      compensation?: string
    }
  ): Opportunity {
    const now = new Date()
    return new Opportunity(
      id,
      title,
      description,
      type,
      'abierta',
      skillsRequired,
      options?.location,
      options?.remote ?? false,
      options?.duration,
      options?.compensation,
      cityId,           // ⭐ NUEVO
      createdBy,
      now,
      now
    )
  }

  // Añadir a validate()
  private validate(): void {
    // ... validaciones existentes ...

    // City ID validation
    if (!this._cityId || this._cityId <= 0) {
      throw new Error('City ID must be a positive number')
    }
  }

  // Actualizar toObject()
  toObject(): OpportunityProps {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      type: this._type,
      status: this._status,
      skillsRequired: this._skillsRequired,
      location: this._location,
      remote: this._remote,
      duration: this._duration,
      compensation: this._compensation,
      cityId: this._cityId,  // ⭐ NUEVO
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }

  /**
   * Business logic: Check if opportunity belongs to a specific city
   */
  belongsToCity(cityId: number): boolean {
    return this._cityId === cityId
  }
}
```

**Notas de Diseño**:
- `cityId` es **obligatorio** (no opcional)
- `location` se mantiene como campo libre para especificar ubicación dentro de la ciudad (ej: "Zona Centro, Córdoba")
- Nuevo método de dominio `belongsToCity()` para validaciones
- Actualizar TODOS los factory methods y constructores

---

## Application Layer: Puertos

### 1. CityRepository Interface

**Ubicación**: `server/application/ports/CityRepository.ts`

```typescript
// ABOUTME: CityRepository port interface defining city data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { City } from '../../domain/entities/City'
import { CitySlug } from '../../domain/value-objects/CitySlug'

export interface CityWithOpportunityCount {
  city: City
  activeOpportunitiesCount: number
}

/**
 * CityRepository Port
 *
 * Defines the contract for city data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface CityRepository {
  /**
   * Find a city by ID
   */
  findById(id: number): Promise<City | null>

  /**
   * Find a city by slug
   */
  findBySlug(slug: CitySlug): Promise<City | null>

  /**
   * Get all cities (optionally only active ones)
   */
  findAll(options?: { activeOnly?: boolean }): Promise<City[]>

  /**
   * Get all cities with their active opportunity count
   */
  findAllWithOpportunityCount(options?: { activeOnly?: boolean }): Promise<CityWithOpportunityCount[]>

  /**
   * Check if city exists
   */
  exists(id: number): Promise<boolean>

  /**
   * Check if slug is already taken (for validation)
   */
  slugExists(slug: CitySlug, excludeCityId?: number): Promise<boolean>

  /**
   * Create a new city (admin only - not used in initial version)
   */
  create(city: City): Promise<City>

  /**
   * Update an existing city (admin only - not used in initial version)
   */
  update(city: City): Promise<City>

  /**
   * Delete a city (admin only - not used in initial version)
   */
  delete(id: number): Promise<void>
}
```

**Notas de Diseño**:
- `findAllWithOpportunityCount()` optimizado para el grid de ciudades
- `slugExists()` permite validar unicidad en updates (excluyendo el propio ID)
- Métodos CRUD incluidos para futuro admin panel (no son prioritarios ahora)

---

### 2. CityManagerRepository Interface

**Ubicación**: `server/application/ports/CityManagerRepository.ts`

```typescript
// ABOUTME: CityManagerRepository port interface for city manager assignments
// ABOUTME: Handles many-to-many relationship between users and cities

import { UserId } from '../../domain/value-objects/UserId'

export interface CityManagerAssignment {
  userId: string
  cityId: number
  assignedAt: Date
}

/**
 * CityManagerRepository Port
 *
 * Defines the contract for city manager data persistence.
 * Manages the many-to-many relationship between users and cities.
 */
export interface CityManagerRepository {
  /**
   * Assign a user as manager of a city (admin only)
   */
  assignManager(userId: UserId, cityId: number): Promise<void>

  /**
   * Remove a user as manager of a city (admin only)
   */
  removeManager(userId: UserId, cityId: number): Promise<void>

  /**
   * Get all cities managed by a user
   */
  getCitiesByManager(userId: UserId): Promise<number[]>

  /**
   * Get all managers of a city
   */
  getManagersByCity(cityId: number): Promise<string[]>

  /**
   * Check if user is manager of a specific city
   */
  isManagerOfCity(userId: UserId, cityId: number): Promise<boolean>

  /**
   * Check if user is manager of ANY city
   */
  isManager(userId: UserId): Promise<boolean>

  /**
   * Get all assignments for a user (with details)
   */
  getAssignmentsByUser(userId: UserId): Promise<CityManagerAssignment[]>
}
```

**Notas de Diseño**:
- Tabla intermedia `city_managers` (users ↔ cities)
- Métodos optimizados para validación de permisos (`isManagerOfCity`, `isManager`)
- Admin panel puede usar `assignManager` / `removeManager`
- Frontend usa `getCitiesByManager` para mostrar ciudades disponibles

---

### 3. Modificación: OpportunityRepository Interface

**Ubicación**: `server/application/ports/OpportunityRepository.ts`

**Cambios necesarios**:

```typescript
// Añadir cityId al filtro
export interface FilterOpportunitiesParams {
  type?: OpportunityType
  status?: OpportunityStatus
  skills?: string[]
  remote?: boolean
  search?: string
  createdBy?: string
  cityId?: number  // ⭐ NUEVO
}

// Añadir método específico para ciudad
export interface OpportunityRepository {
  // ... métodos existentes ...

  /**
   * Get all opportunities for a specific city
   */
  findByCity(cityId: number, filters?: FilterOpportunitiesParams): Promise<OpportunityWithCreator[]>

  /**
   * Count active opportunities for a city
   */
  countActiveByCity(cityId: number): Promise<number>
}
```

**Notas de Diseño**:
- `findByCity()` es un helper específico (podría usar `findAll` con filtro, pero esto es más semántico)
- `countActiveByCity()` usado en el grid de ciudades para mostrar contador

---

## Application Layer: Use Cases

### 1. GetCitiesUseCase

**Ubicación**: `server/application/use-cases/cities/GetCitiesUseCase.ts`

```typescript
// ABOUTME: Use case for retrieving all cities with optional filtering
// ABOUTME: Returns cities with active opportunity counts for grid display

import { CityRepository, CityWithOpportunityCount } from '../../ports/CityRepository'

export interface GetCitiesRequest {
  activeOnly?: boolean
}

/**
 * GetCitiesUseCase
 *
 * Retrieves all cities with their active opportunity counts.
 * Used for displaying the cities grid on /oportunidades page.
 */
export class GetCitiesUseCase {
  constructor(private cityRepository: CityRepository) {}

  async execute(request: GetCitiesRequest = {}): Promise<CityWithOpportunityCount[]> {
    const cities = await this.cityRepository.findAllWithOpportunityCount({
      activeOnly: request.activeOnly ?? true  // Default: only active cities
    })

    // Sort by display_order ASC
    return cities.sort((a, b) => a.city.displayOrder - b.city.displayOrder)
  }
}
```

**Uso**: Frontend llama a `GET /api/cities` → Grid de tarjetas

---

### 2. GetCityBySlugUseCase

**Ubicación**: `server/application/use-cases/cities/GetCityBySlugUseCase.ts`

```typescript
// ABOUTME: Use case for retrieving a city by its slug
// ABOUTME: Used when navigating to /oportunidades/:citySlug

import { City } from '../../../domain/entities/City'
import { CitySlug } from '../../../domain/value-objects/CitySlug'
import { CityRepository } from '../../ports/CityRepository'

export interface GetCityBySlugRequest {
  slug: string
}

export interface GetCityBySlugResponse {
  city: City | null
  error: string | null
}

/**
 * GetCityBySlugUseCase
 *
 * Retrieves a city by its URL slug.
 * Used when user navigates to /oportunidades/:citySlug
 */
export class GetCityBySlugUseCase {
  constructor(private cityRepository: CityRepository) {}

  async execute(request: GetCityBySlugRequest): Promise<GetCityBySlugResponse> {
    // Validate slug format
    const citySlug = CitySlug.create(request.slug)
    if (!citySlug) {
      return {
        city: null,
        error: 'Invalid city slug format'
      }
    }

    // Find city
    const city = await this.cityRepository.findBySlug(citySlug)
    if (!city) {
      return {
        city: null,
        error: 'City not found'
      }
    }

    // Check if city is active
    if (!city.active) {
      return {
        city: null,
        error: 'City is not currently active'
      }
    }

    return {
      city,
      error: null
    }
  }
}
```

**Uso**: Frontend llama a `GET /api/cities/:slug` → Muestra header de ciudad

---

### 3. GetOpportunitiesByCityUseCase

**Ubicación**: `server/application/use-cases/opportunities/GetOpportunitiesByCityUseCase.ts`

```typescript
// ABOUTME: Use case for retrieving opportunities filtered by city
// ABOUTME: Supports additional filters (type, status, skills, etc.)

import {
  OpportunityRepository,
  OpportunityWithCreator,
  FilterOpportunitiesParams
} from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'

export interface GetOpportunitiesByCityRequest {
  cityId: number
  filters?: Omit<FilterOpportunitiesParams, 'cityId'>
}

export interface GetOpportunitiesByCityResponse {
  opportunities: OpportunityWithCreator[]
  error: string | null
}

/**
 * GetOpportunitiesByCityUseCase
 *
 * Retrieves all opportunities for a specific city.
 * Used in /oportunidades/:citySlug page.
 */
export class GetOpportunitiesByCityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository
  ) {}

  async execute(request: GetOpportunitiesByCityRequest): Promise<GetOpportunitiesByCityResponse> {
    // Validate city exists
    const cityExists = await this.cityRepository.exists(request.cityId)
    if (!cityExists) {
      return {
        opportunities: [],
        error: 'City not found'
      }
    }

    // Fetch opportunities
    const opportunities = await this.opportunityRepository.findByCity(
      request.cityId,
      request.filters
    )

    return {
      opportunities,
      error: null
    }
  }
}
```

**Uso**: Frontend llama a `GET /api/opportunities?cityId=1` → Lista de oportunidades

---

### 4. CheckUserIsCityManagerUseCase

**Ubicación**: `server/application/use-cases/cities/CheckUserIsCityManagerUseCase.ts`

```typescript
// ABOUTME: Use case for checking if a user is a city manager
// ABOUTME: Used for permission validation and UI conditional rendering

import { UserId } from '../../../domain/value-objects/UserId'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'

export interface CheckUserIsCityManagerRequest {
  userId: string
  cityId?: number  // If provided, checks specific city; otherwise checks ANY city
}

export interface CheckUserIsCityManagerResponse {
  isManager: boolean
  managedCityIds: number[]
}

/**
 * CheckUserIsCityManagerUseCase
 *
 * Checks if a user is a city manager.
 * Can check for a specific city or just check if user manages any city.
 */
export class CheckUserIsCityManagerUseCase {
  constructor(
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: CheckUserIsCityManagerRequest): Promise<CheckUserIsCityManagerResponse> {
    const userId = UserId.create(request.userId)
    if (!userId) {
      return {
        isManager: false,
        managedCityIds: []
      }
    }

    // Get user to check if admin (admins can manage all cities)
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        isManager: false,
        managedCityIds: []
      }
    }

    // Admins are managers of all cities
    if (user.isAdmin()) {
      return {
        isManager: true,
        managedCityIds: [] // Empty means ALL cities (admin privilege)
      }
    }

    // Check specific city or all cities
    if (request.cityId !== undefined) {
      const isManager = await this.cityManagerRepository.isManagerOfCity(userId, request.cityId)
      return {
        isManager,
        managedCityIds: isManager ? [request.cityId] : []
      }
    } else {
      const managedCityIds = await this.cityManagerRepository.getCitiesByManager(userId)
      return {
        isManager: managedCityIds.length > 0,
        managedCityIds
      }
    }
  }
}
```

**Uso**:
- Frontend: `GET /api/cities/managed` → Devuelve ciudades que el usuario puede gestionar
- Backend: Validación interna en CreateOpportunityUseCase

---

### 5. AssignCityManagerUseCase (Admin Only)

**Ubicación**: `server/application/use-cases/cities/AssignCityManagerUseCase.ts`

```typescript
// ABOUTME: Use case for assigning a user as city manager (admin only)
// ABOUTME: Validates user and city existence before assignment

import { UserId } from '../../../domain/value-objects/UserId'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { CityRepository } from '../../ports/CityRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'

export interface AssignCityManagerRequest {
  adminUserId: string  // User performing the action
  targetUserId: string // User to assign as manager
  cityId: number
}

export interface AssignCityManagerResponse {
  success: boolean
  error: string | null
}

/**
 * AssignCityManagerUseCase
 *
 * Assigns a user as manager of a city.
 * Only admins can perform this action.
 */
export class AssignCityManagerUseCase {
  constructor(
    private cityManagerRepository: CityManagerRepository,
    private cityRepository: CityRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: AssignCityManagerRequest): Promise<AssignCityManagerResponse> {
    // 1. Validate admin user
    const adminUserId = UserId.create(request.adminUserId)
    if (!adminUserId) {
      return {
        success: false,
        error: 'Invalid admin user ID'
      }
    }

    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      return {
        success: false,
        error: 'Only admins can assign city managers'
      }
    }

    // 2. Validate target user
    const targetUserId = UserId.create(request.targetUserId)
    if (!targetUserId) {
      return {
        success: false,
        error: 'Invalid target user ID'
      }
    }

    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      return {
        success: false,
        error: 'Target user not found'
      }
    }

    // 3. Validate city exists
    const city = await this.cityRepository.findById(request.cityId)
    if (!city) {
      return {
        success: false,
        error: 'City not found'
      }
    }

    // 4. Check if already assigned
    const isAlreadyManager = await this.cityManagerRepository.isManagerOfCity(
      targetUserId,
      request.cityId
    )
    if (isAlreadyManager) {
      return {
        success: false,
        error: 'User is already a manager of this city'
      }
    }

    // 5. Assign manager
    await this.cityManagerRepository.assignManager(targetUserId, request.cityId)

    return {
      success: true,
      error: null
    }
  }
}
```

**Uso**: Admin panel → `POST /api/cities/:cityId/managers`

---

### 6. Modificación: CreateOpportunityUseCase

**Ubicación**: `server/application/use-cases/opportunities/CreateOpportunityUseCase.ts`

**CAMBIOS CRÍTICOS**:

```typescript
// ABOUTME: Use case for creating a new opportunity (UPDATED for city-based system)
// ABOUTME: Validates that user is city manager before allowing creation

import { v4 as uuidv4 } from 'uuid'
import { Opportunity, OpportunityType } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface CreateOpportunityDTO {
  title: string
  description: string
  type: OpportunityType
  skillsRequired: string[]
  cityId: number      // ⭐ NUEVO: Obligatorio
  location?: string
  remote?: boolean
  duration?: string
  compensation?: string
  createdBy: string
}

export interface CreateOpportunityResponse {
  opportunity: Opportunity | null
  error: string | null
}

/**
 * CreateOpportunityUseCase
 *
 * Creates a new opportunity with validation.
 * ONLY city managers (or admins) can create opportunities for their cities.
 */
export class CreateOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: CreateOpportunityDTO): Promise<CreateOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.createdBy)
    if (!userId) {
      return {
        opportunity: null,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user and check if exists
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        opportunity: null,
        error: 'User not found'
      }
    }

    // 3. Validate city exists and is active
    const city = await this.cityRepository.findById(dto.cityId)
    if (!city) {
      return {
        opportunity: null,
        error: 'City not found'
      }
    }

    if (!city.isAcceptingOpportunities()) {
      return {
        opportunity: null,
        error: 'This city is not currently accepting new opportunities'
      }
    }

    // 4. ⭐ CRITICAL: Check permission - user must be manager of this city OR admin
    const isAdmin = user.isAdmin()
    const isManagerOfCity = await this.cityManagerRepository.isManagerOfCity(
      userId,
      dto.cityId
    )

    if (!isAdmin && !isManagerOfCity) {
      return {
        opportunity: null,
        error: 'You do not have permission to create opportunities for this city'
      }
    }

    // 5. Create opportunity domain entity
    const opportunity = Opportunity.createNew(
      uuidv4(),
      dto.title,
      dto.description,
      dto.type,
      dto.skillsRequired,
      dto.cityId,  // ⭐ NUEVO parámetro
      dto.createdBy,
      {
        location: dto.location,
        remote: dto.remote,
        duration: dto.duration,
        compensation: dto.compensation
      }
    )

    // 6. Persist
    const created = await this.opportunityRepository.create(opportunity)

    return {
      opportunity: created,
      error: null
    }
  }
}
```

**Notas de Seguridad**:
- Validación de permisos **ANTES** de crear la entidad
- Admins pueden crear en cualquier ciudad
- Gestores solo en sus ciudades asignadas
- Ciudad debe estar activa (`isAcceptingOpportunities()`)

---

### 7. Modificación: UpdateOpportunityUseCase

**Ubicación**: `server/application/use-cases/opportunities/UpdateOpportunityUseCase.ts`

**CAMBIOS CRÍTICOS**:

```typescript
// ABOUTME: Use case for updating an opportunity (UPDATED for city-based permissions)
// ABOUTME: Validates that user is creator, city manager, or admin

import { Opportunity, OpportunityType, OpportunityStatus } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface UpdateOpportunityDTO {
  opportunityId: string
  userId: string  // User performing the update
  updates: {
    title?: string
    description?: string
    type?: OpportunityType
    status?: OpportunityStatus
    skillsRequired?: string[]
    location?: string
    remote?: boolean
    duration?: string
    compensation?: string
    // cityId is NOT updatable (business rule: can't move opportunity to another city)
  }
}

export interface UpdateOpportunityResponse {
  opportunity: Opportunity | null
  error: string | null
}

/**
 * UpdateOpportunityUseCase
 *
 * Updates an existing opportunity.
 * Permission: creator + city managers of that city + admins
 */
export class UpdateOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: UpdateOpportunityDTO): Promise<UpdateOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return {
        opportunity: null,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        opportunity: null,
        error: 'User not found'
      }
    }

    // 3. Get opportunity
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)
    if (!opportunity) {
      return {
        opportunity: null,
        error: 'Opportunity not found'
      }
    }

    // 4. ⭐ CRITICAL: Check permission
    const isCreator = opportunity.isCreator(dto.userId)
    const isAdmin = user.isAdmin()
    const isManagerOfCity = await this.cityManagerRepository.isManagerOfCity(
      userId,
      opportunity.cityId
    )

    if (!isCreator && !isAdmin && !isManagerOfCity) {
      return {
        opportunity: null,
        error: 'You do not have permission to edit this opportunity'
      }
    }

    // 5. Update opportunity
    try {
      opportunity.update(dto.updates)
    } catch (error) {
      return {
        opportunity: null,
        error: error instanceof Error ? error.message : 'Failed to update opportunity'
      }
    }

    // 6. Persist
    const updated = await this.opportunityRepository.update(opportunity)

    return {
      opportunity: updated,
      error: null
    }
  }
}
```

**Regla de Negocio Importante**:
- `cityId` NO es actualizable → una oportunidad NO puede moverse de ciudad
- Si necesitas cambiar la ciudad, debes eliminar y recrear

---

### 8. Modificación: DeleteOpportunityUseCase

**Ubicación**: `server/application/use-cases/opportunities/DeleteOpportunityUseCase.ts`

**CAMBIOS CRÍTICOS**:

```typescript
// ABOUTME: Use case for deleting an opportunity (UPDATED for city-based permissions)
// ABOUTME: Validates that user is creator, city manager, or admin

import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface DeleteOpportunityDTO {
  opportunityId: string
  userId: string  // User performing the deletion
}

export interface DeleteOpportunityResponse {
  success: boolean
  error: string | null
}

/**
 * DeleteOpportunityUseCase
 *
 * Deletes an existing opportunity.
 * Permission: creator + city managers of that city + admins
 */
export class DeleteOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: DeleteOpportunityDTO): Promise<DeleteOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return {
        success: false,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // 3. Get opportunity
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)
    if (!opportunity) {
      return {
        success: false,
        error: 'Opportunity not found'
      }
    }

    // 4. ⭐ CRITICAL: Check permission
    const isCreator = opportunity.isCreator(dto.userId)
    const isAdmin = user.isAdmin()
    const isManagerOfCity = await this.cityManagerRepository.isManagerOfCity(
      userId,
      opportunity.cityId
    )

    if (!isCreator && !isAdmin && !isManagerOfCity) {
      return {
        success: false,
        error: 'You do not have permission to delete this opportunity'
      }
    }

    // 5. Delete
    await this.opportunityRepository.delete(dto.opportunityId)

    return {
      success: true,
      error: null
    }
  }
}
```

---

## Infrastructure Layer

### 1. SupabaseCityRepository

**Ubicación**: `server/infrastructure/adapters/repositories/SupabaseCityRepository.ts`

```typescript
// ABOUTME: Supabase implementation of CityRepository port
// ABOUTME: Handles city data persistence with opportunity count aggregation

import { SupabaseClient } from '@supabase/supabase-js'
import { City } from '../../../domain/entities/City'
import { CitySlug } from '../../../domain/value-objects/CitySlug'
import { CityRepository, CityWithOpportunityCount } from '../../../application/ports/CityRepository'

interface CityRow {
  id: number
  name: string
  slug: string
  image_url: string
  description: string | null
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * SupabaseCityRepository
 *
 * Infrastructure adapter for city persistence using Supabase.
 * Implements CityRepository port from application layer.
 */
export class SupabaseCityRepository implements CityRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: number): Promise<City | null> {
    const { data, error } = await this.supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findBySlug(slug: CitySlug): Promise<City | null> {
    const { data, error } = await this.supabase
      .from('cities')
      .select('*')
      .eq('slug', slug.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<City[]> {
    let query = this.supabase.from('cities').select('*')

    if (options?.activeOnly) {
      query = query.eq('active', true)
    }

    query = query.order('display_order', { ascending: true })

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  async findAllWithOpportunityCount(
    options?: { activeOnly?: boolean }
  ): Promise<CityWithOpportunityCount[]> {
    // Query cities
    const cities = await this.findAll(options)

    // For each city, count active opportunities
    const citiesWithCounts = await Promise.all(
      cities.map(async city => {
        const { count } = await this.supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id)
          .in('status', ['abierta', 'en_progreso'])  // Active statuses

        return {
          city,
          activeOpportunitiesCount: count || 0
        }
      })
    )

    return citiesWithCounts
  }

  async exists(id: number): Promise<boolean> {
    const { count } = await this.supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)

    return (count || 0) > 0
  }

  async slugExists(slug: CitySlug, excludeCityId?: number): Promise<boolean> {
    let query = this.supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug.getValue())

    if (excludeCityId !== undefined) {
      query = query.neq('id', excludeCityId)
    }

    const { count } = await query

    return (count || 0) > 0
  }

  async create(city: City): Promise<City> {
    const row = this.toRow(city)

    const { data, error } = await this.supabase
      .from('cities')
      .insert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create city: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(city: City): Promise<City> {
    const row = this.toRow(city)

    const { data, error } = await this.supabase
      .from('cities')
      .update(row)
      .eq('id', city.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update city: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('cities').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete city: ${error.message}`)
    }
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: CityRow): City {
    const slug = CitySlug.create(row.slug)
    if (!slug) {
      throw new Error(`Invalid city slug in database: ${row.slug}`)
    }

    return City.create({
      id: row.id,
      name: row.name,
      slug,
      imageUrl: row.image_url,
      description: row.description,
      active: row.active,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(city: City): Omit<CityRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: city.id,
      name: city.name,
      slug: city.slug.getValue(),
      image_url: city.imageUrl,
      description: city.description,
      active: city.active,
      display_order: city.displayOrder,
      created_at: city.createdAt.toISOString(),
      updated_at: city.updatedAt.toISOString()
    }
  }
}
```

**Notas de Implementación**:
- `findAllWithOpportunityCount()` hace N+1 queries (podría optimizarse con JOIN, pero es aceptable para 6 ciudades)
- Conversión snake_case ↔ camelCase en `toDomain()` / `toRow()`

---

### 2. SupabaseCityManagerRepository

**Ubicación**: `server/infrastructure/adapters/repositories/SupabaseCityManagerRepository.ts`

```typescript
// ABOUTME: Supabase implementation of CityManagerRepository port
// ABOUTME: Handles city_managers junction table operations

import { SupabaseClient } from '@supabase/supabase-js'
import { UserId } from '../../../domain/value-objects/UserId'
import {
  CityManagerRepository,
  CityManagerAssignment
} from '../../../application/ports/CityManagerRepository'

interface CityManagerRow {
  user_id: string
  city_id: number
  created_at: string
}

/**
 * SupabaseCityManagerRepository
 *
 * Infrastructure adapter for city manager persistence using Supabase.
 * Implements CityManagerRepository port from application layer.
 */
export class SupabaseCityManagerRepository implements CityManagerRepository {
  constructor(private supabase: SupabaseClient) {}

  async assignManager(userId: UserId, cityId: number): Promise<void> {
    const { error } = await this.supabase
      .from('city_managers')
      .insert({
        user_id: userId.getValue(),
        city_id: cityId
      })

    if (error) {
      throw new Error(`Failed to assign city manager: ${error.message}`)
    }
  }

  async removeManager(userId: UserId, cityId: number): Promise<void> {
    const { error } = await this.supabase
      .from('city_managers')
      .delete()
      .eq('user_id', userId.getValue())
      .eq('city_id', cityId)

    if (error) {
      throw new Error(`Failed to remove city manager: ${error.message}`)
    }
  }

  async getCitiesByManager(userId: UserId): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('city_id')
      .eq('user_id', userId.getValue())

    if (error || !data) {
      return []
    }

    return data.map(row => row.city_id)
  }

  async getManagersByCity(cityId: number): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('user_id')
      .eq('city_id', cityId)

    if (error || !data) {
      return []
    }

    return data.map(row => row.user_id)
  }

  async isManagerOfCity(userId: UserId, cityId: number): Promise<boolean> {
    const { count } = await this.supabase
      .from('city_managers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId.getValue())
      .eq('city_id', cityId)

    return (count || 0) > 0
  }

  async isManager(userId: UserId): Promise<boolean> {
    const { count } = await this.supabase
      .from('city_managers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId.getValue())

    return (count || 0) > 0
  }

  async getAssignmentsByUser(userId: UserId): Promise<CityManagerAssignment[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('*')
      .eq('user_id', userId.getValue())

    if (error || !data) {
      return []
    }

    return data.map(row => ({
      userId: row.user_id,
      cityId: row.city_id,
      assignedAt: new Date(row.created_at)
    }))
  }
}
```

---

### 3. Modificación: SupabaseOpportunityRepository

**Ubicación**: `server/infrastructure/adapters/repositories/SupabaseOpportunityRepository.ts`

**Cambios necesarios**:

```typescript
// Añadir city_id a OpportunityRow
interface OpportunityRow {
  id: string
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  skills_required: string[]
  location: string | null
  remote: boolean
  duration: string | null
  compensation: string | null
  city_id: number  // ⭐ NUEVO
  created_by: string
  created_at: string
  updated_at: string
}

// Modificar findAll() para soportar cityId filter
async findAll(filters?: FilterOpportunitiesParams): Promise<OpportunityWithCreator[]> {
  let query = this.supabase
    .from('opportunities')
    .select(`
      *,
      creator:users!opportunities_created_by_fkey(id, name, avatar_url)
    `)

  // ... filtros existentes ...

  // ⭐ NUEVO: City filter
  if (filters?.cityId) {
    query = query.eq('city_id', filters.cityId)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map((row: any) => ({
    opportunity: this.toDomain(row),
    creator: {
      id: row.creator.id,
      name: row.creator.name,
      avatar_url: row.creator.avatar_url,
      professional_title: null
    }
  }))
}

// ⭐ NUEVO: Método específico para ciudad
async findByCity(
  cityId: number,
  filters?: FilterOpportunitiesParams
): Promise<OpportunityWithCreator[]> {
  return this.findAll({ ...filters, cityId })
}

// ⭐ NUEVO: Contar oportunidades activas por ciudad
async countActiveByCity(cityId: number): Promise<number> {
  const { count } = await this.supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', cityId)
    .in('status', ['abierta', 'en_progreso'])

  return count || 0
}

// Modificar toDomain() para incluir cityId
private toDomain(row: OpportunityRow): Opportunity {
  return Opportunity.create({
    id: String(row.id),
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    skillsRequired: row.skills_required,
    location: row.location || undefined,
    remote: row.remote,
    duration: row.duration || undefined,
    compensation: row.compensation || undefined,
    cityId: row.city_id,  // ⭐ NUEVO
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  })
}

// Modificar toRow() para incluir cityId
private toRow(opportunity: Opportunity): Omit<OpportunityRow, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
} {
  return {
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    type: opportunity.type,
    status: opportunity.status,
    skills_required: opportunity.skillsRequired,
    location: opportunity.location || null,
    remote: opportunity.remote,
    duration: opportunity.duration || null,
    compensation: opportunity.compensation || null,
    city_id: opportunity.cityId,  // ⭐ NUEVO
    created_by: opportunity.createdBy,
    created_at: opportunity.createdAt.toISOString(),
    updated_at: opportunity.updatedAt.toISOString()
  }
}
```

---

### 4. API Routes

**Ubicación**: `server/infrastructure/api/routes/cities.routes.ts` (NUEVO)

```typescript
// ABOUTME: Express routes for city-related endpoints
// ABOUTME: Handles city listing, detail view, and manager operations

import { Router } from 'express'
import { Container } from '../../di/container'

const router = Router()

/**
 * GET /api/cities
 * Get all cities with opportunity counts
 */
router.get('/', async (req, res) => {
  try {
    const getCitiesUseCase = Container.getGetCitiesUseCase()
    const cities = await getCitiesUseCase.execute({
      activeOnly: req.query.active !== 'false'
    })

    res.json(cities)
  } catch (error) {
    console.error('Error fetching cities:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

/**
 * GET /api/cities/:slug
 * Get city by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const getCityBySlugUseCase = Container.getGetCityBySlugUseCase()
    const result = await getCityBySlugUseCase.execute({
      slug: req.params.slug
    })

    if (result.error) {
      return res.status(404).json({ error: result.error })
    }

    res.json(result.city)
  } catch (error) {
    console.error('Error fetching city:', error)
    res.status(500).json({ error: 'Failed to fetch city' })
  }
})

/**
 * GET /api/cities/managed
 * Get cities managed by current user
 */
router.get('/managed/list', async (req, res) => {
  try {
    const userId = req.user?.id  // From auth middleware
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const checkUserIsCityManagerUseCase = Container.getCheckUserIsCityManagerUseCase()
    const result = await checkUserIsCityManagerUseCase.execute({ userId })

    res.json({
      isManager: result.isManager,
      managedCityIds: result.managedCityIds
    })
  } catch (error) {
    console.error('Error checking city manager status:', error)
    res.status(500).json({ error: 'Failed to check manager status' })
  }
})

/**
 * POST /api/cities/:cityId/managers
 * Assign a user as city manager (admin only)
 */
router.post('/:cityId/managers', async (req, res) => {
  try {
    const adminUserId = req.user?.id  // From auth middleware
    if (!adminUserId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { targetUserId } = req.body
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' })
    }

    const assignCityManagerUseCase = Container.getAssignCityManagerUseCase()
    const result = await assignCityManagerUseCase.execute({
      adminUserId,
      targetUserId,
      cityId: parseInt(req.params.cityId)
    })

    if (result.error) {
      return res.status(403).json({ error: result.error })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error assigning city manager:', error)
    res.status(500).json({ error: 'Failed to assign city manager' })
  }
})

export default router
```

---

**Ubicación**: `server/infrastructure/api/routes/opportunities.routes.ts` (MODIFICAR)

**Cambios necesarios**:

```typescript
// Modificar POST /api/opportunities
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { title, description, type, skillsRequired, cityId, location, remote, duration, compensation } = req.body

    // ⭐ Validar cityId presente
    if (!cityId) {
      return res.status(400).json({ error: 'cityId is required' })
    }

    const createOpportunityUseCase = Container.getCreateOpportunityUseCase()
    const result = await createOpportunityUseCase.execute({
      title,
      description,
      type,
      skillsRequired,
      cityId: parseInt(cityId),  // ⭐ NUEVO
      location,
      remote,
      duration,
      compensation,
      createdBy: userId
    })

    if (result.error) {
      return res.status(403).json({ error: result.error })
    }

    res.status(201).json(result.opportunity)
  } catch (error) {
    console.error('Error creating opportunity:', error)
    res.status(500).json({ error: 'Failed to create opportunity' })
  }
})

// Resto de endpoints sin cambios (excepto llamar use cases modificados)
```

---

## Migración de Base de Datos

### SQL Migration Script

**Ubicación**: `migrations/009_add_cities_and_city_managers.sql`

```sql
-- Migration: Add cities and city_managers tables
-- Date: 2025-11-13
-- Description: Implements city-based opportunities system

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create city_managers junction table (users ↔ cities)
CREATE TABLE IF NOT EXISTS city_managers (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, city_id)
);

-- 3. Insert initial cities
INSERT INTO cities (name, slug, image_url, description, active, display_order) VALUES
('Córdoba', 'cordoba', 'https://images.unsplash.com/photo-1591964649084-73a2905b0b30?w=800', 'Red de emprendedores en Córdoba', true, 1),
('Tenerife', 'tenerife', 'https://images.unsplash.com/photo-1549480017-d76466c99df6?w=800', 'Red de emprendedores en Tenerife', true, 2),
('Quinto', 'quinto', 'https://images.unsplash.com/photo-1556739398-ed02faa5d1e5?w=800', 'Red de emprendedores en Quinto', true, 3),
('Denia', 'denia', 'https://images.unsplash.com/photo-1509477809798-d6087aee237e?w=800', 'Red de emprendedores en Denia', true, 4),
('Riveria Sacra', 'riveria-sacra', 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800', 'Red de emprendedores en Riveria Sacra', true, 5),
('Mondoñedo', 'mondonedo', 'https://images.unsplash.com/photo-1579005910000-8b4d0a0daee9?w=800', 'Red de emprendedores en Mondoñedo', true, 6);

-- 4. ⚠️ CRITICAL: Drop existing opportunities (clean start as per requirements)
DROP TABLE IF EXISTS opportunities CASCADE;

-- 5. Recreate opportunities table WITH city_id
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'proyecto',
    skills_required TEXT[],
    location VARCHAR(255),
    remote BOOLEAN DEFAULT false,
    duration VARCHAR(100),
    compensation VARCHAR(255),
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,  -- ⭐ NUEVO: Obligatorio
    status VARCHAR(50) DEFAULT 'abierta',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_opportunity_type CHECK (type IN ('proyecto', 'colaboracion', 'empleo', 'mentoria', 'evento', 'otro')),
    CONSTRAINT valid_opportunity_status CHECK (status IN ('abierta', 'en_progreso', 'cerrada', 'cancelada'))
);

-- 6. Create indexes for performance
CREATE INDEX idx_opportunities_city_id ON opportunities(city_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX idx_city_managers_user_id ON city_managers(user_id);
CREATE INDEX idx_city_managers_city_id ON city_managers(city_id);
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_active ON cities(active);

-- 7. RLS Policies for cities (read-only for public)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
ON cities FOR SELECT
USING (true);

-- 8. RLS Policies for city_managers (visible to managers and admins)
ALTER TABLE city_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "City managers can view their assignments"
ON city_managers FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

CREATE POLICY "Only admins can assign city managers"
ON city_managers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

CREATE POLICY "Only admins can remove city managers"
ON city_managers FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1  -- Admin role
    )
);

-- 9. Update RLS Policies for opportunities (now with city manager permission)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update their own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can delete their own opportunities" ON opportunities;

-- New policy: Everyone can view opportunities
CREATE POLICY "Everyone can view opportunities"
ON opportunities FOR SELECT
USING (true);

-- New policy: Only city managers or admins can create opportunities
CREATE POLICY "City managers and admins can create opportunities"
ON opportunities FOR INSERT
WITH CHECK (
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- New policy: Creator, city managers, or admins can update
CREATE POLICY "Creator, city managers, and admins can update opportunities"
ON opportunities FOR UPDATE
USING (
    -- Is creator
    created_by = auth.uid() OR
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- New policy: Creator, city managers, or admins can delete
CREATE POLICY "Creator, city managers, and admins can delete opportunities"
ON opportunities FOR DELETE
USING (
    -- Is creator
    created_by = auth.uid() OR
    -- Is admin
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role_id = 1
    ) OR
    -- Is city manager of this city
    EXISTS (
        SELECT 1 FROM city_managers
        WHERE user_id = auth.uid() AND city_id = opportunities.city_id
    )
);

-- 10. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON cities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**IMPORTANTE**: Este script **ELIMINA** todas las oportunidades existentes. Es una migración destructiva. Ejecutar solo en desarrollo o tras backup.

**Comando de ejecución**:
```bash
PGPASSWORD='OMDYZAy9kgHVYabG' /opt/homebrew/opt/postgresql@16/bin/psql "postgresql://postgres.jbkzymvswvnkrxriyzdx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable" -f migrations/009_add_cities_and_city_managers.sql
```

---

## Estructura de Carpetas

```
server/
├── domain/
│   ├── entities/
│   │   ├── Opportunity.ts          # MODIFICAR: Añadir cityId
│   │   ├── City.ts                 # ⭐ NUEVO
│   │   ├── User.ts
│   │   ├── Message.ts
│   │   └── Connection.ts
│   └── value-objects/
│       ├── CitySlug.ts             # ⭐ NUEVO
│       ├── Email.ts
│       └── UserId.ts
│
├── application/
│   ├── ports/
│   │   ├── CityRepository.ts                    # ⭐ NUEVO
│   │   ├── CityManagerRepository.ts             # ⭐ NUEVO
│   │   ├── OpportunityRepository.ts             # MODIFICAR
│   │   ├── repositories/
│   │   │   └── IUserRepository.ts
│   │   └── services/
│   │       ├── IAuthService.ts
│   │       └── IEmailService.ts
│   │
│   └── use-cases/
│       ├── cities/                              # ⭐ NUEVO
│       │   ├── GetCitiesUseCase.ts
│       │   ├── GetCityBySlugUseCase.ts
│       │   ├── CheckUserIsCityManagerUseCase.ts
│       │   └── AssignCityManagerUseCase.ts
│       │
│       └── opportunities/
│           ├── CreateOpportunityUseCase.ts      # MODIFICAR
│           ├── UpdateOpportunityUseCase.ts      # MODIFICAR
│           ├── DeleteOpportunityUseCase.ts      # MODIFICAR
│           ├── GetOpportunitiesByCityUseCase.ts # ⭐ NUEVO
│           ├── GetOpportunitiesUseCase.ts
│           └── GetOpportunityUseCase.ts
│
└── infrastructure/
    ├── adapters/
    │   ├── repositories/
    │   │   ├── SupabaseCityRepository.ts                # ⭐ NUEVO
    │   │   ├── SupabaseCityManagerRepository.ts         # ⭐ NUEVO
    │   │   ├── SupabaseOpportunityRepository.ts         # MODIFICAR
    │   │   ├── SupabaseUserRepository.ts
    │   │   └── SupabaseMessageRepository.ts
    │   │
    │   └── services/
    │       ├── SupabaseAuthService.ts
    │       └── ResendEmailService.ts
    │
    ├── api/
    │   └── routes/
    │       ├── cities.routes.ts                         # ⭐ NUEVO
    │       ├── opportunities.routes.ts                  # MODIFICAR
    │       ├── users.routes.ts
    │       └── messages.routes.ts
    │
    └── di/
        └── container.ts                                 # MODIFICAR
```

---

## Consideraciones de Seguridad

### 1. Validación de Permisos en Múltiples Capas

**Layer 1: Row Level Security (RLS en Supabase)**
- Protección a nivel de base de datos
- Policies definen quién puede INSERT/UPDATE/DELETE
- Último recurso si la lógica de aplicación falla

**Layer 2: Use Case Layer**
- Validación explícita en `CreateOpportunityUseCase`, `UpdateOpportunityUseCase`, `DeleteOpportunityUseCase`
- Comprobación de permisos ANTES de operación

**Layer 3: API Routes**
- Middleware de autenticación verifica token JWT
- Validación de entrada (Zod schemas)

### 2. Edge Cases Importantes

**Caso 1: Usuario es Admin**
- Puede crear oportunidades en cualquier ciudad
- Puede editar/eliminar cualquier oportunidad
- `managedCityIds` vacío significa "todas" para admins

**Caso 2: Usuario Gestor de Múltiples Ciudades**
- Frontend debe permitir seleccionar ciudad al crear oportunidad
- Solo puede crear en SUS ciudades asignadas
- Puede editar/eliminar oportunidades de CUALQUIERA de sus ciudades

**Caso 3: Usuario No Gestor**
- NO puede crear oportunidades
- Solo puede editar/eliminar las que creó (si tenía permisos antes)

**Caso 4: Ciudad Desactivada**
- `city.active = false`
- No aparece en grid de ciudades
- NO se pueden crear nuevas oportunidades
- Las oportunidades existentes siguen visibles pero no editables

### 3. Prevención de Privilege Escalation

**Validación en AssignCityManagerUseCase**:
1. Verificar que quien asigna es admin
2. Verificar que usuario objetivo existe
3. Verificar que ciudad existe
4. Verificar que no está ya asignado (evitar duplicados)

**Validación en CreateOpportunityUseCase**:
1. Verificar que usuario existe
2. Verificar que ciudad existe y está activa
3. Verificar permisos (admin O gestor de esa ciudad)
4. Solo entonces crear

### 4. Tokens y Autenticación

**IMPORTANTE**: Los endpoints que requieren autenticación necesitan middleware que:
- Verifica JWT token en header `Authorization: Bearer <token>`
- Extrae `userId` del token
- Añade `req.user = { id: userId }` para uso en routes

**Ejemplo Middleware** (ya existente en proyecto):
```typescript
// server/infrastructure/api/middleware/auth.middleware.ts
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = { id: user.id }
  next()
}
```

Aplicar en routes:
```typescript
router.post('/opportunities', authMiddleware, async (req, res) => { ... })
```

---

## Testing Strategy

### 1. Domain Layer Tests (Pure Unit Tests)

**City.test.ts**:
```typescript
describe('City Entity', () => {
  it('should create a valid city', () => {
    const city = City.createNew(1, 'Córdoba', 'cordoba', 'https://example.com/image.jpg')
    expect(city.name).toBe('Córdoba')
    expect(city.slug.getValue()).toBe('cordoba')
  })

  it('should throw on invalid slug', () => {
    expect(() => City.createNew(1, 'Test', 'INVALID SLUG', 'https://example.com/image.jpg'))
      .toThrow('Invalid city slug format')
  })

  it('should activate/deactivate city', () => {
    const city = City.createNew(1, 'Test', 'test', 'https://example.com/image.jpg', { active: false })
    expect(city.active).toBe(false)

    city.activate()
    expect(city.active).toBe(true)

    city.deactivate()
    expect(city.active).toBe(false)
  })
})
```

**CitySlug.test.ts**:
```typescript
describe('CitySlug Value Object', () => {
  it('should create valid slugs', () => {
    expect(CitySlug.create('cordoba')).toBeTruthy()
    expect(CitySlug.create('riveria-sacra')).toBeTruthy()
  })

  it('should reject invalid slugs', () => {
    expect(CitySlug.create('UPPERCASE')).toBeNull()
    expect(CitySlug.create('with spaces')).toBeNull()
    expect(CitySlug.create('under_scores')).toBeNull()
    expect(CitySlug.create('-starts-with-dash')).toBeNull()
  })
})
```

**Opportunity.test.ts** (añadir tests para cityId):
```typescript
describe('Opportunity Entity with City', () => {
  it('should require cityId', () => {
    expect(() => Opportunity.createNew(
      uuid(),
      'Test Opportunity',
      'Description',
      'proyecto',
      ['skill1'],
      0,  // Invalid cityId
      'user-id'
    )).toThrow('City ID must be a positive number')
  })

  it('should check belongsToCity', () => {
    const opportunity = Opportunity.createNew(
      uuid(),
      'Test',
      'Description',
      'proyecto',
      ['skill1'],
      1,  // cityId
      'user-id'
    )

    expect(opportunity.belongsToCity(1)).toBe(true)
    expect(opportunity.belongsToCity(2)).toBe(false)
  })
})
```

### 2. Use Case Tests (Con Mocks)

**CreateOpportunityUseCase.test.ts** (actualizar):
```typescript
describe('CreateOpportunityUseCase with City Validation', () => {
  let useCase: CreateOpportunityUseCase
  let mockOpportunityRepo: jest.Mocked<OpportunityRepository>
  let mockCityRepo: jest.Mocked<CityRepository>
  let mockCityManagerRepo: jest.Mocked<CityManagerRepository>
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(() => {
    mockOpportunityRepo = { create: jest.fn() } as any
    mockCityRepo = {
      findById: jest.fn(),
      exists: jest.fn()
    } as any
    mockCityManagerRepo = {
      isManagerOfCity: jest.fn()
    } as any
    mockUserRepo = {
      findById: jest.fn()
    } as any

    useCase = new CreateOpportunityUseCase(
      mockOpportunityRepo,
      mockCityRepo,
      mockCityManagerRepo,
      mockUserRepo
    )
  })

  it('should reject if user is not city manager', async () => {
    mockUserRepo.findById.mockResolvedValue(mockUser({ isAdmin: false }))
    mockCityRepo.findById.mockResolvedValue(mockCity({ active: true }))
    mockCityManagerRepo.isManagerOfCity.mockResolvedValue(false)

    const result = await useCase.execute({
      title: 'Test',
      description: 'Description',
      type: 'proyecto',
      skillsRequired: ['skill'],
      cityId: 1,
      createdBy: 'user-id'
    })

    expect(result.error).toBe('You do not have permission to create opportunities for this city')
  })

  it('should allow admin to create in any city', async () => {
    mockUserRepo.findById.mockResolvedValue(mockUser({ isAdmin: true }))
    mockCityRepo.findById.mockResolvedValue(mockCity({ active: true }))
    mockOpportunityRepo.create.mockResolvedValue(mockOpportunity())

    const result = await useCase.execute({
      title: 'Test',
      description: 'Description',
      type: 'proyecto',
      skillsRequired: ['skill'],
      cityId: 1,
      createdBy: 'admin-id'
    })

    expect(result.error).toBeNull()
    expect(result.opportunity).toBeTruthy()
  })

  it('should allow city manager to create in their city', async () => {
    mockUserRepo.findById.mockResolvedValue(mockUser({ isAdmin: false }))
    mockCityRepo.findById.mockResolvedValue(mockCity({ active: true }))
    mockCityManagerRepo.isManagerOfCity.mockResolvedValue(true)
    mockOpportunityRepo.create.mockResolvedValue(mockOpportunity())

    const result = await useCase.execute({
      title: 'Test',
      description: 'Description',
      type: 'proyecto',
      skillsRequired: ['skill'],
      cityId: 1,
      createdBy: 'manager-id'
    })

    expect(result.error).toBeNull()
    expect(result.opportunity).toBeTruthy()
  })
})
```

### 3. Integration Tests (Opcional, con Supabase Local)

Solo si se configura Supabase local test instance.

### 4. Tests Críticos Requeridos

Según la política del proyecto (`yarn test:critical`), TODOS estos tests deben pasar:

**Path Crítico**:
- ✅ `City.test.ts`
- ✅ `CitySlug.test.ts`
- ✅ `Opportunity.test.ts` (updated)
- ✅ `CreateOpportunityUseCase.test.ts` (updated)
- ✅ Todos los tests existentes del path crítico

**Ejecutar antes de commit**:
```bash
yarn test:critical
```

---

## Dependency Injection

### Modificación del Container

**Ubicación**: `server/infrastructure/di/container.ts`

**Cambios necesarios**:

```typescript
// 1. Importar nuevos repositorios
import { SupabaseCityRepository } from '../adapters/repositories/SupabaseCityRepository'
import { SupabaseCityManagerRepository } from '../adapters/repositories/SupabaseCityManagerRepository'
import { CityRepository } from '../../application/ports/CityRepository'
import { CityManagerRepository } from '../../application/ports/CityManagerRepository'

// 2. Importar nuevos use cases
import { GetCitiesUseCase } from '../../application/use-cases/cities/GetCitiesUseCase'
import { GetCityBySlugUseCase } from '../../application/use-cases/cities/GetCityBySlugUseCase'
import { CheckUserIsCityManagerUseCase } from '../../application/use-cases/cities/CheckUserIsCityManagerUseCase'
import { AssignCityManagerUseCase } from '../../application/use-cases/cities/AssignCityManagerUseCase'
import { GetOpportunitiesByCityUseCase } from '../../application/use-cases/opportunities/GetOpportunitiesByCityUseCase'

export class Container {
  // Añadir singletons
  private static cityRepository: CityRepository
  private static cityManagerRepository: CityManagerRepository

  // Añadir use cases
  private static getCitiesUseCase: GetCitiesUseCase
  private static getCityBySlugUseCase: GetCityBySlugUseCase
  private static checkUserIsCityManagerUseCase: CheckUserIsCityManagerUseCase
  private static assignCityManagerUseCase: AssignCityManagerUseCase
  private static getOpportunitiesByCityUseCase: GetOpportunitiesByCityUseCase

  static initialize() {
    const supabase = createClient(...)

    // Inicializar nuevos repositorios
    this.cityRepository = new SupabaseCityRepository(supabase)
    this.cityManagerRepository = new SupabaseCityManagerRepository(supabase)

    // ... repositorios existentes ...

    // Inicializar nuevos use cases
    this.getCitiesUseCase = new GetCitiesUseCase(
      this.cityRepository
    )

    this.getCityBySlugUseCase = new GetCityBySlugUseCase(
      this.cityRepository
    )

    this.checkUserIsCityManagerUseCase = new CheckUserIsCityManagerUseCase(
      this.cityManagerRepository,
      this.userRepository
    )

    this.assignCityManagerUseCase = new AssignCityManagerUseCase(
      this.cityManagerRepository,
      this.cityRepository,
      this.userRepository
    )

    this.getOpportunitiesByCityUseCase = new GetOpportunitiesByCityUseCase(
      this.opportunityRepository,
      this.cityRepository
    )

    // ⭐ MODIFICAR use cases existentes (añadir dependencias)
    this.createOpportunityUseCase = new CreateOpportunityUseCase(
      this.opportunityRepository,
      this.cityRepository,           // ⭐ NUEVO
      this.cityManagerRepository,    // ⭐ NUEVO
      this.userRepository            // ⭐ NUEVO
    )

    this.updateOpportunityUseCase = new UpdateOpportunityUseCase(
      this.opportunityRepository,
      this.cityManagerRepository,    // ⭐ NUEVO
      this.userRepository            // ⭐ NUEVO
    )

    this.deleteOpportunityUseCase = new DeleteOpportunityUseCase(
      this.opportunityRepository,
      this.cityManagerRepository,    // ⭐ NUEVO
      this.userRepository            // ⭐ NUEVO
    )
  }

  // Getters para nuevos use cases
  static getGetCitiesUseCase(): GetCitiesUseCase {
    return this.getCitiesUseCase
  }

  static getGetCityBySlugUseCase(): GetCityBySlugUseCase {
    return this.getCityBySlugUseCase
  }

  static getCheckUserIsCityManagerUseCase(): CheckUserIsCityManagerUseCase {
    return this.checkUserIsCityManagerUseCase
  }

  static getAssignCityManagerUseCase(): AssignCityManagerUseCase {
    return this.assignCityManagerUseCase
  }

  static getGetOpportunitiesByCityUseCase(): GetOpportunitiesByCityUseCase {
    return this.getOpportunitiesByCityUseCase
  }
}
```

---

## Resumen de Archivos a Crear/Modificar

### ⭐ NUEVOS (13 archivos)

**Domain**:
1. `server/domain/entities/City.ts`
2. `server/domain/value-objects/CitySlug.ts`
3. `server/domain/value-objects/CitySlug.test.ts`

**Application - Ports**:
4. `server/application/ports/CityRepository.ts`
5. `server/application/ports/CityManagerRepository.ts`

**Application - Use Cases**:
6. `server/application/use-cases/cities/GetCitiesUseCase.ts`
7. `server/application/use-cases/cities/GetCityBySlugUseCase.ts`
8. `server/application/use-cases/cities/CheckUserIsCityManagerUseCase.ts`
9. `server/application/use-cases/cities/AssignCityManagerUseCase.ts`
10. `server/application/use-cases/opportunities/GetOpportunitiesByCityUseCase.ts`

**Infrastructure**:
11. `server/infrastructure/adapters/repositories/SupabaseCityRepository.ts`
12. `server/infrastructure/adapters/repositories/SupabaseCityManagerRepository.ts`
13. `server/infrastructure/api/routes/cities.routes.ts`

### 🔧 MODIFICAR (7 archivos)

**Domain**:
1. `server/domain/entities/Opportunity.ts` (añadir `cityId`)

**Application**:
2. `server/application/ports/OpportunityRepository.ts` (añadir métodos `findByCity`, `countActiveByCity`)
3. `server/application/use-cases/opportunities/CreateOpportunityUseCase.ts` (validación permisos)
4. `server/application/use-cases/opportunities/UpdateOpportunityUseCase.ts` (validación permisos)
5. `server/application/use-cases/opportunities/DeleteOpportunityUseCase.ts` (validación permisos)

**Infrastructure**:
6. `server/infrastructure/adapters/repositories/SupabaseOpportunityRepository.ts` (añadir `city_id`)
7. `server/infrastructure/di/container.ts` (inyectar nuevas dependencias)

### 📝 MIGRACIÓN

8. `migrations/009_add_cities_and_city_managers.sql`

---

## Notas Finales para el Implementador

### 1. Orden de Implementación Recomendado

**Fase 1: Domain & Value Objects** (sin dependencias)
1. `CitySlug.ts`
2. `CitySlug.test.ts`
3. `City.ts`
4. Modificar `Opportunity.ts`

**Fase 2: Ports** (interfaces)
5. `CityRepository.ts`
6. `CityManagerRepository.ts`
7. Modificar `OpportunityRepository.ts`

**Fase 3: Use Cases** (lógica de aplicación)
8. `GetCitiesUseCase.ts`
9. `GetCityBySlugUseCase.ts`
10. `CheckUserIsCityManagerUseCase.ts`
11. `AssignCityManagerUseCase.ts`
12. `GetOpportunitiesByCityUseCase.ts`
13. Modificar `CreateOpportunityUseCase.ts`
14. Modificar `UpdateOpportunityUseCase.ts`
15. Modificar `DeleteOpportunityUseCase.ts`

**Fase 4: Infrastructure** (adaptadores)
16. `SupabaseCityRepository.ts`
17. `SupabaseCityManagerRepository.ts`
18. Modificar `SupabaseOpportunityRepository.ts`

**Fase 5: API & DI**
19. `cities.routes.ts`
20. Modificar `container.ts`

**Fase 6: Database**
21. Ejecutar migration SQL

**Fase 7: Tests**
22. Escribir tests para cada nueva entidad/use case
23. Ejecutar `yarn test:critical`

### 2. Puntos Críticos de Atención

⚠️ **BREAKING CHANGES**:
- La tabla `opportunities` se recreará → PÉRDIDA DE DATOS
- TODOS los use cases de oportunidades cambian firma
- Frontend necesitará actualizaciones en schemas Zod

⚠️ **Dependencias Circulares**:
- Evitar importar `User` en `Opportunity` directamente
- Usar `string` para `userId`, validar con `UserId.create()` en use cases

⚠️ **RLS Policies**:
- Las policies de Supabase son la última línea de defensa
- SIEMPRE validar permisos en use cases también
- No confiar solo en RLS

### 3. Compatibilidad con Frontend

El frontend necesitará:
- Schemas Zod actualizados con `cityId: z.number()`
- Nuevo servicio `city.service.ts`
- Nuevos hooks `useCitiesQuery`, `useCityBySlugQuery`, `useUserManagedCitiesQuery`
- Modificar `useCreateOpportunityMutation` para incluir `cityId`

Estas actualizaciones serán propuestas por el agente `frontend-developer`.

### 4. Testing antes de Deployment

**Checklist**:
- [ ] Todos los tests unitarios pasan (`yarn test`)
- [ ] Tests críticos pasan (`yarn test:critical`)
- [ ] Migration SQL ejecutada correctamente
- [ ] Verificar RLS policies en Supabase dashboard
- [ ] Test manual: Admin puede crear en cualquier ciudad
- [ ] Test manual: Gestor solo puede crear en su ciudad
- [ ] Test manual: Usuario normal NO puede crear
- [ ] Test manual: Grid de ciudades muestra contador correcto

---

**Fin del documento de arquitectura backend.**

Este documento debe leerse en conjunto con el plan de frontend que será generado por otro agente especializado.
