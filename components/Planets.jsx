import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'

import { useExplosion } from '../context/Explosions'
import { useTrails } from '../context/Trails'
import { calculateInitialPosition, calculateInitialVelocity, calculateEntryVelocity } from '../utils/planetCalculations'

import Planet from './Planet'

// Planets component
const Planets = ({ count = 10 }) => {
    const { triggerExplosion } = useExplosion()
    const { addTrailPoint, clearTrail } = useTrails()

    const planetsRef = useRef()
    const [planetCount, setPlanetCount] = useState(count)

    // Set up the initial planet data
    const [planetData, setPlanetData] = useState(() => {
        return new Array(count).fill(null).map((_, index) => {
            const scale = 0.5 + Math.random() * 1.5
            const initialPosition = calculateInitialPosition()
            const initialVelocity = calculateInitialVelocity(initialPosition)
            const key = 'instance_' + Math.random()
            const planet = {
                key: key,
                position: initialPosition,
                linearVelocity: initialVelocity,
                scale,
                userData: { type: 'Planet', key: key },
            }
            return planet
        })
    })

    // Update the planet count
    useEffect(() => {
        setPlanetCount(planetsRef.current.length)
    }, [planetsRef])

    useFrame(() => {
        if (planetsRef.current) {
            // Loop through the planets and add a trail point for each
            planetsRef.current.forEach((planet) => {
                const position = planet.translation()
                addTrailPoint(planet.userData.key, new Vector3(position.x, position.y, position.z))
            })
        }
    })

    // Handle collisions
    const handleCollision = ({ manifold, target, other }) => {
        // If the other body is a planet
        if (other.rigidBody.userData.type === 'Planet') {
            // get the mass of the target (current) and the other
            const targetMass = target.rigidBody.mass()
            const otherMass = other.rigidBody.mass()
            console.log('Planet collision')

            // If other mass is greater
            if (otherMass > targetMass) {
                // Get the collision world position
                const collisionWorldPosition = manifold.solverContactPoint(0)

                // Get position of the planet
                const targetPosition = target.rigidBody.translation()

                // Trigger an explosion.
                triggerExplosion(
                    new Vector3(collisionWorldPosition.x, collisionWorldPosition.y, collisionWorldPosition.z),
                    new Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
                )

                // get the key of the current planet
                const targetPlanetKey = target.rigidBody.userData.key

                // calculate a new position and velocity for the other planet
                const targetVelocity = target.rigidBody.linvel()
                const otherVelocity = other.rigidBody.linvel()
                const newOtherVelocity = new Vector3().copy(targetVelocity).add(otherVelocity).divideScalar(2)
                other.rigidBody.setLinvel(newOtherVelocity)

                // Clear the trail for the current planet
                clearTrail(targetPlanetKey)

                // Respawn the current planet
                const newKey = 'instance_' + Math.random()
                const newPosition = calculateInitialPosition(true)
                const newVelocity = calculateEntryVelocity(newPosition)

                target.rigidBody.userData.key = newKey
                target.rigidBody.setTranslation(newPosition)
                target.rigidBody.setLinvel(newVelocity)
            }
        }
    }

    return (
        <>
            <InstancedRigidBodies ref={planetsRef} instances={planetData} colliders='ball' onCollisionEnter={handleCollision}>
                <Planet count={planetCount} />
            </InstancedRigidBodies>
        </>
    )
}

export default Planets
