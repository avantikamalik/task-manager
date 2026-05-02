'use strict';

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('tasks', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('project_id').unsigned().notNullable();
    t.string('title', 200).notNullable();
    t.text('description').nullable();
    t.enum('status', ['todo', 'in_progress', 'done']).notNullable().defaultTo('todo');
    t.enum('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
    t.date('due_date').nullable();
    t.bigInteger('assignee_id').unsigned().nullable();
    t.bigInteger('created_by').unsigned().notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    t.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    t.foreign('assignee_id').references('id').inTable('users').onDelete('SET NULL');
    t.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

    t.index(['project_id', 'status']);
    t.index('assignee_id');
    t.index('due_date');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('tasks');
};
