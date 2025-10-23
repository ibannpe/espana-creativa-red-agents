// ABOUTME: Token generation service using UUID v4
// ABOUTME: Provides cryptographically secure approval tokens

import { v4 as uuidv4 } from 'uuid'
import { ITokenService } from '../../../application/ports/ITokenService'
import { ApprovalToken } from '../../../domain/value-objects/ApprovalToken'

export class TokenService implements ITokenService {
  generateApprovalToken(): ApprovalToken {
    const token = uuidv4()
    return ApprovalToken.create(token)!
  }
}
