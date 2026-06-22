// Admin audit log entry, mirroring the backend audit_logs table
// (GET /api/v1/admin/audit-logs). `metadata` is an open JSON map; the backend
// commonly includes `admin_name` and action-specific context.
export interface AdminAuditLog {
	id: string;
	admin_id: string;
	action: string;
	target_type: string;
	target_id: string;
	metadata?: Record<string, unknown> & { admin_name?: string };
	created_at: string;
}
