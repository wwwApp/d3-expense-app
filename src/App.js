import { useEffect, useRef, useState } from 'react';
import './App.css';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import expensesData from './data/expenses.json';

const width = 900;
const height = 900;
const radius = 20;

const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLinear();
const simulation = d3
	.forceSimulation()
	.force('center', d3.forceCenter(width / 2, height / 2))
	.force('charge', d3.forceManyBody(-10))
	.force('collide', d3.forceCollide(radius))
	.stop();

function App() {
	useEffect(() => {
		if (container === null) {
			// componentdidmount
			simulation.on('tick', forceTick);
			let amountExtent = d3.extent(expenses, (d) => d.amount);
			colorScale.domain(amountExtent);

			container = d3.select(containerRef.current);
			renderCircles();

			simulation.nodes(expenses).alpha(0.9).restart();
		} else {
			// componentdidupdate
			renderCircles();
		}
	});

	const renderCircles = () => {
		// draw expenses circle
		circles = container.selectAll('circle').data(expenses, (d) => d.name);

		// exit
		circles.exit().remove();

		// enter + update
		circles = circles
			.enter()
			.append('circle')
			.attr('r', radius)
			.attr('fill-opacity', 0.25)
			.attr('stroke-width', 3)
			.merge(circles)
			.attr('fill', (d) => colorScale(amountScale(d.amount)))
			.attr('stroke', (d) => colorScale(amountScale(d.amount)));
	};

	const forceTick = () => {
		circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	};

	var circles = null;
	var container = null;
	const containerRef = useRef(null);
	const [expenses, setExpenses] = useState(expensesData);

	return <svg width={width} height={height} ref={containerRef}></svg>;
}

export default App;
