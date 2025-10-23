// ABOUTME: Service port for generating secure approval tokens
// ABOUTME: Provides UUID v4 token generation for approval links

import { ApprovalToken } from '../../domain/value-objects/ApprovalToken'

export interface ITokenService {
  generateApprovalToken(): ApprovalToken
}
