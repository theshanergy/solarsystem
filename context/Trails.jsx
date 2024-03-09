import React, { createContext, useState, useContext, useCallback } from 'react'
import { Line } from '@react-three/drei'

const TrailContext = createContext()

export const useTrails = () => useContext(TrailContext)

export const TrailProvider = ({ children }) => {
    const [trails, setTrails] = useState({})

    const addTrailPoint = useCallback((key, position) => {
        setTrails((prevTrails) => {
            const trail = prevTrails[key] || []
            const newTrail = trail.length >= 300 ? trail.slice(1) : trail
            const lastPoint = newTrail[newTrail.length - 1]
            if (!lastPoint || lastPoint.distanceToSquared(position) > 1) {
                return { ...prevTrails, [key]: [...newTrail, position.clone()] }
            }
            return prevTrails
        })
    }, [])

    const clearTrail = useCallback((key) => {
        setTrails((prevTrails) => {
            const { [key]: _, ...rest } = prevTrails // Destructuring to omit the key
            return rest
        })
    }, [])

    return (
        <TrailContext.Provider value={{ addTrailPoint, clearTrail }}>
            {children}
            {Object.entries(trails).map(([key, positions]) => (
                <Line key={key} points={positions} color='rgba(30,30,30)' />
            ))}
        </TrailContext.Provider>
    )
}
