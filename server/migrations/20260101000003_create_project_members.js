'use strict';

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('project_members', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('project_id').unsigned().notNullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.enum('role', ['admin', 'member']).notNullable().defaultTo('member');
    t.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());

    t.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    t.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.unique(['project_id', 'user_id']);
    t.index('user_id');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('project_members');
};
