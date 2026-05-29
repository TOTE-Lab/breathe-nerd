/*
    the Express (back-end) middle man between React (front-end) and the database 
    interacts with the sessions table data from the database

    post request
    when a use rates their stress before and after an exercise we want to write that data into the session table

    get request 
    when the dashboard is opened this is how we request the desired user information from the sessions table
*/

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { supabase } from '../db/supabaseClient.js';

const router = express.Router()

// listen for POST requests to '/' but only allow logged in users
router.post('/', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // grab the logged in user's id from their session cookie
        const userId = req.session.userId
        
        // pull the two stress ratings out of the request body
        const {stress_lvl_before, stress_lvl_after} = req.body

        // if either rating is missing, stop early and tell the frontend what went wrong
        if (!stress_lvl_before || !stress_lvl_after) {
            return res.status(400).json({error: 'Both stress ratings are required'})
        }

        // wait while supabase creates a new row in the session table with this user's stress ratings
        const { error } = await supabase
            .from('session')
            .insert({user_id: userId, stress_lvl_before, stress_lvl_after})

        // if supabase returned an error stop and pass it to the error handler
        if (error) return next(error)

        // everything worked - tell the frontend the session was saved
        return res.status(201).json({message: 'Session saved'})
    } catch (err)  {return next(err)}
})

// listen for GET requests to '/stats' but only allow logged in users
router.get('/stats', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // get the current user's id from their active session cookie
        const userId = req.session.userId

        // ask supabase for all session rows belonging to this user
        // only fetch the two stress columns we need - nothing extra
        const { data: sessions, error } = await supabase
        .from('session')
        .select('stress_lvl_before, stress_lvl_after')
        .eq('user_id', userId)

        // if that query failed stop and pass the error to the error handler
        if (error) return next(error)

        // ask supabase for this user's last_login timestamp from the users table
        const {data: userData, error: userError} = await supabase
            .from('users')
            .select('last_login')
            .eq('id', userId)
            .single()

        // if that query also failed stop and pass the error to the error handler
        if (userError) return next(userError)
            
        // count how many session rows came back - that is the total sessions completed
        const totalSessions = sessions?.length || 0;

        // if the user has no sessions yet return 0 to avoid dividing by zero
        // otherwise loop through every session, subtract after stress from before stress,
        // sum all those differences, then divide by the number of sessions to get the average
        const avgReduction = totalSessions === 0 ? 0 :
            sessions!.reduce((sum, s) => sum + (s.stress_lvl_before - s.stress_lvl_after), 0) / totalSessions 

        // send back the three calculated stats as a JSON object
        return res.status(200).json({ totalSessions, avgReduction, lastLogin: userData?.last_login })

    } catch (err) {
        // if anything unexpected threw an error forward it to the global error handler
        return next(err)
    }
})

export default router