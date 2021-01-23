import { useEffect, useState } from 'react';
import './App.css';
import Expenses from './viz/Expenses';
import expensesData from './data/expenses.json';
import * as d3 from 'd3';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const width = 900;

function App() {
	const [expenses, setExpenses] = useState([]);
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
		let newWeek = d3.timeWeek.offset(selectedWeek, -1);
		setSelectedWeek(newWeek);
	};

	const nextWeek = () => {
		let newWeek = d3.timeWeek.offset(selectedWeek, -1);
		setSelectedWeek(newWeek);
	};

	const props = {
		width,
		data: expenses,
		selectedWeek,
	};

	const timeFormat = d3.timeFormat('%B %d, %Y');

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
			<Expenses {...props} />
		</div>
	);
}

export default App;
