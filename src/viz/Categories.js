import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import _ from 'lodash';
import deleteIconSvg from '../imgs/trash-icon.svg';

const height = 600;
const topPadding = 125;
const categoryRadius = 55;
const deleteIconProp = {
	y: 170,
	radius: 30,
	bg: '#ffd2c7',
};

const amountScale = d3.scaleLog();
const colorScale = chroma.scale(['#53c3ac', '#f7e883', '#e85178']);
const simulation = d3
	.forceSimulation()
	.alphaDecay(0.001)
	.velocityDecay(0.3)
	.force('collide', d3.forceCollide(categoryRadius + 10))
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

function Categories({
	width,
	categories,
	expenses,
	selectedWeek,
	colors,
	deleteCategory,
}) {
	const [loaded, setLoaded] = useState(false);
	let calculatedCategories = null;
	let circles = null;
	let lines = null;
	let links = [];
	const container = useRef(null);
	const containerRef = useRef(null);
	const deleteIcon = useRef(null);

	useEffect(() => {
		simulation.on('tick', forceTick);

		if (!loaded) {
			container.current = d3.select(containerRef.current);

			calculateData();
			renderDeleteIcon();
			renderLinks();
			renderCircles();

			simulation.nodes(calculatedCategories).alpha(0.9).restart();

			drag.container(container.current)
				.on('start', dragStarted)
				.on('drag', dragExpense)
				.on('end', dragEnd);
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
				radius: categoryRadius,
				focusX: width / 2,
				focusY: height / 3 + topPadding,
				x: category.x || _.random(0.25 * width, 0.75 * width),
				y: category.y || _.random(0.25 * height, 0.5 * height),
			});
		});
	};

	const renderDeleteIcon = () => {
		deleteIconProp.x = width / 2;
		deleteIcon.current = container.current
			.append('g')
			.attr(
				'transform',
				(d) => `translate(${[deleteIconProp.x, deleteIconProp.y]})`
			);
		deleteIcon.current
			.append('circle')
			.attr('r', deleteIconProp.radius)
			.attr('fill', deleteIconProp.bg);
		deleteIcon.current
			.append('image')
			.attr('width', deleteIconProp.radius)
			.attr('height', deleteIconProp.radius)
			.attr('href', deleteIconSvg)
			.attr('x', -deleteIconProp.radius / 2)
			.attr('y', -deleteIconProp.radius / 2);
		deleteIcon.current.style('display', 'none');
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
		circles = container.current.selectAll('.category').data(categories);

		// exit
		circles.exit().remove();

		// enter
		let enter = circles.enter().append('g').classed('category', true);
		enter
			.append('circle')
			.attr('r', categoryRadius)
			.attr('stroke-width', 1)
			.style('cursor', 'move')
			.call(drag);
		enter
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '.35em')
			.attr('font-size', 16)
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

	/**
	 * Drag event functions
	 */
	let dragged = null;

	const dragStarted = (e) => {
		// not quite sure why these are necessary
		// drag stills works without these lines
		// https://observablehq.com/@d3/force-directed-lattice?collection=@d3/d3-drag
		simulation.alphaTarget(0.3).restart();
		e.subject.fx = e.subject.x;
		e.subject.fy = e.subject.y;

		deleteIcon.current.style('display', 'block');
	};

	const dragExpense = function (e) {
		dragged = null;

		e.subject.fx = e.x;
		e.subject.fy = e.y;

		const category = e.subject;
		const categoryX = e.x;
		const categoryY = e.y;
		const { x, y, radius } = deleteIconProp;

		const node = d3.select(this);
		// if dragged over the delete icon
		if (
			x - radius < categoryX &&
			categoryX < x + radius &&
			y - radius < categoryY &&
			categoryY < y + radius
		) {
			dragged = category;
			node.transition(d3.transition().duration(100)).attr(
				'r',
				radius - 10
			);
		} else {
			node.transition(d3.transition().duration(100)).attr(
				'r',
				categoryRadius
			);
		}
	};

	const dragEnd = (e) => {
		if (!e.active) {
			simulation.alphaTarget(0);
		}
		e.subject.fx = null;
		e.subject.fy = null;

		deleteIcon.current.style('display', 'none');

		if (dragged) {
			deleteCategory(dragged);
		}

		dragged = null;
	};

	return <g ref={containerRef} id="categories"></g>;
}

export default Categories;
