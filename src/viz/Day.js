import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import chroma from 'chroma-js';

const dayWidth = 55;
const dayHeight = 75;
const topPadding = 600;
const margin = { left: 40, top: 20, right: 40, bottom: 20 };

// d3 functions
const xScale = d3.scaleLinear().domain([0, 6]);
const yScale = d3.scaleLinear();
const amountScale = d3.scaleLog();
const colorScale = chroma.scale(['#53c3ac', '#f7e883', '#e85178']);

function Day({ width, colors, expenses, selectedWeek }) {
	const [loaded, setLoaded] = useState(false);
	const container = useRef(null);
	const containerRef = useRef(null);
	let days = null;
	let backs = null;

	const [minDate, maxDate] = d3.extent(expenses, (d) =>
		d3.timeDay.floor(d.date)
	);
	// dynamically calculate height depending on how many
	// possible weeks are within the range
	// not sure why, but we need to subtract 100 for nice looking layout
	const height =
		dayHeight * 2 * d3.timeWeek.range(minDate, maxDate).length - 100;

	useEffect(() => {
		if (!loaded) {
			xScale.range([margin.left, width - margin.right]);
			container.current = d3.select(containerRef.current);

			calculateData();
			renderBacks();
			renderDays();
			setLoaded(true);
		} else {
			calculateData();
			renderDays();
		}
	});

	const calculateData = () => {
		const weeksExtent = d3.extent(expenses, (d) =>
			d3.timeWeek.floor(d.date)
		);
		yScale.range([height - margin.bottom, margin.top]).domain(weeksExtent);

		// object of all days with total amount of expenses
		const totalsByDay = _.chain(expenses)
			.groupBy((d) => d3.timeDay.floor(d.date))
			.reduce((obj, expenses, date) => {
				obj[date] = expenses.reduce(
					(sum, expense) => sum + expense.amount,
					0
				);
				return obj;
			}, {})
			.value();

		// get min + max total amounts per day
		// setup for each day rect
		const totalsExtent = d3.extent(_.values(totalsByDay));
		amountScale.domain(totalsExtent);

		days = _.map(totalsByDay, (total, date) => {
			date = new Date(date);
			let { x, y } = calculateDayPosition(date, true);

			return {
				date,
				fill: colorScale(amountScale(total)),
				x,
				y,
			};
		});

		// get all the days in the selected week
		const calculatedSelectedWeek = d3.timeDay.range(
			selectedWeek,
			d3.timeWeek.offset(selectedWeek, 1)
		);

		// calculate the position of each day in the selected week
		// and for every day within the range
		backs = _.chain(calculatedSelectedWeek)
			.map((date) => calculateDayPosition(date, true))
			.union(
				d3.timeDay
					.range(minDate, maxDate)
					.map((date) => calculateDayPosition(date))
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

	const renderBacks = () => {
		container.current
			.selectAll('.back')
			.data(backs, (d) => d.date)
			.enter()
			.insert('rect', '.day')
			.classed('back', true)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`)
			.attr('width', 2 * dayWidth)
			.attr('height', 2 * dayHeight)
			.attr('x', -dayWidth)
			.attr('y', -dayHeight)
			.attr('fill', colors.gray);

		// console.log(backs);
	};

	const renderDays = () => {
		const t = d3.transition().duration(500);
		const fontSize = 15;

		let renderDays = container.current
			.selectAll('.day')
			.data(days, (d) => d.date);

		// exit
		renderDays.exit().remove();

		// enter + update
		let enter = renderDays
			.enter()
			.append('g')
			.classed('day', true)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`);
		enter.append('rect').attr('fill', (d) => d.fill);
		enter
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.attr('fill', colors.white)
			.attr('font-size', fontSize);

		renderDays = enter.merge(renderDays);
		renderDays
			.transition(t)
			.delay((d, i) => d.date.getDay() * 50)
			.attr('transform', (d) => `translate(${[d.x, d.y]})`);

		renderDays
			.select('rect')
			.attr('width', 2 * dayWidth)
			.attr('height', 2 * dayHeight)
			.attr('x', -dayWidth)
			.attr('y', -dayHeight)
			.transition(t)
			.attr('fill', (d) => d.fill);

		const timeFormat = d3.timeFormat('%m/%d');
		renderDays
			.select('text')
			.attr('y', (d) => dayHeight - 0.75 * fontSize)
			.text((d) => timeFormat(d.date));
	};

	return <g ref={containerRef} id="days" />;
}

export default Day;
