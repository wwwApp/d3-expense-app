import { useEffect, useRef, useState } from 'react';
import './App.css';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';
import expensesData from './data/expenses.json';

const width = 900;
const height = 900;
const margin = { left: 20, top: 20, right: 20, bottom: 20 };
const radius = 10;

// d3 functions
const xScale = d3
	.scaleBand()
	.domain([0, 1, 2, 3, 4, 5, 6])
	.range([margin.left, width - margin.right]);
const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLinear();
const simulation = d3
	.forceSimulation()
	.force('center', d3.forceCenter(width / 2, height / 2))
	// .force('charge', d3.forceManyBody(-10))
	.force('collide', d3.forceCollide(radius))
	.force(
		'x',
		d3.forceX((d) => d.focusX)
	)
	.force(
		'y',
		d3.forceY((d) => d.focusY)
	)
	.stop();

function App() {
	useEffect(() => {
		// componentwillmount
		let processedExpenses = expensesData.map((d) => {
			return {
				amount: d.amount,
				name: d.name,
				date: new Date(d.date),
				focusX: 20,
				focusY: 20,
			};
		});

		let row = -1;
		processedExpenses = _.chain(processedExpenses)
			.groupBy((d) => d3.timeWeek.floor(d.date))
			.sortBy()
			.map((week) => {
				row += 1;
				return week.map((exp) => {
					return Object.assign(exp, {
						focusX: xScale(exp.date.getDay()),
						focusY: row * 150,
					});
				});
			})
			.flatten()
			.value();

		setExpenses(processedExpenses);

		// set the scale depending on the amount of expense
		let amountExtent = d3.extent(expenses, (d) => d.amount);
		amountScale.domain(amountExtent);
	}, []);

	useEffect(() => {
		if (container === null) {
			simulation.on('tick', forceTick);

			// componentdidmount
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
