import React, { useRef, useState, useEffect } from 'react'
import { BufferGeometry } from 'three'

const Trail = ({ position }) => {
    const lineRef = useRef(new BufferGeometry())
    const [trailPoints, setTrailPoints] = useState([])

    useEffect(() => {
        if (position) {
            setTrailPoints((prev) => {
                const lastPoint = prev.length > 0 ? prev[prev.length - 1] : null
                if (!lastPoint || lastPoint.distanceTo(position) > 1) {
                    const newPoints = prev.length > 300 ? prev.slice(1) : prev
                    return [...newPoints, position.clone()] // Clone the position safely
                }
                return prev
            })
        }
    }, [position])

    useEffect(() => {
        if (trailPoints.length > 0) {
            lineRef.current.setFromPoints(trailPoints)
        }
    }, [trailPoints])

    return (
        <line>
            <bufferGeometry ref={lineRef} />
            <lineBasicMaterial color={'rgba(90,90,90)'} transparent opacity={0.25} />
        </line>
    )
}

export default Trail
