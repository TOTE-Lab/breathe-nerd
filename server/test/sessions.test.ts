import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest';
import app from '../server.js'
import { supabase } from '../db/supabaseClient.js'

describe('POST /sessions', () => {
let agent: any;

beforeEach(async () => {
  await supabase.from('users').delete().eq('email', 'testuser@test.com');

    agent = request.agent(app);
    await request(app).post('/auth/signup')
    .send({
      email: 'testuser@test.com',
      password: 'password123',
      name: 'Test User'
    })

    await agent.post('/auth/login').send({
    email: 'testuser@test.com',
    password: 'password123',
    });

});

afterEach(async () => {
  await supabase.from('users').delete().eq('email', 'testuser@test.com');
});

  it('POST returns appropriate error if a stress level is not provided', async () => {

    const result = await agent.post('/sessions')
    .send({
        stress_lvl_before: 5,
        stress_lvl_after: null,
        exercises_completed: 2,
    })

    // return res.status(400).json({error: 'Both stress ratings are required'})

    console.log(result.status);
    console.log(result.body);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Both stress ratings are required');
});

})