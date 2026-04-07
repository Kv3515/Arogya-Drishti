import { AuditAction } from '@prisma/client';
import prisma from '../config/database';

interface AuditLogParams {
  userId: string;
  action: AuditAction | string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an audit log entry.
 * This is the central audit function — every state change MUST be logged.
 *
 * SECURITY: Never log sensitive medical data (diagnosis_text, prescription details).
 * Use "[ENCRYPTED]" placeholder for sensitive fields.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    // Redact sensitive fields from old/new values
    const sanitizedOld = params.oldValue ? redactSensitiveFields(params.oldValue) : undefined;
    const sanitizedNew = params.newValue ? redactSensitiveFields(params.newValue) : undefined;

    await prisma.auditLog.create({
      data: {
        user_id: params.userId,
        action: params.action as AuditAction,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        old_value: sanitizedOld as any,
        new_value: sanitizedNew as any,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit logging failure should not crash the request, but must be reported
    console.error('[AUDIT] Failed to create audit log:', error);
  }
}

/**
 * Redacts sensitive medical fields from audit log data.
 * Fields like diagnosis_text, prescription details, and lab_results are replaced with [ENCRYPTED].
 */
function redactSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'diagnosis_text',
    'chief_complaint',
    'symptoms',
    'notes',
    'lab_results',
    'instructions',
    'contact_info',
    'password_hash',
  ];

  const redacted = { ...data };
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[ENCRYPTED]';
    }
  }
  return redacted;
}
