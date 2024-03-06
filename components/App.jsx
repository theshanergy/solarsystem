import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Physics } from '@react-three/rapier'

import Scene from './Scene'

// App component
const App = () => (
    <Canvas camera={{ position: [0, 50, 150], far: 200000 }}>
        <color attach='background' args={['black']} />
        <ambientLight intensity={0.25} />

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
