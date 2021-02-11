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
	const [categories, setCategories] = useState([]);
	const [selectedWeek, setSelectedWeek] = useState(null);
	const [prevDisabled, setPrevDisabled] = useState(false);
	const [nextDisabled, setNextDisabled] = useState(true);

	useEffect(() => {
		// componentwillmount
		// set initial states

		// expenses
		const processedExpenses = expensesData.map((d, i) => {
			return {
				id: i,
				amount: d.amount,
				name: d.name,
				date: new Date(d.date),
				categories: 0,
			};
		});
		setExpenses(processedExpenses);

		// categories
		const initCategories = [
			{ name: 'Restaurants', expenses: [], total: 0 },
			{ name: 'Travel', expenses: [], total: 0 },
			{ name: 'Dessert', expenses: [], total: 0 },
		];
		setCategories(initCategories);

		// selected week
		// default selected week will be the most recent week
		const defaultSelectedWeek = d3.max(processedExpenses, (exp) =>
			d3.timeWeek.floor(exp.date)
		);
		setSelectedWeek(defaultSelectedWeek);
	}, []);

	const prevWeek = () => {
		if (prevDisabled) return;

		setNextDisabled(false);
		const minWeek = d3
			.extent(expenses, (d) => d3.timeWeek.floor(d.date))[0]
			.getTime();
		const newWeek = d3.timeWeek.offset(selectedWeek, -1);

		if (newWeek.getTime() === minWeek) {
			// if new week is the min week
			// you don't want the btn to be enabled for next event
			setPrevDisabled(true);
		}
		setSelectedWeek(newWeek);
	};

	const nextWeek = () => {
		if (nextDisabled) return;

		setPrevDisabled(false);
		const maxWeek = d3
			.extent(expenses, (d) => d3.timeWeek.floor(d.date))[1]
			.getTime();
		const newWeek = d3.timeWeek.offset(selectedWeek, 1);

		if (newWeek.getTime() === maxWeek) {
			// if new week is the max week
			// you don't want the btn to be enabled for next event
			setNextDisabled(true);
		}
		setSelectedWeek(newWeek);
	};

	const linkToCategory = ({ expense, category }) => {
		// get indices for updating categories
		const cIndex = categories
			.map((category) => category.name)
			.indexOf(category.name);
		const ceIndex = category.expenses
			.map((expense) => expense.id)
			.indexOf(expense.id);

		// get index for updating expense
		const eIndex = expenses
			.map((expense) => expense.id)
			.indexOf(expense.id);

		const updatedCategories = [...categories];
		const updatedExpenses = [...expenses];
		if (ceIndex !== -1) {
			// if expense is already linked, then unlink
			updatedCategories[cIndex].expenses.splice(ceIndex, 1);
			updatedExpenses[eIndex].categories -= 1;
		} else {
			updatedCategories[cIndex].expenses.push(expense);
			updatedExpenses[eIndex].categories += 1;
		}

		setCategories(updatedCategories);
		setExpenses(updatedExpenses);
	};

	const changeDate = ({ expense, day }) => {
		const index = expenses.map((expense) => expense.id).indexOf(expense.id);
		const updated = [...expenses];
		updated[index].date = day.date;
		setExpenses(updated);
	};

	const addCategory = (e) => {
		const ENTER_CODE = 13;

		if (e.keyCode === ENTER_CODE) {
			const newCategory = {
				name: e.target.value,
				expenses: [],
				total: 0,
			};

			setCategories([...categories, newCategory]);
		}
	};

	const deleteCategory = (category) => {
		const updatedCategories = categories.filter(
			(d) => d.name !== category.name
		);
		setCategories(updatedCategories);
	};

	const timeFormat = d3.timeFormat('%B %d, %Y');
	const isDataReady = expenses.length > 0 ? true : false;

	const appStyle = { width: width, margin: 'auto', position: 'relative' };
	const inputStyle = {
		fontSize: 14,
		textAlign: 'center',
		display: 'block',
		padding: 5,
		width: 200,
		background: 'none',
		color: colors.black,
		border: 'none',
		borderBottom: '2px solid ' + colors.black,
	};
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
		deleteCategory,
	};

	return (
		<div className="App" style={appStyle}>
			<header>
				<div className="flex">
					<FontAwesomeIcon
						icon={faArrowLeft}
						onClick={prevWeek}
						className={`btn ${prevDisabled && 'disabled'}`}
					/>
					<h1>Week of {timeFormat(selectedWeek)}</h1>
					<FontAwesomeIcon
						icon={faArrowRight}
						onClick={nextWeek}
						className={`btn ${nextDisabled && 'disabled'}`}
					/>
				</div>
				<div className="flex">
					<input
						style={inputStyle}
						type="text"
						placeholder="Add category"
						onKeyDown={addCategory}
					></input>
				</div>
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
