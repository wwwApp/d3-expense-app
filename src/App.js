import { useEffect, useState } from 'react';
import './App.css';
import * as d3 from 'd3';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import expensesData from './data/expenses.json';
import Expenses from './viz/Expenses';
import Categories from './viz/Categories';
import Day from './viz/Day';
import { useForceUpdate } from './utils';

const width = 750;
const height = 1800;
const colors = {
	white: '#fff8fa',
	gray: '#e1ecea',
	black: '#516561',
};

function App() {
	const forceUpdate = useForceUpdate();
	const [expenses, setExpenses] = useState([]);
	const [categories, setCategories] = useState([
		{ name: 'Restaurants', expenses: [], total: 0 },
		{ name: 'Travel', expenses: [], total: 0 },
		{ name: 'Dessert', expenses: [], total: 0 },
	]);
	const [selectedWeek, setSelectedWeek] = useState(null);

	useEffect(() => {
		// componentwillmount
		const processedExpenses = expensesData.map((d, i) => {
			return {
				id: i,
				amount: d.amount,
				name: d.name,
				date: new Date(d.date),
				categories: 0,
			};
		});

		// default selected week will be the most recent week
		const defaultSelectedWeek = d3.max(processedExpenses, (exp) =>
			d3.timeWeek.floor(exp.date)
		);

		setExpenses(processedExpenses);
		setSelectedWeek(defaultSelectedWeek);
	}, []);

	const prevWeek = () => {
		// todo: out of range error handling
		const newWeek = d3.timeWeek.offset(selectedWeek, -1);
		setSelectedWeek(newWeek);
	};

	const nextWeek = () => {
		// todo: out of range error handling
		const newWeek = d3.timeWeek.offset(selectedWeek, 1);
		setSelectedWeek(newWeek);
	};

	const linkToCategory = ({ expense, category }) => {
		const index = category.expenses
			.map((expense) => expense.id)
			.indexOf(expense.id);
		if (index !== -1) {
			// if expense is already linked, then unlink
			category.expenses.splice(index, 1);
			expense.categories -= 1;
		} else {
			category.expenses.push(expense);
			expense.categories += 1;
		}
		forceUpdate();
	};

	const changeDate = ({ expense, day }) => {
		expense.date = day.date;
		forceUpdate();
	};

	const timeFormat = d3.timeFormat('%B %d, %Y');
	const isDataReady = expenses.length > 0 ? true : false;

	const appStyle = { width: width, margin: 'auto', position: 'relative' };
	const svgStyle = {
		overflow: 'visible',
		position: 'absolute',
		top: 0,
		width,
		height,
		zIndex: -1,
	};

	const props = {
		width,
		colors,
		expenses,
		categories,
		selectedWeek,
		linkToCategory,
		changeDate,
	};

	return (
		<div className="App" style={appStyle}>
			<header className="flex">
				<FontAwesomeIcon
					icon={faArrowLeft}
					onClick={prevWeek}
					className="btn"
				/>
				<h1>Week of {timeFormat(selectedWeek)}</h1>
				<FontAwesomeIcon
					icon={faArrowRight}
					onClick={nextWeek}
					className="btn"
				/>
			</header>
			<svg width={width} height={height} style={svgStyle}>
				{isDataReady && <Day {...props} />}
				{isDataReady && <Categories {...props} />}
				{isDataReady && <Expenses {...props} />}
			</svg>
		</div>
	);
}

export default App;
