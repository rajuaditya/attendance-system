const { AuditLog } = require('../models');
const logger = require('./logger');

/**
 * Writes an audit trail entry. Never throws — audit logging failures
 * must not break the primary request flow, but are logged for ops.
 */
const recordAudit = async ({ req, actorId, action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      actor_id: actorId ?? req?.user?.id ?? null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
      ip_address: req?.ip || null,
      user_agent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    logger.error(`Failed to write audit log for action ${action}: ${err.message}`);
  }
};

module.exports = { recordAudit };
