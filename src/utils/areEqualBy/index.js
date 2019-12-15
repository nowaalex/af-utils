const areEqualBy = (arr, obj1, obj2) => {
	for (let key of arr) {
		if (obj1[key] !== obj2[key]) {
			return false;
		}
	}
	return true;
};

export default areEqualBy;
