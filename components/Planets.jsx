import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, BufferGeometry, SplineCurve, Vector2 } from 'three'

const PLANET_COUNT = 10
const ATTRACTION_FORCE = 1
const SUN_RADIUS = 10
const SPAWN_RADIUS = 250

// Calculate initial position outside the component
const calculateInitialPosition = () => {
    let x, y, z

    const theta = Math.random() * Math.PI * 2 // Random angle for x-z plane
    const radius = Math.random() * SPAWN_RADIUS + SUN_RADIUS * 3 // Ensure outside SUN_RADIUS * 3

    x = Math.cos(theta) * radius
    y = Math.random() * 10
    z = Math.sin(theta) * radius

    return new Vector3(x, y, z)
}

// Calculate initial velocity outside the component
const calculateInitialVelocity = (position) => {
    const MIN_VELOCITY_SCALE = 0.8 // Minimum scale factor for velocity
    const MAX_VELOCITY_SCALE = 1.2 // Maximum scale factor for velocity

    const radialVector = new Vector3().copy(position)
    const upVector = new Vector3(0, 1, 0)
    const velocityScale = MIN_VELOCITY_SCALE + Math.random() * (MAX_VELOCITY_SCALE - MIN_VELOCITY_SCALE) // Random scale factor

    return new Vector3()
        .crossVectors(radialVector, upVector)
        .normalize()
        .multiplyScalar(Math.sqrt(ATTRACTION_FORCE / Math.max(radialVector.length(), 1)))
        .multiplyScalar(velocityScale) // Apply the random scale factor
}

// Planet component
const Planet = ({ position, velocity, size }) => {
    const meshRef = useRef()
    const velocityRef = useRef(new Vector3())
    const lineRef = useRef(new BufferGeometry())
    const [trailPoints, setTrailPoints] = useState([position.clone()])

    // Set initial velocity
    useEffect(() => {
        velocityRef.current = velocity.clone()
    }, [velocity])

    useFrame(() => {
        if (!meshRef.current) return

        const position = meshRef.current.position.clone()
        const sunPosition = new Vector3(0, 0, 0) // Assuming the sun is at the origin
        const directionToSun = new Vector3().subVectors(sunPosition, position)
        const distanceSquared = position.distanceToSquared(sunPosition)
        const forceMagnitude = ATTRACTION_FORCE / Math.max(distanceSquared, 0.1)
        const gravitationalForce = directionToSun.normalize().multiplyScalar(forceMagnitude)

        velocityRef.current.add(gravitationalForce)
        meshRef.current.position.add(velocityRef.current)

        setTrailPoints((prev) => {
            const lastPoint = prev[prev.length - 1]
            if (lastPoint.distanceTo(position) > 1) {
                const newPoints = prev.length > 100 ? prev.slice(1) : prev
                return [...newPoints, position] // Add the new position
            }
            return prev
        })

        // Update the line geometry
        lineRef.current.setFromPoints(trailPoints)
    })

    return (
        <>
            <mesh ref={meshRef} position={position} userData={{ type: 'Planet' }} receiveShadow>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial color={'blue'} />
            </mesh>

            <line>
                <bufferGeometry ref={lineRef} />
                <lineBasicMaterial color={'rgba(60,60,60)'} />
            </line>
        </>
    )
}

// Planets component
const Planets = () => {
    const planets = useMemo(() => {
        return new Array(PLANET_COUNT).fill(null).map((_, i) => {
            const initialPosition = calculateInitialPosition()
            const initialVelocity = calculateInitialVelocity(initialPosition)
            const size = Math.random() * 2 + 1
            return <Planet key={i} position={initialPosition} velocity={initialVelocity} size={size} />
        })
    }, [])

    return <>{planets}</>
}

export default Planets
