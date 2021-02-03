import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const radiusScale = d3.scaleLinear().range([15, 50]);

const height = 600;
const margin = { left: 40, top: 25, right: 40, bottom: 25 };
const simulation = d3
	.forceSimulation()
	.alphaDecay(0.001)
	.velocityDecay(0.3)
	.force(
		'collide',
		d3.forceCollide().radius((d) => d.radius + 10)
	)
	.force(
		'x',
		d3.forceX((d) => d.focusX)
	)
	.force(
		'y',
		d3.forceY((d) => d.focusY)
	)
	.stop();

function Categories({ width, categories }) {
	let calculatedData = null;
	let circles = null;
	const container = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		simulation.on('tick', forceTick);

		container.current = d3.select(containerRef.current);
		calculateData();
		renderCircle();

		simulation.nodes(calculatedData).alpha(0.9).restart();
	}, []);

	useEffect(() => {
		calculateData();
		renderCircle();

		simulation.nodes(calculatedData).alpha(0.9).restart();
	});

	const forceTick = () => {
		// console.log('tick');
		circles.attr('transform', (d) => `translate(${[d.x, d.y]})`);
	};

	const calculateData = () => {
		// calculate domain for radius (total amount of expenses)
		let radiusExtent = d3.extent(categories, (category) => category.total);
		radiusScale.domain(radiusExtent);

		calculatedData = categories.map((category) => {
			return Object.assign(category, {
				radius: radiusScale(category.total),
				focusX: width / 2,
				focusY: height / 4,
			});
		});
	};

	const renderCircle = () => {
		circles = container.current.selectAll('g').data(categories);

		// exit
		circles.exit().remove();

		// enter
		let enter = circles.enter().append('g').classed('category', true);
		enter
			.append('circle')
			.attr('fill', '#fff')
			.attr('stroke', '#666')
			.attr('stroke-width', 2);
		enter.append('text').attr('text-anchor', 'middle').attr('dy', '.35em');

		// enter + update selection
		circles = enter.merge(circles);
		circles.select('circle').attr('r', (d) => d.radius);
		circles.select('text').text((d) => d.name);
	};

	return <g ref={containerRef}></g>;
}

export default Categories;
