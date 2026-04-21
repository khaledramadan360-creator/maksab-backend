'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Composite: filters by both action AND entity_type simultaneously
    await queryInterface.addIndex(
      'audit_logs',
      ['action', 'entity_type'],
      { name: 'audit_logs_action_entity_type_idx' }
    );

    // Composite: filters by actor then sorted by date — most common admin query pattern
    await queryInterface.addIndex(
      'audit_logs',
      ['actor_user_id', 'created_at'],
      { name: 'audit_logs_actor_created_at_idx' }
    );

    // Composite: date-range queries scoped to entity_type
    await queryInterface.addIndex(
      'audit_logs',
      ['entity_type', 'created_at'],
      { name: 'audit_logs_entity_type_created_at_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('audit_logs', 'audit_logs_action_entity_type_idx');
    await queryInterface.removeIndex('audit_logs', 'audit_logs_actor_created_at_idx');
    await queryInterface.removeIndex('audit_logs', 'audit_logs_entity_type_created_at_idx');
  },
};
