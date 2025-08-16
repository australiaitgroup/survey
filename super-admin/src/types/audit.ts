// Types for Audit Logs feature

export type AuditAction = 
  | 'login' | 'logout' | 'create' | 'update' | 'delete' 
  | 'suspend' | 'activate' | 'impersonate' | 'export'
  | 'pii_view' | 'settings_change' | 'permission_change';

export type AuditTargetType = 
  | 'user' | 'company' | 'survey' | 'response' | 'question_bank'
  | 'transaction' | 'pii' | 'settings' | 'system';

export interface AuditLog {
  _id: string;
  action: AuditAction;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  targetType: AuditTargetType;
  targetId?: string;
  targetName?: string;
  payload?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  search?: string;
  action?: AuditAction | '';
  targetType?: AuditTargetType | '';
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}