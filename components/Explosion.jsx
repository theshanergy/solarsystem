import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Vertex shader code
const vertexShader = `
  uniform float uTime;
  uniform float uSpread;

  attribute vec3 aVelocity;

  void main() {
    vec3 pos = position;
    pos += aVelocity * uTime;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0;
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

const Explosion = ({ id, position, spread = 5, onComplete }) => {
    const meshRef = useRef()

    useFrame((state, delta) => {
        const mesh = meshRef.current
        const material = mesh.material

        // Update the uniform time value
        material.uniforms.uTime.value += delta

        // Fade out the explosion over time
        material.uniforms.uOpacity.value -= delta * 2

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

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Random position within a sphere
            const radius = Math.random() * spread
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(Math.random() * 2 - 1)
            positions[i3] = radius * Math.cos(theta) * Math.sin(phi)
            positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi)
            positions[i3 + 2] = radius * Math.cos(phi)

            // Random velocity
            const speed = Math.random() * 0.1 + 0.05
            velocities[i3] = (Math.random() - 0.5) * speed
            velocities[i3 + 1] = (Math.random() - 0.5) * speed
            velocities[i3 + 2] = (Math.random() - 0.5) * speed
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.setAttribute('aVelocity', new THREE.Float32BufferAttribute(velocities, 3))

        return geometry
    }, [spread])

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: spread },
                uColor: { value: new THREE.Color('orange') },
                uOpacity: { value: 1 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    }, [spread])

    return <points ref={meshRef} position={position} geometry={geometry} material={material} frustumCulled={false} />
}

export default Explosion
