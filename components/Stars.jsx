import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'

const Stars = () => {
    const meshRef = useRef()

    // Create a large number of stars
    const count = 5000

    // Pre-generate positions for the stars
    const positions = useMemo(() => {
        const positions = []

        const minDistance = 500

        for (let i = 0; i < count; i++) {
            let distance = minDistance + Math.random() * 4500 // Adjusted for a smaller random range
            const theta = Math.random() * 2 * Math.PI
            const phi = Math.random() * Math.PI

            const x = distance * Math.sin(phi) * Math.cos(theta)
            const y = distance * Math.sin(phi) * Math.sin(theta)
            const z = distance * Math.cos(phi)

            positions.push(x)
            positions.push(y)
            positions.push(z)
        }

        return new Float32Array(positions)
    }, [count])

    // Set the positions of the stars
    useEffect(() => {
        if (!meshRef.current) return

        const matrix = new Object3D()

        for (let i = 0; i < count; i++) {
            matrix.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
            matrix.updateMatrix()
            meshRef.current.setMatrixAt(i, matrix.matrix)
        }
    }, [positions])

    // Animate the stars
    useFrame(() => {
        if (!meshRef.current) return

        meshRef.current.rotation.y += 0.0001
    })

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <dodecahedronGeometry args={[0.4, 0]} />
            <meshBasicMaterial attach='material' color='white' />
        </instancedMesh>
    )
}

export default Stars
