import { useEffect, useState } from 'react';
import './App.css';
import * as d3 from 'd3';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import expensesData from './data/expenses.json';
import Expenses from './viz/Expenses';
import Categories from './viz/Categories';

const width = 900;
const height = 1800;

function App() {
	const [expenses, setExpenses] = useState([]);
	const [categories, setCategories] = useState([
		{
			name: 'Groceries',
			expenses: [],
		},
		{
			name: 'Restaurants',
			expenses: [],
		},
		,
	]);
	const [selectedWeek, setSelectedWeek] = useState(null);

	useEffect(() => {
		// componentwillmount
		let processedExpenses = expensesData.map((d) => {
			return {
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

	const props = {
		width,
		expenses,
		categories,
		selectedWeek,
	};

	const timeFormat = d3.timeFormat('%B %d, %Y');
	const isDataReady = expenses.length > 0 ? true : false;

	return (
		<div className="App">
			<h2>
				<span onClick={prevWeek}>
					<FontAwesomeIcon icon={faArrowLeft} />
				</span>
				Week of {timeFormat(selectedWeek)}
				<span onClick={nextWeek}>
					<FontAwesomeIcon icon={faArrowRight} />
				</span>
			</h2>
			<svg width={width} height={height}>
				{isDataReady && <Expenses {...props} />}
				{isDataReady && <Categories {...props} />}
			</svg>
		</div>
	);
}

export default App;
