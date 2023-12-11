import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as d3Force from 'd3-force';

const CircularPacking = ({ data, width, height }) => {
    const svgRef = useRef()

    useEffect(() => {
        if (!data || data.length === 0) return

        // Create a pack layout
        const pack = data => d3.pack()
            .size([width, height])
            .padding(20)
            (d3.hierarchy({ children: data })
                .sum(d => d.value))

        const root = pack(data)

        const svg = d3.select(svgRef.current)

        // Add nested circles inside the "Lines" circle
        const nestedData = root.descendants().slice(1).flatMap(parentData => {
            const totalChildren = parentData.data.data.length;

            return [
                ...parentData.data.data.map((d, index) => {
                    // Calculate polar coordinates within the parent circle
                    const angle = (index / totalChildren) * (2 * Math.PI);
                    const parentRadius = parentData.r * 0.8; // Adjust the scale factor as needed

                    // Calculate child circle's position within the parent circle
                    const distanceFactor = 0.5; // Adjust this factor to control the distance from the center
                    const x = parentData.x + (parentRadius * distanceFactor) * Math.cos(angle);
                    const y = parentData.y + (parentRadius * distanceFactor) * Math.sin(angle);

                    // Increase the scaling factor to make the child circles bigger
                    const scaleFactor = 2; // Adjust this factor as needed

                    // Calculate the radius of the child circle based on its value
                    const maxChildRadius = parentRadius * 0.7; // Maximum allowed child radius
                    const childRadius = Math.min(scaleFactor * (parseInt(d.data.component.measures.find(o => o.metric === "lines").value) / parentData.data.value) * maxChildRadius, maxChildRadius);

                    // Calculate the "bad_code" value based on the formula you provided
                    const badCodeValue = (
                        (parseInt(d.data.component.measures.find(o => o.metric === "minor_violations").value) * 1) +
                        (parseInt(d.data.component.measures.find(o => o.metric === "major_violations").value) * 2) +
                        (parseInt(d.data.component.measures.find(o => o.metric === "critical_violations").value) * 3) +
                        (parseInt(d.data.component.measures.find(o => o.metric === "blocker_violations").value) * 4)
                    ) / (parseInt(d.data.component.measures.find(o => o.metric === "lines").value) * 4);

                    return {
                        name: `commit_${index + 1}`,
                        parentData,
                        value: parseInt(d.data.component.measures.find(o => o.metric === "lines").value),
                        bad_code: badCodeValue,
                        r: childRadius,
                        x: x,
                        y: y,
                        // Add additional properties as needed
                    };
                })
            ];
        });

        // Create a force simulation
        const simulation = d3Force.forceSimulation(nestedData)
            .force('collide', d3Force.forceCollide().radius(d => d.r + 1).iterations(4)) // Adjust the radius and iterations as needed
            .stop();

        // Run the simulation for a few iterations to resolve collisions
        for (let i = 0; i < 120; ++i) {
            simulation.tick();
        }

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

        // Add labels for the parent circles
        svg.selectAll('.parent-label')
            .data(root.descendants().slice(1))
            .enter()
            .append('text')
            .attr('class', 'parent-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.value !== 0 ? d.data.name : "")
            .style('font-size', '10px')

        // Add tooltips for parent circle
        svg.selectAll('.parent-circle')
            .append('title')
            .text(d => `${d.data.name}\nLines: ${d.data.value}\nCommits: ${d.data.data.length > 0 ? d.data.data.length : `not detected by sonarqube`}`)

        // Add labels for parent circle
        svg.selectAll('.parent-label')
            .data(root.descendants().slice(1))
            .enter()
            .append('text')
            .attr('class', 'parent-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y + d.r + 5) // Adjust the vertical position of the label
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px') // Adjust the font size as needed
            .text(d => d.data.name);


        const maxBadCode = d3.max(nestedData, d => d.bad_code)

        const colorScale = d3.scaleLinear()
            .domain([0, maxBadCode * 0.25, maxBadCode * 0.5, maxBadCode]) // Adjust these thresholds based on your data
            .range(['white', 'rgba(255, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.5)', 'red']);

        // Add nested circles inside the "Lines" circle for "Duplicate Lines" and "Bad Code"
        svg.selectAll('.nested-circle')
            .data(nestedData)
            .enter()
            .append('circle')
            .attr('class', 'nested-circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r)
            .style('fill', d => maxBadCode > 0 ? colorScale(d.bad_code) : 'white')  // Hex color code for orange
            .style('stroke', 'black')  // Border color
            .style('stroke-width', 1)  // Border width
            .style('fill-opacity', 0.7) // Circle opacity
            .style('stroke-opacity', 0.7); // Border opacity

        // Add tooltips for nested circles
        svg.selectAll('.nested-circle')
            .append('title')
            .text(d => `${d.name}\nLines: ${d.value}\nBad_code: ${(d.bad_code * 100).toFixed(3)}%`);

    }, [data, width, height])

    return (
        <div className='mx-auto'>
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    )
}

export default CircularPacking
