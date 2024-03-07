import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'

import { useExplosion } from '../context/Explosions'
import { calculateInitialPosition, calculateInitialVelocity, calculateEntryVelocity } from '../utils/planetCalculations'

import Planet from './Planet'
import Trail from './Trail'

// Planets component
const Planets = ({ count = 10 }) => {
    const { triggerExplosion } = useExplosion()

    const planetsRef = useRef()
    const [trailPositions, setTrailPositions] = useState([])
    const [planetData, setPlanetData] = useState(() => {
        return new Array(count).fill(null).map((_, index) => {
            const scale = 0.5 + Math.random() * 1.5
            const initialPosition = calculateInitialPosition()
            const initialVelocity = calculateInitialVelocity(initialPosition)
            const key = 'instance_' + Math.random()
            const planet = {
                key: key,
                position: initialPosition.toArray(),
                linearVelocity: initialVelocity.toArray(),
                scale,
                userData: { type: 'Planet', key: key },
            }
            return planet
        })
    })

    useFrame(() => {
        if (planetsRef.current) {
            const newTrailPositions = planetsRef.current.map((planet) => {
                const position = planet.translation()
                return new Vector3(position.x, position.y, position.z)
            })
            setTrailPositions(newTrailPositions)
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

                // Respawn the current planet
                const newKey = 'instance_' + Math.random()
                const newPosition = calculateInitialPosition(true)
                const newVelocity = calculateEntryVelocity(newPosition)

                target.rigidBody.userData.key = newKey
                target.rigidBody.setTranslation(newPosition)
                target.rigidBody.setLinvel(newVelocity)

                // update the planet data
                setPlanetData((prevData) =>
                    prevData.map((planet) => {
                        if (planet.key === targetPlanetKey) {
                            return {
                                ...planet,
                                key: newKey,
                                position: newPosition.toArray(),
                                linearVelocity: newVelocity.toArray(),
                            }
                        }
                        return planet
                    })
                )
            }
        }
    }

    return (
        <>
            <InstancedRigidBodies ref={planetsRef} instances={planetData} colliders='ball' onCollisionEnter={handleCollision}>
                <Planet count={planetData.length} />
            </InstancedRigidBodies>

            {trailPositions.map((position, index) => (
                <Trail key={planetData[index].key} position={position} />
            ))}
        </>
    )
}

export default Planets
