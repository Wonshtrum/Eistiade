const canvas = document.getElementById('canvas');
const rightIcon = document.getElementById('rightIcon');
const leftIcon = document.getElementById('leftIcon');

const game = function(data) {
	/*iconLeft.innerHTML = data.ai1;
	iconRight.innerHTML = data.ai2;*/
	let self = {
		last: 0
	};
	self.move = (col, id) => {
		let row = -1;
		while (row+1 < self.matrix.length && self.matrix[row+1][col] === 0) {
			row++;
		}
		if (row !== -1) {
			self.matrix[row][col] = id;
		}
	}
	self.play = turn => {
		self.matrix = Array.from({length:data.h}, _=>Array.from({length:data.w}, _=>0));
		for (let i=0 ; i<turn+1 ; i++) {
			self.move(data.moves[i], 1+i%2);
		}
		for (let line of self.matrix) {
			console.log(line.join(' '));
			console.log('');
		}
		console.log('--------------')
	}
	return self;
}
