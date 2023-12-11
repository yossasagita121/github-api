import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NestedCircularPacking = ({ data, width, height }) => {
    const svgRef = useRef()

    useEffect(() => {
        if (!data || data.length === 0) return

        // Create a pack layout
        const pack = data => d3.pack()
            .size([width, height])
            .padding(4)
            (d3.hierarchy({ children: data })
                .sum(d => d.value))

        const root = pack(data)

        const svg = d3.select(svgRef.current)

        // Add nested circles inside the "Lines" circle
        const nestedData = root.descendants().slice(1).flatMap(parentData => {
            return [
                { name: 'Duplicate Lines', parentData, value: parentData.data.duplicate_lines, r: parentData.r, x: parentData.x, y: parentData.y },
                { name: 'Bad Code', parentData, value: parentData.data.bad_code, r: parentData.r, x: parentData.x, y: parentData.y },
            ]
        })

        const nestedRoot = pack(nestedData)

        // Add parent circle for "Lines"
        svg.selectAll('.parent-circle')
            .data(root.descendants().slice(1))
            .enter()
            .append('circle')
            .attr('class', 'parent-circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r)
            .attr('fill', 'lightblue')
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)

        // Add tooltips for parent circle
        svg.selectAll('.parent-circle')
            .append('title')
            .text(d => `${d.data.name}\nLines: ${d.data.value}\nDuplicate Lines: ${d.data.duplicate_lines}%\nBad Code: ${d.data.bad_code}%`)

        // Add nested circles inside the "Lines" circle for "Duplicate Lines" and "Bad Code"
        svg.selectAll('.nested-circle')
            .data(nestedRoot.descendants().slice(1))
            .enter()
            .append('circle')
            .attr('class', 'nested-circle')
            .attr('cx', d => d.data.x)
            .attr('cy', d => d.data.y)
            .attr('r', d => (d.value / 100) * d.data.r)
            .attr('fill', d => d.data.name === 'Duplicate Lines' ? '#fcf87c' : 'red')
            .attr('stroke', d => d.data.name === 'Duplicate Lines' ? 'orange' : 'red')
            .attr('stroke-width', 2)
        // .attr('fill-opacity', 0.5)

    }, [data, width, height])

    return (
        <div className='mx-auto'>
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    )
}

export default NestedCircularPacking
