import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Color, AdditiveBlending } from 'three'

// Vertex shader code
const vertexShader = `
  uniform float uTime;
  uniform float uSpread;
  attribute vec3 aVelocity;
  attribute float aSize;
  void main() {
    vec3 pos = position;
    pos += aVelocity * uTime;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize;
  }
`

// Fragment shader code
const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`

const Explosion = ({ id, position, lookAt, spread = 10, onComplete }) => {
    const meshRef = useRef()

    // Set the direction of the explosion
    useEffect(() => {
        meshRef.current.lookAt(lookAt)
    }, [lookAt])

    // Update the explosion particles
    useFrame((state, delta) => {
        const mesh = meshRef.current
        const material = mesh.material

        // Update the uniform time value
        material.uniforms.uTime.value += delta

        // Fade out the explosion over time
        material.uniforms.uOpacity.value -= delta * 0.5

        // Check if the explosion is no longer visible
        if (material.uniforms.uOpacity.value <= 0) {
            onComplete(id)
        }
    })

    // Create the explosion geometry and material
    const geometry = useMemo(() => {
        const count = 100
        const positions = new Float32Array(count * 3)
        const velocities = new Float32Array(count * 3)
        const sizes = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Generate particles in a cone shape
            const radius = Math.random() * spread
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1) * 0.5 // Adjust the angle of the cone

            positions[i3] = radius * Math.cos(theta) * Math.sin(phi)
            positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi)
            positions[i3 + 2] = radius * Math.cos(phi)

            // Velocity based on the direction of the cone
            const speed = Math.random() * 0.2 + 0.05
            velocities[i3] = positions[i3] * speed
            velocities[i3 + 1] = positions[i3 + 1] * speed
            velocities[i3 + 2] = positions[i3 + 2] * speed

            // Vary particle sizes
            sizes[i] = Math.random() * 2 + 1
        }

        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
        geometry.setAttribute('aVelocity', new Float32BufferAttribute(velocities, 3))
        geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))

        return geometry
    }, [spread])

    const material = useMemo(() => {
        return new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: spread },
                uColor: { value: new Color('orange') },
                uOpacity: { value: 1 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
        })
    }, [spread])

    return <points ref={meshRef} position={position} geometry={geometry} material={material} frustumCulled={false} />
}

export default Explosion
