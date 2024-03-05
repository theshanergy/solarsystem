import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedRigidBodies } from '@react-three/rapier'
import { Vector3 } from 'three'
import Trail from './Trail'

const PLANET_COUNT = 10
const SUN_RADIUS = 10
const SPAWN_RADIUS = 250
const SUN_MASS = 14000
const VELOCITY_SCALE_FACTOR = 100000

const calculateInitialPosition = () => {
    const theta = Math.random() * Math.PI * 2
    const radius = Math.random() * SPAWN_RADIUS + SUN_RADIUS * 3
    const x = Math.cos(theta) * radius
    const y = Math.random() * 10
    const z = Math.sin(theta) * radius
    return new Vector3(x, y, z)
}

const calculateInitialVelocity = (position) => {
    const radialVector = new Vector3().copy(position)
    const distance = radialVector.length()
    const orbitalSpeed = Math.sqrt((6.6743e-11 * SUN_MASS) / distance)
    const upVector = new Vector3(0, 1, 0)
    const velocity = new Vector3().crossVectors(radialVector, upVector).normalize().multiplyScalar(orbitalSpeed)
    const scaledVelocity = velocity.multiplyScalar(VELOCITY_SCALE_FACTOR)
    return scaledVelocity
}

const Planets = () => {
    const planetsRef = useRef()
    const [trailPositions, setTrailPositions] = useState([])

    const planetData = useMemo(() => {
        return new Array(PLANET_COUNT).fill(null).map(() => {
            const scale = 0.5 + Math.random() * 1.5
            const initialPosition = calculateInitialPosition()
            const initialVelocity = calculateInitialVelocity(initialPosition)
            const planet = {
                key: 'instance_' + Math.random(),
                position: initialPosition.toArray(),
                linearVelocity: initialVelocity.toArray(),
                scale,
                userData: { type: 'Planet' },
            }
            return planet
        })
    }, [])

    useFrame(() => {
        if (planetsRef.current) {
            const newTrailPositions = planetsRef.current.map((planet) => {
                const position = planet.translation()
                return new Vector3(position.x, position.y, position.z)
            })
            setTrailPositions(newTrailPositions)
        }
    })

    return (
        <>
            <InstancedRigidBodies ref={planetsRef} instances={planetData} colliders='ball'>
                <instancedMesh args={[null, null, PLANET_COUNT]} receiveShadow>
                    <sphereGeometry args={[2, 32, 32]} />
                    <meshStandardMaterial color={'blue'} />
                </instancedMesh>
            </InstancedRigidBodies>
            {trailPositions.map((position, index) => (
                <Trail key={index} position={position} />
            ))}
        </>
    )
}

export default Planets
