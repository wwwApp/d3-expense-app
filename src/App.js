import { useEffect, useState } from 'react';
import './App.css';
import Expenses from './viz/Expenses';
import expensesData from './data/expenses.json';

const width = 900;

function App() {
	const [expenses, setExpenses] = useState([]);

	useEffect(() => {
		// componentwillmount
		let processedExpenses = expensesData.map((d) => {
			return {
				amount: d.amount,
				name: d.name,
				date: new Date(d.date),
			};
		});
		setExpenses(processedExpenses);
	}, []);

	const props = {
		width,
		data: expenses,
	};

	return <Expenses {...props} />;
}

export default App;
