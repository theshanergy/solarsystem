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

        const spawnRadius = 500

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 5000 + spawnRadius
            const y = (Math.random() - 0.5) * 5000 + spawnRadius
            const z = (Math.random() - 0.5) * 5000 + spawnRadius

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
