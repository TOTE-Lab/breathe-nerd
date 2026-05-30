import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest';
import app from '../server.js'
import { supabase } from '../db/supabaseClient.js'

/*
  TESTS for POST /sessions
  checks that the sessions route correctly saves stress ratings
  and blocks unauthenticated requests

  before each test: delete any leftover test user, create a fresh one, log in with agent
  after each test: delete the test user so tests do not affect each other
*/
describe('POST /sessions', () => {
  let agent: any;

  // before each test: clean up leftover test user, create fresh one, log in
  beforeEach(async () => {
    await supabase.from('users').delete().eq('email', 'testuser@test.com');
    agent = request.agent(app);
    // create a fresh test user
    await request(app).post('/auth/signup').send({
      email: 'testuser@test.com',
      password: 'password123',
      name: 'Test User'
    })
    // log in with agent so session cookie is maintained across requests
    await agent.post('/auth/login').send({
      email: 'testuser@test.com',
      password: 'password123',
    });
  });

  // after each test: delete test user so tests do not affect each other
  afterEach(async () => {
    await supabase.from('users').delete().eq('email', 'testuser@test.com');
  });

  // WHEN a stress rating is missing
  // EXPECT the server to return 400 with an error message
  it('POST returns appropriate error if a stress level is not provided', async () => {
    const result = await agent.post('/sessions').send({
      stress_lvl_before: 5,
      stress_lvl_after: null,
      exercises_completed: 2,
    })
    console.log(result.status);
    console.log(result.body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Both stress ratings are required');
  });

  // WHEN the request has no session cookie (not logged in)
  // EXPECT isAuthenticated middleware to block it with 401
  it('returns 401 when not logged in', async () => {
    // plain request not agent - no session cookie so not logged in
    const result = await request(app).post('/sessions').send({
      stress_lvl_before: 5,
      stress_lvl_after: 3
    })
    expect(result.status).toBe(401)
  })

  // WHEN both stress ratings are provided and user is logged in
  // EXPECT the server to save the session and return 201
  it('returns 201 when both stress ratings are provided', async () => {
    // using agent so we are logged in with a valid session cookie
    const result = await agent.post('/sessions').send({
      stress_lvl_before: 7,
      stress_lvl_after: 4
    })
    expect(result.status).toBe(201)
    expect(result.body.message).toBe('Session saved')
  })

})


