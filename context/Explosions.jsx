import React, { createContext, useContext, useState } from 'react'
import Explosion from '../components/Explosion'

const ExplosionContext = createContext()

export const useExplosion = () => useContext(ExplosionContext)

export const ExplosionProvider = ({ children }) => {
    const [explosions, setExplosions] = useState([])

    const triggerExplosion = (position, lookAt) => {
        setExplosions((prev) => [...prev, { position, lookAt, id: Math.random() }])
    }

    const handleExplosionComplete = (id) => {
        setExplosions((prev) => prev.filter((explosion) => explosion.id !== id))
    }

    return (
        <ExplosionContext.Provider value={{ triggerExplosion }}>
            {children}
            {explosions.map(({ id, position, lookAt }) => (
                <Explosion key={id} position={position} lookAt={lookAt} onComplete={() => handleExplosionComplete(id)} />
            ))}
        </ExplosionContext.Provider>
    )
}
