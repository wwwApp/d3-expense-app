import { useEffect, useState } from 'react';
import './App.css';
import * as d3 from 'd3';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import expensesData from './data/expenses.json';
import Expenses from './viz/Expenses';
import Categories from './viz/Categories';
import { useForceUpdate } from './utils';

const width = 900;
const height = 1800;

function App() {
	const forceUpdate = useForceUpdate();
	const [expenses, setExpenses] = useState([]);
	const [categories, setCategories] = useState([
		{
			name: 'Groceries',
			expenses: [],
			total: 0,
		},
		{
			name: 'Restaurants',
			expenses: [],
			total: 0,
		},
	]);
	const [selectedWeek, setSelectedWeek] = useState(null);

	useEffect(() => {
		// componentwillmount
		let processedExpenses = expensesData.map((d, i) => {
			return {
				id: i,
				amount: d.amount,
				name: d.name,
				date: new Date(d.date),
			};
		});

		// default selected week will be the most recent week
		let selectedWeek = d3.max(processedExpenses, (exp) =>
			d3.timeWeek.floor(exp.date)
		);

		setExpenses(processedExpenses);
		setSelectedWeek(selectedWeek);
	}, []);

	const prevWeek = () => {
		// todo: out of range error handling
		let newWeek = d3.timeWeek.offset(selectedWeek, -1);
		setSelectedWeek(newWeek);
	};

	const nextWeek = () => {
		// todo: out of range error handling
		let newWeek = d3.timeWeek.offset(selectedWeek, -1);
		setSelectedWeek(newWeek);
	};

	const linkToCategory = ({ expense, category }) => {
		const index = category.expenses
			.map((expense) => expense.id)
			.indexOf(expense.id);
		if (index !== -1) {
			// if expense is already linked, then unlink
			category.expenses.splice(index, 1);
			category.total -= expense.amount;
		} else {
			category.expenses.push(expense);
			category.total += expense.amount;
		}
		forceUpdate();
	};

	const changeDate = ({ expense, day }) => {
		expense.date = day.date;
		forceUpdate();
	};

	const timeFormat = d3.timeFormat('%B %d, %Y');
	const isDataReady = expenses.length > 0 ? true : false;
	const links = (() => {
		// render links only when category's expense is in the selectedWeek
		let links = [];
		categories.forEach((category) => {
			category.expenses.forEach((expense) => {
				if (
					d3.timeWeek.floor(expense.date).getTime() ===
					selectedWeek.getTime()
				) {
					links.push({
						source: expense,
						target: category,
					});
				}
			});
		});

		return links;
	})();

	const props = {
		width,
		expenses,
		categories,
		selectedWeek,
		links,
		linkToCategory,
		changeDate,
	};

	return (
		<div className="App" style={{ width: width, margin: 'auto' }}>
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
			<svg width={width} height={height}>
				{isDataReady && <Categories {...props} />}
				{isDataReady && <Expenses {...props} />}
			</svg>
		</div>
	);
}

export default App;
