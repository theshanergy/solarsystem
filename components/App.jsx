import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import useObjectSelect from '../hooks/useObjectSelect'

import Sun from './Sun'
import Stars from './Stars'
import Planets from './Planets'

// Scene component
const Scene = () => {
    // Support object selection
    useObjectSelect()

    return (
        <>
            <Sun />
            <Planets />
            <Stars />
        </>
    )
}

// App component
const App = () => {
    return (
        <Canvas camera={{ position: [0, 50, 150], far: 200000 }}>
            <ambientLight intensity={0.1} />
            <color attach='background' args={['black']} />
            <OrbitControls maxDistance={450} minDistance={50} makeDefault />

            <Scene />

            <EffectComposer>
                <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
            </EffectComposer>
        </Canvas>
    )
}

export default App
