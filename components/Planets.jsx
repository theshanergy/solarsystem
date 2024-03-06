import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'
import Trail from './Trail'
import Explosion from './Explosion'
import Planet from './Planet'

const PLANET_COUNT = 10
const SUN_RADIUS = 10
const SPAWN_RADIUS = 250
const SUN_MASS = 14000
const VELOCITY_SCALE_FACTOR = 100000

// Get random position either within the spawn radius or on the outside edge
const calculateInitialPosition = (isEntry = false) => {
    const theta = Math.random() * Math.PI * 2
    const radius = isEntry ? SPAWN_RADIUS * 1.5 : Math.random() * SPAWN_RADIUS + SUN_RADIUS * 3
    const x = Math.cos(theta) * radius
    const y = Math.random() * 10
    const z = Math.sin(theta) * radius
    return new Vector3(x, y, z)
}

// Calculate the initial velocity of the planet
const calculateInitialVelocity = (position) => {
    const radialVector = new Vector3().copy(position)
    const distance = radialVector.length()
    const orbitalSpeed = Math.sqrt((6.6743e-11 * SUN_MASS) / distance)
    const upVector = new Vector3(0, 1, 0)
    const velocity = new Vector3().crossVectors(radialVector, upVector).normalize().multiplyScalar(orbitalSpeed)
    const scaledVelocity = velocity.multiplyScalar(VELOCITY_SCALE_FACTOR)
    return scaledVelocity
}

// Calculate a slightly lower initial velocity for planets entering from outside the solar system
const calculateEntryVelocity = (position) => {
    const initialVelocity = calculateInitialVelocity(position)
    return initialVelocity.multiplyScalar(0.75)
}

const Planets = () => {
    const planetsRef = useRef()
    const [explosionPositions, setExplosionPositions] = useState({})
    const [trailPositions, setTrailPositions] = useState([])
    const [planetData, setPlanetData] = useState(() => {
        return new Array(PLANET_COUNT).fill(null).map((_, index) => {
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

            // Get the collision world position
            const collisionWorldPosition = manifold.solverContactPoint(0)

            // If other mass is greater
            if (otherMass > targetMass) {
                // Add this position to the explosions state, if it doesnt already exist
                setExplosionPositions((prev) => {
                    if (!prev[target.rigidBody.userData.key]) {
                        return { ...prev, [target.rigidBody.userData.key]: new Vector3(collisionWorldPosition.x, collisionWorldPosition.y, collisionWorldPosition.z) }
                    }
                    return prev
                })

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

    // Remove key from explosion positions when the explosion is complete
    const handleExplosionComplete = (id) => {
        setExplosionPositions((prev) => {
            const { [id]: value, ...rest } = prev
            return rest
        })
    }

    return (
        <>
            <InstancedRigidBodies ref={planetsRef} instances={planetData} colliders='ball' onCollisionEnter={handleCollision}>
                <Planet count={planetData.length} />
            </InstancedRigidBodies>

            {trailPositions.map((position, index) => (
                <Trail key={planetData[index].key} position={position} />
            ))}

            {Object.entries(explosionPositions).map(([id, position]) => (
                <Explosion key={id} position={position} onComplete={() => handleExplosionComplete(id)} />
            ))}
        </>
    )
}

export default Planets
