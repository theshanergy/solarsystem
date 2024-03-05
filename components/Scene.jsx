import useObjectSelect from '../hooks/useObjectSelect'
import useGravityImpulse from '../hooks/useGravityImpulse'

import Sun from './Sun'
import Stars from './Stars'
import Planets from './Planets'

// Scene component
const Scene = () => {
    // Custom hook for object selection
    useObjectSelect()

    // Custom hook for gravity logic
    useGravityImpulse()

    return (
        <>
            <Sun />

            <Planets />
            <Stars />
        </>
    )
}

export default Scene
