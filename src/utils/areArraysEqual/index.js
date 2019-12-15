const areArraysEqual = (one, two) => {
	if (one.length === two.length) {
		for (let j = 0; j < one.length; j += 1) {
			if (two[j] !== one[j]) {
				return false;
			}
		}
		return true;
	}
	return false;
};

export default areArraysEqual;
