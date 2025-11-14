import React, { useRef, useMemo } from 'react'
import { TextureLoader, Color } from 'three'
import { useLoader } from '@react-three/fiber'
import { useCamera } from '../context/Camera'

const Planet = ({ count }) => {
	const mesh = useRef()
	const { handleFocus } = useCamera()

	const texture = useLoader(TextureLoader, '/textures/planet.jpg')

	// Create per-instance color palettes
	const instanceColors = useMemo(() => {
		if (!count) return new Float32Array(0)

		const planetColors = new Float32Array(count * 3)
		const planetColor = new Color()

		for (let i = 0; i < count; i++) {
			const hue = (200 + Math.random() * 100) / 360
			const saturation = (40 + Math.random() * 40) / 100
			const lightness = (50 + Math.random() * 20) / 100
			const offset = i * 3

			planetColor.setHSL(hue, saturation, lightness)
			planetColor.toArray(planetColors, offset)
		}

		return planetColors
	}, [count])

	// Combined shader that renders both planet and atmosphere
	const onBeforeCompile = useMemo(() => {
		return (shader) => {
			// Add uniforms for atmosphere
			shader.uniforms.atmosphereCoefficient = { value: 0.6 }
			shader.uniforms.atmospherePower = { value: 3.5 }
			shader.uniforms.atmosphereIntensity = { value: 0.3 }

			// Declare uniforms in fragment shader
			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <common>',
				`
				#include <common>
				uniform float atmosphereCoefficient;
				uniform float atmospherePower;
				uniform float atmosphereIntensity;
				`
			)

			// Modify fragment shader to add atmospheric glow
			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <dithering_fragment>',
				`
				#include <dithering_fragment>
				
				// Calculate atmospheric glow on edges
				vec3 normalizedNormal = normalize(vNormal);
				float atmoIntensity = pow(atmosphereCoefficient - dot(normalizedNormal, vec3(0.0, 0.0, 1.0)), atmospherePower);
				atmoIntensity = max(atmoIntensity, 0.0) * atmosphereIntensity;
				
				// Use vertex color for atmosphere tint
				vec3 atmosphereColor = vColor * 1.2; // Brighten the color for glow
				
				// Blend atmosphere with existing color
				gl_FragColor.rgb += atmosphereColor * atmoIntensity;
				`
			)
		}
	}, [])

	return (
		<instancedMesh ref={mesh} args={[null, null, count]} onClick={handleFocus} castShadow receiveShadow>
			<sphereGeometry args={[2, 32, 32]}>
				<instancedBufferAttribute attach='attributes-color' args={[instanceColors, 3]} />
			</sphereGeometry>
			<meshStandardMaterial map={texture} vertexColors onBeforeCompile={onBeforeCompile} />
		</instancedMesh>
	)
}

export default Planet
