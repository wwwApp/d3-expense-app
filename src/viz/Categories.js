import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

function Categories({ categories }) {
	const containerRef = useRef(null);

	useEffect(() => {}, []);

	return <g ref={containerRef}></g>;
}

export default Categories;
