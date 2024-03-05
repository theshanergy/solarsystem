import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'
import Trail from './Trail'

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
    const handleCollision = ({ target, other }) => {
        // If the other body is a planet
        if (other.rigidBody.userData.type === 'Planet') {
            // get the mass of the target (current) and the other
            const targetMass = target.rigidBody.mass()
            const otherMass = other.rigidBody.mass()
            console.log('Collision between planet and planet', targetMass, otherMass)

            // If other mass is greater
            if (otherMass > targetMass) {
                // get the key of the current planet
                const targetPlanetKey = target.rigidBody.userData.key

                // calculate a new key, position and velocity for the current planet
                const newKey = 'instance_' + Math.random()
                const newPosition = calculateInitialPosition(true)
                const newVelocity = calculateEntryVelocity(newPosition)

                // update the current planet
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
                <instancedMesh args={[null, null, planetData.length]} receiveShadow>
                    <sphereGeometry args={[2, 32, 32]} />
                    <meshStandardMaterial color={'blue'} />
                </instancedMesh>
            </InstancedRigidBodies>
            {trailPositions.map((position, index) => (
                <Trail key={planetData[index].key} position={position} />
            ))}
        </>
    )
}

export default Planets
