/*
    Dashboard Component
    Purpose -> to display the information about the user (ie. user name, last login, stress reduction, completed sessions)
    When a button is clicked the component will appear as a pop up on the screen 
*/

import {useEffect, useState} from 'react'
import type {User} from '../types'

//tells TypeScript exactly what props Dashboard expects to receive from App.tsx
//describes what comes IN from the parent component
//the user information is already in App.tsx so we can grab it from there rather than request in from the db 
interface DashboardProps {
    user: User
    onClose: () => void
}

//describe the shape of the data that comes back from the GET request 
//describes what comes BACk from the server fetch
interface Stats {
    avgReduction: number
    totalSessions: number
    lastLogin: string
}

//function that creates the Dashboard component //input: user object, onClose function - available because of the parent App.tsx
export default function Dashboard({user, onClose}: DashboardProps) {
    //stats holds the data that comes back from teh server when the dashboard fetches it - will store an object of data returned from sessions.ts
    const [stats, setStats] = useState<Stats | null>(null)

    //React(front-end) makes a request to Express(back-end) for the data we need for the dashboard - minus user object which we get as props from App.tsx
    useEffect(() => {
        //create a function to fetch data - must be async because you need to wait for the response from Express(back-end)
        async function fetchStats() {
            try {
                //function that sends a request to the route from the session.ts route - await the response and store it
                const res = await fetch('/sessions/stats', {credentials: 'include'})
                //converts raw response data into JS object we can understand on the front-end - store this as well
                const data = await res.json()
                //update state variable to the front-end readable object we just request from teh back-end, which made a request to the db and then sent the data back to us
                setStats(data)
            } catch (err) {
                console.log('Failed to fetch stats', err)
            }
        }
        //calling the function we defined to request data needed for the dashboard
        fetchStats()
    }, [])
    
    //return the JSX component - what is displayed on screen 
    return (
        //clicking the background of the page behind the pop-up will close it 
        <div className="dashboard-overlay" onClick={onClose}>
            {/* stopPropagation ensures clicking in the pop-up doesn't close it - bubbling */}
            <div className="dashboard-popup" onClick={e => e.stopPropagation()}>
                
                {/* create an actual button specifically to close the pop-up */}
                <button className="dashboard-close" type="button" onClick={onClose}>x</button>
                
                {/* Displays the user greeting on the Dashboard */}
                <h2 className="dashboard-greeting">Hey, {user.name}</h2>
                <p className="dashboard-subtitle">Take some time to reflect</p>

                
                {!stats ? (
                    //while we don't have the needed stats data display a loading message
                    <p className="dashboard-loading">Loading your stats...</p>
                ) : (
                    //a container of all of the stat cards
                    //each stat card (piece of data) will have its own label and value
                    <div className="dashboard-stats">
                        
                        {/* stat card (value & label) 4 average stress reduction */}
                        <div className="stat-card">
                            <span className="stat-value">
                                {stats.avgReduction !== 0
                                ? `${stats.avgReduction.toFixed(1)}%`
                                : "No data yet"
                                }
                            </span>
                            <span className="stat-label">avg stress reduction</span>
                            </div>
                        
                        {/* stat card (value & label) 4 the number of completed sessions */}
                        <div className="stat-card">
                            <span className="stat-value">{stats.totalSessions}</span>
                            <span className="stat-label">sessions completed</span>
                        </div>
                        
                        {/* stat card (value & label) 4 the last time a user logged in */}
                        <div className="stat-card">
                            <span className="stat-value">
                                {new Date(stats.lastLogin).toLocaleString()}
                            </span>
                            <span className="stat-label">last login</span>
                        </div>
                        
                    </div>
                )}
            </div>
        </div>
    )
}