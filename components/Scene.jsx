import useObjectSelect from '../hooks/useObjectSelect'
import useGravity from '../hooks/useGravity'

import Sun from './Sun'
import Stars from './Stars'
import Planets from './Planets'

// Scene component
const Scene = () => {
    // Custom hook for object selection
    useObjectSelect()

    // Custom hook for gravity logic
    useGravity()

    return (
        <>
            <Sun />

            <Planets />
            <Stars />
        </>
    )
}

export default Scene
