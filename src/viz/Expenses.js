import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

const dayWidth = 55;
const dayHeight = 75;
const topPadding = 600;
const margin = { left: 40, top: 20, right: 40, bottom: 20 };
const radius = 8;
const fontSize = 14;

// d3 functions
var xScale = d3.scaleLinear().domain([0, 6]);
var yScale = d3.scaleLinear();
var amountScale = d3.scaleLinear().range([radius, 3 * radius]);
const simulation = d3
	.forceSimulation()
	.alphaDecay(0.001)
	.velocityDecay(0.3)
	.force(
		'collide',
		d3.forceCollide((d) => d.radius + 2)
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
const drag = d3.drag();

function Expenses({
	width,
	colors,
	expenses,
	selectedWeek,
	categories,
	linkToCategory,
	changeDate,
}) {
	const [loaded, setLoaded] = useState(false);
	let calculatedExpenses = null;
	let circles = null;
	let days = null;
	const container = useRef(null);
	const containerRef = useRef(null);

	const [minDate, maxDate] = d3.extent(expenses, (d) =>
		d3.timeDay.floor(d.date)
	);
	// dynamically calculate height depending on how many
	// possible weeks are within the range
	// not sure why, but we need to subtract 100 for nice looking layout
	const height =
		dayHeight * 2 * d3.timeWeek.range(minDate, maxDate).length - 100;

	useEffect(() => {
		simulation.on('tick', forceTick);

		if (!loaded) {
			xScale.range([margin.left, width - margin.right]);

			container.current = d3.select(containerRef.current);

			calculateData();
			renderCircles();

			simulation.nodes(calculatedExpenses).alpha(0.9).restart();

			drag.container(container.current)
				.on('start', dragStarted)
				.on('drag', dragExpense)
				.on('end', dragEnd);
			setLoaded(true);
		} else {
			calculateData();
			renderCircles();

			simulation.nodes(calculatedExpenses).alpha(0.9).restart();
		}
	});

	const forceTick = () => {
		// console.log('tick');
		circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
	};

	// calculate expenses circle position using its date
	const calculateData = () => {
		// set scale for the range of dates
		const weeksExtent = d3.extent(expenses, (d) =>
			d3.timeWeek.floor(d.date)
		);
		yScale.range([height - margin.bottom, margin.top]).domain(weeksExtent);

		//set scale for the range of expense amounts
		const amountExtent = d3.extent(expenses, (d) => d.amount);
		amountScale.domain(amountExtent);

		calculatedExpenses = _.chain(expenses)
			.groupBy((d) => d3.timeWeek.floor(d.date))
			.map((expenses, week) => {
				week = new Date(week);
				return expenses.map((expense) => {
					let { x, y } = calculateDayPosition(expense.date, true);

					return Object.assign(expense, {
						radius: amountScale(expense.amount),
						focusX: x,
						focusY: y,
						x: expense.x || x,
						y: expense.y || y,
					});
				});
			})
			.flatten()
			.value();

		// get all the days in the selected week
		const calculatedSelectedWeek = d3.timeDay.range(
			selectedWeek,
			d3.timeWeek.offset(selectedWeek, 1)
		);

		// we're using _.union here to combine days within selected week
		// with all days with its position and date properties without duplicate
		days = _.chain(calculatedSelectedWeek)
			.map((date) =>
				Object.assign(calculateDayPosition(date, true), date)
			)
			.union(
				d3.timeDay
					.range(minDate, maxDate)
					.map((date) =>
						Object.assign(calculateDayPosition(date), date)
					)
			)
			.value();
	};

	const calculateDayPosition = (date, shouldSelectedWeekCurve) => {
		const dayOfWeek = date.getDay(); // [0 ~ 6]
		const week = d3.timeWeek.floor(date); // the week that the date is within
		let x = xScale(dayOfWeek); // day of the week position (horizontal)
		let y = yScale(week) + topPadding + 4 * dayHeight; // vertical

		if (
			shouldSelectedWeekCurve &&
			week.getTime() === selectedWeek.getTime()
		) {
			// if this day is within selected week and need to be placed in curve
			const offset = Math.abs(3 - dayOfWeek);
			y = topPadding + dayHeight - 0.5 * offset * dayHeight;
		}

		return { x, y };
	};

	const renderCircles = () => {
		// console.log('rendering circles');
		// draw expenses circle
		circles = container.current
			.selectAll('.expense')
			.data(calculatedExpenses, (d) => d.name);

		// exit
		circles.exit().remove();

		// enter + update
		circles = circles
			.enter()
			.append('circle')
			.classed('expense', true)
			.attr('fill', colors.white)
			.style('cursor', 'move')
			.call(drag)
			.merge(circles)
			.attr('r', (d) => d.radius)
			.attr('stroke', (d) => (d.categories ? colors.black : ''));
	};

	/**
	 * Drag event functions
	 */
	let dragging = false;
	let dragged = null;

	const dragStarted = (e) => {
		dragging = true;
		// not quite sure why these are necessary
		// drag stills works without these lines
		// https://observablehq.com/@d3/force-directed-lattice?collection=@d3/d3-drag
		simulation.alphaTarget(0.3).restart();
		e.subject.fx = e.subject.x;
		e.subject.fy = e.subject.y;
	};

	const dragExpense = (e) => {
		dragged = null;

		e.subject.fx = e.x;
		e.subject.fy = e.y;

		let expense = e.subject;
		let expenseX = e.x;
		let expenseY = e.y;

		// check for overlapped categories
		categories.forEach((category) => {
			const { x, y, radius } = category;
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
			const { x, y } = day;
			if (
				x - dayWidth < expenseX &&
				expenseX < x + dayWidth &&
				y - dayHeight < expenseY &&
				expenseY < y + dayHeight
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

		if (dragged) {
			if (dragged.type === 'category') {
				linkToCategory(dragged);
			} else if (dragged.type === 'day') {
				changeDate(dragged);
			}
		}

		dragged = null;
		dragging = false;
	};

	return <g ref={containerRef}></g>;
}

export default Expenses;
