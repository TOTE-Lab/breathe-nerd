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

// Listen for GET requests to '/stats', but only allow logged-in users 
router.get('/stats', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the current user's ID from their active session
        const userId = req.session.userId

        // Query the 'session' table in the database, fetching only the stress
        // and exercise columns, filtered to rows that belong to the user
        const {data: sessions, error} = await supabase
            .from('session')
            .select('stress_lvl_before, stress_lvl_after, exercises_completed')
            .eq('user_id', userId)

            // If the database returned an error, stop and pass the error to the error handler
            if (error) return next(error)

            // Query the 'users' table to get only the last_login timestamp for this user 
            const {data: userData, error: userError} = await supabase
                .from('users')
                .select('last_login')
                .eq('id', userId)
                .single()

            // If that query also failed, stop and pass that error to the error handler
            if (userError) return next(userError)
            
            // Count how many session rows were returned; default to 0 if none
            const totalSessions = sessions?.length || 0;

            // Loop through all sessions, summing up exercises_completed across all of them; default to 0
            const totalExercises =
                sessions?.reduce(
                    (sum, s) => sum + (s.exercises_completed || 0),
                    0,
                ) || 0;

            // If there are no sessions, average reduction is 0
            // Otherwise, loop through sessions, subtract after-stress from before-stress for each,
            // sum those differences, then divide by the total number of sessions to get the average
            const avgReduction = totalSessions === 0 ? 0 :
                sessions!.reduce((sum, s) => sum + (s.stress_lvl_before - s.stress_lvl_after), 0) / totalSessions 

            // Send a 200 OK response with all four calculated stats as a JSON object
            return res.status(200).json({ totalSessions, totalExercises, avgReduction, lastLogin: userData?.last_login })
    } catch (err) {
        // If anything unexpected threw an error, forward it to the global error handler
        return next(err)
    }
})

export default router