import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Physics } from '@react-three/rapier'

import Scene from './Scene'

// Constants moved outside components
const cameraPosition = [0, 50, 150]
const backgroundColor = 'black'
const ambientLightIntensity = 0.1

// App component
const App = () => (
    <Canvas camera={{ position: cameraPosition, far: 200000 }}>
        <ambientLight intensity={ambientLightIntensity} />
        <color attach='background' args={[backgroundColor]} />
        <OrbitControls maxDistance={450} minDistance={50} makeDefault />

        <Physics gravity={[0, 0, 0]}>
            <Scene />
        </Physics>

        <EffectComposer>
            <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
    </Canvas>
)

export default App
