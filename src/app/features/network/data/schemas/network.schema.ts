// ABOUTME: Zod schemas for network feature (user connections and search)
// ABOUTME: Extends profile schemas with connection-specific types

import { z } from 'zod'
import { userProfileSchema } from '@/app/features/profile/data/schemas/profile.schema'

// Connection status enum
export const connectionStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'blocked'
])

// Connection schema
export const connectionSchema = z.object({
  id: z.string().uuid(),
  requester_id: z.string().uuid(),
  addressee_id: z.string().uuid(),
  status: connectionStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Connection with user details
export const connectionWithUserSchema = z.object({
  connection: connectionSchema,
  user: userProfileSchema
})

// Network stats schema
export const networkStatsSchema = z.object({
  total_connections: z.number(),
  pending_requests: z.number(),
  mutual_connections: z.number()
})

// Request connection schema
export const requestConnectionSchema = z.object({
  addressee_id: z.string().uuid()
})

// Accept/reject connection schema
export const updateConnectionStatusSchema = z.object({
  connection_id: z.string().uuid(),
  status: connectionStatusSchema
})

// Get connections request
export const getConnectionsRequestSchema = z.object({
  status: connectionStatusSchema.optional()
})

// Get connections response
export const getConnectionsResponseSchema = z.object({
  connections: z.array(connectionWithUserSchema)
})

// Get network stats response
export const getNetworkStatsResponseSchema = z.object({
  stats: networkStatsSchema
})

// Request connection response
export const requestConnectionResponseSchema = z.object({
  connection: connectionSchema
})

// Update connection response
export const updateConnectionResponseSchema = z.object({
  connection: connectionSchema
})

// Get mutual connections request
export const getMutualConnectionsRequestSchema = z.object({
  user_id: z.string().uuid()
})

// Get mutual connections response
export const getMutualConnectionsResponseSchema = z.object({
  connections: z.array(userProfileSchema),
  count: z.number()
})

// TypeScript types inferred from schemas
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>
export type Connection = z.infer<typeof connectionSchema>
export type ConnectionWithUser = z.infer<typeof connectionWithUserSchema>
export type NetworkStats = z.infer<typeof networkStatsSchema>
export type RequestConnection = z.infer<typeof requestConnectionSchema>
export type UpdateConnectionStatus = z.infer<typeof updateConnectionStatusSchema>
export type GetConnectionsRequest = z.infer<typeof getConnectionsRequestSchema>
export type GetConnectionsResponse = z.infer<typeof getConnectionsResponseSchema>
export type GetNetworkStatsResponse = z.infer<typeof getNetworkStatsResponseSchema>
export type RequestConnectionResponse = z.infer<typeof requestConnectionResponseSchema>
export type UpdateConnectionResponse = z.infer<typeof updateConnectionResponseSchema>
export type GetMutualConnectionsRequest = z.infer<typeof getMutualConnectionsRequestSchema>
export type GetMutualConnectionsResponse = z.infer<typeof getMutualConnectionsResponseSchema>
