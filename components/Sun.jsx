import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { SUN_RADIUS } from '../config/constants'
import { useCamera } from '../context/Camera'
import noiseGLSL from '../shaders/noise.glsl?raw'

const Sun = () => {
	const { handleFocus } = useCamera()

	const CustomShaderMaterial = shaderMaterial(
		{ emissiveIntensity: 1.0, time: 0 },
		// Vertex Shader
		`
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vDisplacement;

        ${noiseGLSL}

        void main() {
            vUv = uv;
            vPosition = position;
            
            // Calculate displacement using multiple noise layers
            float t = time * 0.1;
            vec3 p = normalize(position);
            
            // Multi-octave noise for smooth base surface
            float displacement = fbm(p * 2.0 + vec3(t * 0.3)) * 0.5;
            
            // Add medium-scale churning (like solar granulation)
            displacement += fbm(p * 4.0 + vec3(t * 0.5, -t * 0.4, t * 0.2)) * 0.25;
            
            // Fine detail layer
            displacement += noise(p * 8.0 + vec3(sin(t * 0.3), cos(t * 0.3), t)) * 0.1;
            
            // Solar flare prominences
            vec3 flarePos = p * 1.5 + vec3(cos(t * 0.2) * 2.0, sin(t * 0.15) * 2.0, t * 0.3);
            float flare1 = pow(max(0.0, noise(flarePos)), 2.5) * 0.6;
            float flare2 = pow(max(0.0, noise(flarePos * 1.3 + vec3(10.0))), 3.0) * 0.8;
            
            displacement += flare1 + flare2;
            
            // Smooth the displacement
            displacement = displacement * 0.5 + 0.5;
            displacement = smoothstep(0.2, 0.8, displacement) * 1.2;
            
            vDisplacement = displacement;
            
            // Calculate smooth normal for better lighting
            float delta = 0.01;
            vec3 tangent1 = vec3(delta, 0.0, 0.0);
            vec3 tangent2 = vec3(0.0, delta, 0.0);
            
            float h1 = fbm((p + tangent1) * 2.0 + vec3(t * 0.3)) * 0.5;
            float h2 = fbm((p + tangent2) * 2.0 + vec3(t * 0.3)) * 0.5;
            
            vec3 smoothNormal = normalize(normal + (h1 - displacement) * tangent1 + (h2 - displacement) * tangent2);
            
            // Apply displacement along smooth normal
            vec3 newPosition = position + smoothNormal * displacement * 0.15;
            
            vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
            vWorldPosition = worldPosition.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * smoothNormal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
        `,
		// Fragment Shader
		`
        uniform float time;
        uniform float emissiveIntensity;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vDisplacement;

        const float RESOLUTION = 1200.0;

        vec4 renderSunPattern(vec2 uv, float t) {
            vec2 u = uv * RESOLUTION;
            vec2 r = vec2(RESOLUTION, RESOLUTION);
            float i, a, d = 0.0, s;
            vec3 p;
            vec4 o = vec4(0.0);
            
            for(i = 0.0; i < 100.0; i += 1.0) {
                vec2 screenPos = (u - r.xy / 2.0) / r.y;
                screenPos += cos(t * 0.3) * vec2(0.02, 0.03);

                p = vec3(screenPos * d, d - 9.0);

                s = length(p) - 5.8;

                for(a = 1.0; a < 24.0; a += a) {
                    p += cos(0.15 * t + a + p.yzx * 3.0) * 0.3;
                    vec3 sinP = sin(0.14 * t + p * a * 6.0);
                    s -= abs(dot(sinP, vec3(0.05))) / a;
                }

                d += s = 0.005 + abs(s) * 0.5;

                vec3 contribution = vec3(11.0, 2.7, 0.8) / max(s, 0.001);
                o += vec4(contribution, 0.0);
            }

            o = tanh(o / 1e4);
            o.rgb = pow(o.rgb, vec3(2.0));

            return o;
        }

        void main() {
            float t = time;
            vec3 dir = normalize(vWorldNormal);
            vec3 blending = pow(abs(dir), vec3(4.0));
            blending /= (blending.x + blending.y + blending.z);

            vec2 uvX = dir.yz * 0.5 + 0.5;
            vec2 uvY = dir.xz * 0.5 + 0.5;
            vec2 uvZ = dir.xy * 0.5 + 0.5;

            vec4 patternX = renderSunPattern(uvX, t);
            vec4 patternY = renderSunPattern(uvY, t);
            vec4 patternZ = renderSunPattern(uvZ, t);

            vec3 color = (
                patternX.rgb * blending.x +
                patternY.rgb * blending.y +
                patternZ.rgb * blending.z
            );

            color *= emissiveIntensity * 0.3;

            gl_FragColor = vec4(color, 1.0);
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
				<sphereGeometry args={[SUN_RADIUS, 128, 128]} />
				<customShaderMaterial ref={shaderRef} emissiveIntensity={5} time={0} />
			</mesh>

			<pointLight position={[0, 0, 0]} intensity={50000} color={'rgb(255, 207, 55)'} />
		</RigidBody>
	)
}

export default Sun
