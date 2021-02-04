import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';

const height = 600;
const margin = { left: 40, top: 25, right: 40, bottom: 25 };
const expenseRadius = 10;

// d3 functions
const daysOfWeek = [
	[0, 'Sat'],
	[1, 'Mon'],
	[2, 'Tue'],
	[3, 'Wed'],
	[4, 'Thu'],
	[5, 'Fri'],
	[6, 'Sun'],
];
const xScale = d3.scaleBand().domain(daysOfWeek.map((day) => day[0]));
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLinear();
const simulation = d3
	.forceSimulation()
	.alphaDecay(0.001)
	.velocityDecay(0.3)
	.force('collide', d3.forceCollide(expenseRadius))
	.force(
		'x',
		d3.forceX((d) => d.focusX)
	)
	.force(
		'y',
		d3.forceY((d) => d.focusY)
	)
	.stop();
const drag = d3.drag();

function Expenses({
	width,
	expenses,
	selectedWeek,
	categories,
	linkToCategory,
	changeDate,
}) {
	let calculatedData = null;
	let circles = null;
	let days = null;
	let weeks = null;
	const container = useRef(null);
	const containerRef = useRef(null);

	// run only once for set up
	useEffect(() => {
		// console.log('run once');
		xScale.range([margin.left, width - margin.right]);
		simulation.on('tick', forceTick);

		container.current = d3.select(containerRef.current);
		calculateData();
		renderDays();
		renderWeeks();
		renderCircles();

		simulation.nodes(calculatedData).alpha(0.9).restart();
		drag.container(container.current)
			.on('start', dragStarted)
			.on('drag', dragExpense)
			.on('end', dragEnd);
	}, []);

	// run on every updates
	useEffect(() => {
		// console.log('run everytime');
		simulation.on('tick', forceTick);

		calculateData();
		renderCircles();

		simulation.nodes(calculatedData).alpha(0.9).restart();
	});

	const forceTick = () => {
		// console.log('tick');
		circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	};

	// calculate expenses circle position using its date
	const calculateData = () => {
		let weeksExtent = d3.extent(expenses, (d) => d3.timeWeek.floor(d.date));
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

			// selectedWeek is always on Sunday
			// hence, to find the date out of the selected week,
			// you're adding day of the week to it
			return {
				name,
				date: d3.timeDay.offset(selectedWeek, dayOfWeek),
				radius: 80,
				x,
				y,
			};
		});

		calculatedData = _.chain(expenses)
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
		// console.log('rendering circles');
		// draw expenses circle
		circles = container.current
			.selectAll('.expense')
			.data(calculatedData, (d) => d.name);

		// exit
		circles.exit().remove();

		// enter + update
		circles = circles
			.enter()
			.append('circle')
			.classed('expense', true)
			.attr('r', expenseRadius)
			.attr('fill-opacity', 0.25)
			.attr('stroke-width', 3)
			.call(drag)
			.merge(circles)
			.attr('fill', (d) => colorScale(amountScale(d.amount)))
			.attr('stroke', (d) => colorScale(amountScale(d.amount)));
	};

	const renderDays = () => {
		// console.log('rendering days');
		const fontSize = 12;

		let renderDays = container.current
			.selectAll('.day')
			.data(days, (d) => d.name)
			.enter()
			.append('g')
			.classed('day', true)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`);

		renderDays
			.append('circle')
			.attr('r', (d) => d.radius)
			.attr('fill', '#ccc')
			.attr('opacity', 0.25);

		renderDays
			.append('text')
			.attr('y', (d) => d.radius + fontSize)
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.attr('fill', '#ccc')
			.style('font-weight', 600)
			.text((d) => d.name);
	};

	const renderWeeks = () => {
		// console.log('rendering weeks');
		let renderWeeks = container.current
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

	const dragStarted = (e) => {
		// not quite sure why these are necessary
		// drag stills works without these lines
		// https://observablehq.com/@d3/force-directed-lattice?collection=@d3/d3-drag
		simulation.alphaTarget(0.3).restart();
		e.subject.fx = e.subject.x;
		e.subject.fy = e.subject.y;
	};

	let dragged = null;
	const dragExpense = (e) => {
		e.subject.fx = e.x;
		e.subject.fy = e.y;

		let expense = e.subject;
		let expenseX = e.x;
		let expenseY = e.y;

		// check for overlapped categories
		categories.forEach((category) => {
			let { x, y, radius } = category;
			if (
				x - radius < expenseX &&
				expenseX < x + radius &&
				y - radius < expenseY &&
				expenseY < y + radius
			) {
				dragged = { expense, category, type: 'category' };
			}
		});

		// check for overlapped days
		days.forEach((day) => {
			let { x, y, radius } = day;
			if (
				x - radius < expenseX &&
				expenseX < x + radius &&
				y - radius < expenseY &&
				expenseY < y + radius
			) {
				dragged = { expense, day, type: 'day' };
			}
		});
	};

	const dragEnd = (e) => {
		if (!e.active) {
			simulation.alphaTarget(0);
		}
		e.subject.fx = null;
		e.subject.fy = null;

		if (dragged && dragged.type === 'category') {
			linkToCategory(dragged);
		} else if (dragged && dragged.type === 'day') {
			changeDate(dragged);
		}
		dragged = null;
	};

	return <g ref={containerRef}></g>;
}

export default Expenses;
