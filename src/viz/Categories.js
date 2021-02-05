import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';

const height = 600;
const topPadding = 125;
const radius = 55;

const amountScale = d3.scaleLog();
const colorScale = chroma.scale(['#53c3ac', '#f7e883', '#e85178']);
const simulation = d3
	.forceSimulation()
	.alphaDecay(0.001)
	.velocityDecay(0.3)
	.force(
		'collide',
		d3.forceCollide((d) => d.radius + 10)
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

function Categories({ width, categories, expenses, selectedWeek, colors }) {
	const [loaded, setLoaded] = useState(false);
	let calculatedCategories = null;
	let circles = null;
	let lines = null;
	let links = [];
	const container = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		simulation.on('tick', forceTick);

		if (!loaded) {
			container.current = d3.select(containerRef.current);
			calculateData();
			renderLinks();
			renderCircles();

			simulation.nodes(calculatedCategories).alpha(0.9).restart();
			setLoaded(true);
		} else {
			calculateData();
			renderLinks();
			renderCircles();

			simulation.nodes(calculatedCategories).alpha(0.9).restart();
		}
	});

	const forceTick = () => {
		circles.attr('transform', (d) => `translate(${[d.x, d.y]})`);
		lines
			.attr('transform', (d) => {
				let angle = Math.atan2(
					d.target.y - d.source.y,
					d.target.x - d.source.x
				);
				angle *= 180 / Math.PI;
				return (
					'translate(' +
					[d.source.x, d.source.y] +
					')rotate(' +
					angle +
					')'
				);
			})
			.attr('d', (d) => {
				const direction = d.source.date.getDay() < 3 ? -1 : 1;
				// calculate distance between source and target
				const dist = Math.sqrt(
					Math.pow(d.target.x - d.source.x, 2) +
						Math.pow(d.target.y - d.source.y, 2)
				);
				return (
					'M0,0 Q' +
					[dist / 2, (direction * dist) / 3] +
					' ' +
					[dist, 0]
				);
			});
	};

	const calculateData = () => {
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

		calculatedCategories = categories.map((category) => {
			let total = 0;
			category.expenses
				.filter(
					(expense) =>
						d3.timeWeek.floor(expense.date).getTime() ===
						selectedWeek.getTime()
				)
				.forEach((expense) => {
					total += expense.amount;
					links.push({
						source: expense,
						target: category,
					});
				});

			return Object.assign(category, {
				total,
				fill: colorScale(amountScale(total)),
				radius,
				focusX: width / 2,
				focusY: height / 3 + topPadding,
				x: category.x || _.random(0.25 * width, 0.75 * width),
				y: category.y || _.random(0.25 * height, 0.5 * height),
			});
		});
	};

	const renderLinks = () => {
		lines = container.current.selectAll('path').data(links);

		// exit
		lines.exit().remove();

		// enter + update
		lines = lines
			.enter()
			.insert('path', 'g')
			.attr('stroke', colors.black)
			.attr('stroke-width', 0.5)
			.attr('fill', 'none')
			.merge(lines);
	};

	const renderCircles = () => {
		const t = d3.transition().duration(500);

		// update
		circles = container.current.selectAll('g').data(categories);

		// exit
		circles.exit().remove();

		// enter
		let enter = circles.enter().append('g').classed('category', true);
		enter.append('circle').attr('r', radius).attr('stroke-width', 1);
		enter
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.attr('font-size', 14)
			.style('pointer-events', 'none');

		// enter + update selection
		circles = enter.merge(circles);
		circles
			.select('circle')
			// .transition(t)
			.attr('stroke', (d) => (d.total ? colors.black : colors.gray))
			.attr('fill', (d) => (d.total ? d.fill : colors.gray));
		circles
			.select('text')
			.text((d) => d.name)
			.transition(t)
			.attr('fill', (d) => (d.total ? colors.white : colors.black));
	};

	return <g ref={containerRef}></g>;
}

export default Categories;
