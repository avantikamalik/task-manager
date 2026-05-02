'use strict';

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.bigIncrements('id').primary();
    t.string('name', 120).notNullable();
    t.string('email', 191).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.enum('global_role', ['admin', 'member']).notNullable().defaultTo('member');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('users');
};
