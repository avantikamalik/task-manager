'use strict';

const bcrypt = require('bcryptjs');

/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  // Wipe existing data (children first to respect FKs)
  await knex('tasks').del();
  await knex('project_members').del();
  await knex('projects').del();
  await knex('users').del();

  const adminName = process.env.SEED_ADMIN_NAME || 'Admin User';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin' + '@example.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  const adminHash = await bcrypt.hash(adminPassword, saltRounds);
  const memberHash = await bcrypt.hash('Member@12345', saltRounds);

  // Insert users
  const [adminId] = await knex('users').insert({
    name: adminName,
    email: adminEmail,
    password_hash: adminHash,
    global_role: 'admin',
  });

  const [aliceId] = await knex('users').insert({
    name: 'Alice Johnson',
    email: 'alice' + '@example.com',
    password_hash: memberHash,
    global_role: 'member',
  });

  const [bobId] = await knex('users').insert({
    name: 'Bob Smith',
    email: 'bob' + '@example.com',
    password_hash: memberHash,
    global_role: 'member',
  });

  // Project 1
  const [projectAId] = await knex('projects').insert({
    name: 'Website Redesign',
    description: 'Redesign the marketing site with a fresh, modern look.',
    owner_id: adminId,
  });

  await knex('project_members').insert([
    { project_id: projectAId, user_id: adminId, role: 'admin' },
    { project_id: projectAId, user_id: aliceId, role: 'member' },
    { project_id: projectAId, user_id: bobId, role: 'member' },
  ]);

  const today = new Date();
  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  await knex('tasks').insert([
    {
      project_id: projectAId,
      title: 'Audit current site analytics',
      description: 'Pull last 90 days of GA data and identify drop-off pages.',
      status: 'done',
      priority: 'medium',
      due_date: addDays(-7),
      assignee_id: aliceId,
      created_by: adminId,
    },
    {
      project_id: projectAId,
      title: 'Wireframe the new homepage',
      description: 'Low-fidelity wireframes for hero, features, pricing, footer.',
      status: 'in_progress',
      priority: 'high',
      due_date: addDays(2),
      assignee_id: bobId,
      created_by: adminId,
    },
    {
      project_id: projectAId,
      title: 'Write new copy for product pages',
      status: 'todo',
      priority: 'medium',
      due_date: addDays(-2), // overdue
      assignee_id: aliceId,
      created_by: adminId,
    },
    {
      project_id: projectAId,
      title: 'Set up staging environment',
      status: 'todo',
      priority: 'low',
      due_date: addDays(10),
      assignee_id: adminId,
      created_by: adminId,
    },
  ]);

  // Project 2
  const [projectBId] = await knex('projects').insert({
    name: 'Mobile App MVP',
    description: 'Ship the v1 mobile app for internal beta testing.',
    owner_id: adminId,
  });

  await knex('project_members').insert([
    { project_id: projectBId, user_id: adminId, role: 'admin' },
    { project_id: projectBId, user_id: aliceId, role: 'admin' },
    { project_id: projectBId, user_id: bobId, role: 'member' },
  ]);

  await knex('tasks').insert([
    {
      project_id: projectBId,
      title: 'Define MVP feature scope',
      status: 'done',
      priority: 'high',
      due_date: addDays(-14),
      assignee_id: aliceId,
      created_by: adminId,
    },
    {
      project_id: projectBId,
      title: 'Design login & onboarding screens',
      status: 'in_progress',
      priority: 'high',
      due_date: addDays(5),
      assignee_id: bobId,
      created_by: aliceId,
    },
    {
      project_id: projectBId,
      title: 'Set up CI/CD pipeline',
      status: 'todo',
      priority: 'medium',
      due_date: addDays(-1), // overdue
      assignee_id: adminId,
      created_by: adminId,
    },
  ]);

  // eslint-disable-next-line no-console
  console.log('\nSeed complete.');
  // eslint-disable-next-line no-console
  console.log(`  Admin login -> ${adminEmail} / ${adminPassword}`);
  // eslint-disable-next-line no-console
  console.log('  Member login -> ' + 'alice' + '@example.com' + ' / Member@12345');
  // eslint-disable-next-line no-console
  console.log('  Member login -> ' + 'bob' + '@example.com' + ' / Member@12345\n');
};
