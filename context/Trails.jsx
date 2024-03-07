import React, { createContext, useState, useContext } from 'react'
import Trail from '../components/Trail'

const TrailContext = createContext()

export const useTrails = () => useContext(TrailContext)

export const TrailProvider = ({ children }) => {
    const [trailPositions, setTrailPositions] = useState({}) // Initialize as an object

    // Add a point to a trail by key
    const addTrailPoint = (key, position) => {
        setTrailPositions((prev) => ({
            ...prev,
            [key]: position, // Use object spread to update the position by key
        }))
    }

    // Clear trail positions
    const clearTrail = (key) => {
        setTrailPositions((prev) => {
            const newTrailPositions = { ...prev }
            delete newTrailPositions[key] // Use delete to remove the key
            return newTrailPositions
        })
    }

    return (
        <TrailContext.Provider value={{ trailPositions, addTrailPoint, clearTrail }}>
            {children}
            {Object.keys(trailPositions).map((key) => (
                <Trail key={key} position={trailPositions[key]} />
            ))}
        </TrailContext.Provider>
    )
}
