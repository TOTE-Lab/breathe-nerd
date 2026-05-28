import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../middleware/isAuthenticated.js';
import { supabase } from '../db/supabaseClient.js';

const router = express.Router()

router.post('/', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
        //grab user id from the request 
        const userId = req.session.userId
        
        //pull a bunch of data we will need to populate dashboard from the request body 
        const {stress_lvl_before, stress_lvl_after, exercises_completed} = req.body

        //exit early if we don't have both the stress rating for before and after the excersize 
        if (!stress_lvl_before || !stress_lvl_after) {
            return res.status(400).json({error: 'Both stress ratings are required'})
        }

        //wait while supabase creates a new row with the user's stress ratings from before and after
        const { error } = await supabase
            //we are accessing the session table
            .from('session')
            .insert({user_id: userId, stress_lvl_before, stress_lvl_after, exercises_completed: exercises_completed || 0})

        if (error) return next(error)
        return res.status(201).json({message: 'Session saved'})
    } catch (err)  {return next(err)}
})