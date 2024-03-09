import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import noise from './../shaders/noise.glsl'
import { SUN_RADIUS } from '../config/constants'
import { useCamera } from '../context/Camera'

const Sun = () => {
    const { handleFocus } = useCamera()

    const CustomShaderMaterial = shaderMaterial(
        { emissiveIntensity: 1.0, time: 0 },
        // Vertex Shader
        `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        // Fragment Shader
        `
        uniform float time;
        uniform float emissiveIntensity;
        varying vec2 vUv;
        varying vec3 vPosition;

        ${noise}

        void main() {
            float noiseValue = noise(vPosition + time);

            vec3 color = mix(vec3(1.0, 0.1, 0.0), vec3(1.0, 0.2, 0.0), noiseValue);
            float intensity = (noiseValue * 0.5 + 0.5) * emissiveIntensity;

            gl_FragColor = vec4(color * intensity, 1.0);
        }
        `
    )

    extend({ CustomShaderMaterial })

    const shaderRef = useRef()

    // Update the time uniform on each frame
    useFrame(({ clock }) => {
        shaderRef.current.uniforms.time.value = clock.elapsedTime
    })

    return (
        <RigidBody colliders='ball' userData={{ type: 'Sun' }} type='kinematicPosition' onClick={handleFocus}>
            <mesh>
                <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
                <customShaderMaterial ref={shaderRef} emissiveIntensity={5} time={0} />
            </mesh>

            <pointLight position={[0, 0, 0]} intensity={50000} color={'rgb(255, 207, 55)'} />
        </RigidBody>
    )
}

export default Sun
