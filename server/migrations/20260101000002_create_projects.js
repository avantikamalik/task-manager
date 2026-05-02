'use strict';

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('projects', (t) => {
    t.bigIncrements('id').primary();
    t.string('name', 160).notNullable();
    t.text('description').nullable();
    t.bigInteger('owner_id').unsigned().notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

    t.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
    t.index('owner_id');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('projects');
};
