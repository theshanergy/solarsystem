import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { OrbitControls, Trail } from '@react-three/drei'
import { Vector3 } from 'three'

const attractionForce = 1
const planetCount = 8
const spawnRadius = 250
const sunRadius = 10

// Sun made of a yellow sphere
const Sun = () => {
    return (
        <>
            <mesh userData={{ type: 'Sun' }}>
                <sphereGeometry args={[sunRadius, 32, 32]} />
                <meshStandardMaterial color={'yellow'} emissive={'yellow'} emissiveIntensity={1} />
            </mesh>
            <pointLight position={[0, 0, 0]} intensity={50000} color='#fff' />
        </>
    )
}

// Randomly distribute planets within the spawn radius, but not within the sun
const calculateInitialPostition = () => {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * spawnRadius

    const x = Math.cos(angle) * radius
    const y = Math.random() * 10 // Random height
    const z = Math.sin(angle) * radius

    // ensure planets are not within twice the sun radius
    if (Math.sqrt(x * x + y * y + z * z) < sunRadius * 3) {
        return calculateInitialPostition()
    }

    return new Vector3(x, y, z)
}

// Calculate initial velocity perpendicular to the radial vector (orbiting the sun)
const calculateInitialVelocity = (position) => {
    const radialVector = new Vector3().copy(position)
    const upVector = new Vector3(0, 1, 0)
    return new Vector3()
        .crossVectors(radialVector, upVector)
        .normalize()
        .multiplyScalar(Math.sqrt(attractionForce / Math.max(radialVector.length(), 1)))
}

// Planet component
const Planet = ({ position, velocity }) => {
    const meshRef = useRef()
    const velocityRef = useRef(new Vector3())
    const [trailLength, setTrailLength] = useState(100)

    // Random size between 1 and 3
    const size = Math.random() * 2 + 1

    // Set initial velocity
    useEffect(() => {
        velocityRef.current = velocity

        // Calculate trail length
        setTrailLength(Math.round(position.length()))
    }, [velocity])

    // Animate planet position / velocity
    useFrame(() => {
        if (!meshRef.current) return

        const position = new Vector3().copy(meshRef.current.position)
        const sunPosition = new Vector3(0, 0, 0) // Assuming the sun is at the origin
        const directionToSun = new Vector3().subVectors(sunPosition, position)
        const distanceSquared = position.distanceToSquared(sunPosition)
        const distance = Math.sqrt(distanceSquared)

        const forceMagnitude = attractionForce / Math.max(distanceSquared, 0.1) // Simplified gravitational force
        const gravitationalForce = directionToSun.normalize().multiplyScalar(forceMagnitude)

        // If planet moves outside of spawn radius, position it at the outside edge of the spawn radius with a new random velocity
        if (distance > spawnRadius) {
            // position at outside edge of spawn radius, y=0
            meshRef.current.position.copy(directionToSun.normalize().multiplyScalar(spawnRadius))
            velocityRef.current = calculateInitialVelocity(meshRef.current.position)
        }

        // Update velocity based on gravitational force
        velocityRef.current.add(gravitationalForce)

        // Update position based on velocity
        meshRef.current.position.add(velocityRef.current)
    })

    return (
        <Trail length={trailLength} width={5} color={0x0000ff}>
            <mesh ref={meshRef} position={position} userData={{ type: 'Planet' }} receiveShadow>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial color={'blue'} />
            </mesh>
        </Trail>
    )
}

// Planets component
const Planets = () => {
    const planets = useMemo(() => {
        const planets = []

        for (let i = 0; i < planetCount; i++) {
            const initialPosition = calculateInitialPostition()
            const initialVelocity = calculateInitialVelocity(initialPosition)

            // add some random variability to the initial velocity
            initialVelocity.x *= Math.random() * 0.5 + 0.5

            planets.push(<Planet key={i} position={initialPosition} velocity={initialVelocity} />)
        }

        return planets
    }, [])

    return <>{planets}</>
}

// Scene component
const Scene = () => {
    const { camera, raycaster, scene, mouse } = useThree()
    const cameraTarget = useRef(new Vector3())

    const [activeObject, setActiveObject] = useState(null)

    useEffect(() => {
        const onClick = (event) => {
            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, camera)

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(scene.children, true)

            if (intersects.length > 0) {
                // Assuming the first intersected object is the one we're interested in
                const object = intersects[0].object

                if (object.userData.type === 'Planet' || object.userData.type === 'Sun') {
                    setActiveObject(object)
                }
            }
        }

        // Add event listener
        window.addEventListener('click', onClick)

        return () => {
            window.removeEventListener('click', onClick)
        }
    }, [camera, mouse, raycaster, scene.children])

    useFrame(() => {
        if (activeObject) {
            // Smoothly move the camera target to the active object
            const target = new Vector3().copy(activeObject.position)
            const smoothness = 0.05
            cameraTarget.current.lerp(target, smoothness)
            camera.lookAt(cameraTarget.current)
        }
    })

    return (
        <>
            <Sun />
            <Planets />
        </>
    )
}

// App component
const App = () => {
    return (
        <Canvas camera={{ position: [0, 50, 150] }}>
            <ambientLight intensity={0.1} />
            <color attach='background' args={['black']} />
            <OrbitControls />

            <Scene />

            <EffectComposer>
                <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
            </EffectComposer>
        </Canvas>
    )
}

export default App
