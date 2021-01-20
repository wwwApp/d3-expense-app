import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';

const height = 900;
const margin = { left: 20, top: 20, right: 20, bottom: 20 };
const radius = 10;

// d3 functions
const xScale = d3.scaleBand().domain([0, 1, 2, 3, 4, 5, 6]);
const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLinear();
const simulation = d3
	.forceSimulation()
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

function Expenses({ width, data }) {
	var circles = null;
	var container = null;
	var calculatedData = null;
	const containerRef = useRef(null);

	const forceTick = () => {
		circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	};

	useEffect(() => {
		xScale.range([margin.left, width - margin.right]);
		simulation
			.force('center', d3.forceCenter(width / 2, height / 2))
			.on('tick', forceTick);
	}, [forceTick, width]);

	useEffect(() => {
		if (container === null) {
			// componentdidmount
			container = d3.select(containerRef.current);
			calculateData();
			renderCircles();

			simulation.nodes(calculatedData).alpha(0.9).restart();
		} else {
			// componentdidupdate
			calculateData();
			renderCircles();
		}
	});

	const calculateData = () => {
		let row = -1;
		calculatedData = _.chain(data)
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

		// set the scale depending on the amount of expense
		let amountExtent = d3.extent(calculatedData, (d) => d.amount);
		amountScale.domain(amountExtent);
	};

	const renderCircles = () => {
		// draw expenses circle
		circles = container
			.selectAll('circle')
			.data(calculatedData, (d) => d.name);

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

	return <svg width={width} height={height} ref={containerRef}></svg>;
}

export default Expenses;
