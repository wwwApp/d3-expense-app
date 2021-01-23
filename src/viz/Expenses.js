import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';

const height = 600;
const margin = { left: 40, top: 25, right: 40, bottom: 25 };
const radius = 10;

// d3 functions
const daysOfWeek = [
	[0, 'S'],
	[1, 'M'],
	[2, 'T'],
	[3, 'W'],
	[4, 'Th'],
	[5, 'F'],
	[6, 'S'],
];
const xScale = d3.scaleBand().domain(_.map(daysOfWeek, 0));
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
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

function Expenses({ width, data, selectedWeek }) {
	let container = null;
	let calculatedData = null;
	let circles = null;
	let days = null;
	let weeks = null;
	const containerRef = useRef(null);

	const forceTick = () => {
		circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	};

	useEffect(() => {
		xScale.range([margin.left, width - margin.right]);
		simulation.on('tick', forceTick);
	}, [forceTick]);

	useEffect(() => {
		if (container === null) {
			// componentdidmount
			container = d3.select(containerRef.current);
			calculateData();
			renderDays();
			renderWeeks();
			renderCircles();

			simulation.nodes(calculatedData).alpha(0.9).restart();
		} else {
			// componentdidupdate
			calculateData();
			renderCircles();
		}
	});

	// calculate expenses circle position using its date
	const calculateData = () => {
		let weeksExtent = d3.extent(data, (d) => d3.timeWeek.floor(d.date));
		yScale.domain(weeksExtent);

		let selectedWeekRadius = (width - margin.left - margin.right) / 2;
		let perAngle = Math.PI / 6;

		// rectangle for each week
		weeks = d3.timeWeek
			.range(weeksExtent[0], d3.timeWeek.offset(weeksExtent[1], 1))
			.map((week) => {
				return {
					week,
					x: margin.left,
					y: yScale(week) + height,
				};
			});

		// circles for the back of each day in semi-circle
		days = daysOfWeek.map((date) => {
			let [dayOfWeek, name] = date;
			let angle = Math.PI - perAngle * dayOfWeek;
			let x = selectedWeekRadius * Math.cos(angle) + width / 2;
			let y = selectedWeekRadius * Math.sin(angle) + margin.top;

			return {
				name,
				x,
				y,
			};
		});

		calculatedData = _.chain(data)
			.groupBy((d) => d3.timeWeek.floor(d.date))
			.map((week, key) => {
				let weekKey = new Date(key);
				return week.map((exp) => {
					let dayOfWeek = exp.date.getDay();
					let focusX = xScale(dayOfWeek);
					let focusY = yScale(weekKey) + height;

					if (weekKey.getTime() === selectedWeek.getTime()) {
						let angle = Math.PI - perAngle * dayOfWeek;

						focusX =
							selectedWeekRadius * Math.cos(angle) + width / 2;
						focusY =
							selectedWeekRadius * Math.sin(angle) + margin.top;
					}

					return Object.assign(exp, {
						focusX: focusX,
						focusY: focusY,
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
		console.log('rendering circles');
		// draw expenses circle
		circles = container
			.selectAll('.expense')
			.data(calculatedData, (d) => d.name);

		// exit
		circles.exit().remove();

		// enter + update
		circles = circles
			.enter()
			.append('circle')
			.classed('expense', true)
			.attr('r', radius)
			.attr('fill-opacity', 0.25)
			.attr('stroke-width', 3)
			.merge(circles)
			.attr('fill', (d) => colorScale(amountScale(d.amount)))
			.attr('stroke', (d) => colorScale(amountScale(d.amount)));
	};

	const renderDays = () => {
		console.log('rendering days');
		let renderDays = container
			.selectAll('.day')
			.data(days, (d) => d.name)
			.enter()
			.append('g')
			.classed('day', true)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`);

		let daysRadius = 60;
		let fontSize = 12;

		renderDays
			.append('circle')
			.attr('r', daysRadius)
			.attr('fill', '#ccc')
			.attr('opacity', 0.25);

		renderDays
			.append('text')
			.attr('y', daysRadius + fontSize)
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.attr('fill', '#ccc')
			.style('font-weight', 600)
			.text((d) => d.name);
	};

	const renderWeeks = () => {
		console.log('rendering weeks');
		let renderWeeks = container
			.selectAll('.week')
			.data(weeks, (d) => d.name)
			.enter()
			.append('g')
			.classed('week', true)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`);

		let rectHeight = 10;

		renderWeeks
			.append('rect')
			.attr('y', -rectHeight / 2)
			.attr('width', width - margin.left - margin.right)
			.attr('height', rectHeight)
			.attr('fill', '#ccc')
			.attr('opacity', 0.25);

		let weekFormat = d3.timeFormat('%m/%d');
		renderWeeks
			.append('text')
			.attr('text-anchor', 'end')
			.attr('dy', '.35em')
			.text((d) => weekFormat(d.week));
	};

	return <svg width={width} height={height * 2} ref={containerRef}></svg>;
}

export default Expenses;
