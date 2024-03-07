import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'

import { calculateInitialPosition, calculateInitialVelocity } from '../utils/planetCalculations'
import { useExplosion } from '../context/Explosions'
import { useTrails } from '../context/Trails'

import Planet from './Planet'

// Planets component
const Planets = ({ count = 14 }) => {
    const { triggerExplosion } = useExplosion()
    const { addTrailPoint, clearTrail } = useTrails()

    const planetsRef = useRef()
    const [planetCount, setPlanetCount] = useState(count)

    // Planet props
    const newPlanet = (respawn = false) => {
        const key = 'instance_' + Math.random()
        const position = calculateInitialPosition(respawn)
        const linearVelocity = calculateInitialVelocity(position, respawn)
        const scale = 0.5 + Math.random() * 1.5

        return { key, position, linearVelocity, scale, userData: { type: 'Planet', key } }
    }

    // Set up the initial planet data
    const planetData = useMemo(() => {
        const planets = []
        for (let i = 0; i < count; i++) {
            planets.push(newPlanet())
        }
        return planets
    }, [count])

    // Update the planet count
    useEffect(() => {
        // Set the planet count
        setPlanetCount(planetsRef.current.length)

        // add some initial spin to the planets
        planetsRef.current.forEach((planet) => {
            planet.setAngvel(new Vector3(0, Math.random() - 0.5, 0))
        })
    }, [planetsRef.current])

    // Add a trail point for each planet
    useFrame(() => {
        planetsRef.current?.forEach((planet) => {
            const position = planet.translation()
            addTrailPoint(planet.userData.key, new Vector3(position.x, position.y, position.z))
        })
    })

    // Handle collisions
    const handleCollision = ({ manifold, target, other }) => {
        console.log('Planet collision')

        // get the mass of both objects
        const targetMass = target.rigidBody.mass()
        const otherMass = other.rigidBody.mass()

        // If other object is more massive
        if (otherMass > targetMass) {
            // Get the collision and target positions
            const targetPosition = target.rigidBody.translation()
            const collisionWorldPosition = manifold.solverContactPoint(0)

            // Get the velocities of both objects
            const targetVelocity = target.rigidBody.linvel()
            const otherVelocity = other.rigidBody.linvel()

            // Calculate the combined velocity using conservation of momentum
            const combinedMass = targetMass + otherMass
            const combinedVelocity = new Vector3().addScaledVector(targetVelocity, targetMass).addScaledVector(otherVelocity, otherMass).divideScalar(combinedMass)

            // Set the combined velocity to the other
            if (other.rigidBody.userData.type === 'Planet') {
                other.rigidBody.setLinvel(combinedVelocity)
            }

            // Clear trail of the target planet
            clearTrail(target.rigidBody.userData.key)

            // Trigger explosion.
            triggerExplosion(
                new Vector3(collisionWorldPosition.x, collisionWorldPosition.y, collisionWorldPosition.z),
                new Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
            )

            // Respawn the target planet
            const newPlanetData = newPlanet(true)

            target.rigidBody.userData.key = newPlanetData.key
            target.rigidBody.setTranslation(newPlanetData.position)
            target.rigidBody.setLinvel(newPlanetData.linearVelocity)
        }
    }

    return (
        <InstancedRigidBodies ref={planetsRef} instances={planetData} colliders='ball' onCollisionEnter={handleCollision}>
            <Planet count={planetCount} />
        </InstancedRigidBodies>
    )
}

export default Planets
