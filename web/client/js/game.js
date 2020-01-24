const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rightIcon = document.getElementById('rightIcon');
const leftIcon = document.getElementById('leftIcon');

canvas.width = 1000;
canvas.height = 500;
const colors = ['#000', '#f00', '#00f'];
const game = function(data) {
	/*iconLeft.innerHTML = data.ai1;
	iconRight.innerHTML = data.ai2;*/
	let self = {
		last: 0,
		w: data.w,
		h: data.h,
		moves: data.moves,
		end: data.moves.length-1,
		win: data.win
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
		self.matrix = Array.from({length:self.h}, _=>Array.from({length:self.w}, _=>0));
		for (let i=0 ; i<turn+1 ; i++) {
			self.move(self.moves[i], 1+i%2);
		}
		console.log(self.matrix.map(line => line.map(e => '.XO'[e]).join(' ')).join('\n'))
		console.log('--------------')
		self.draw(turn == self.end);
	}
	self.draw = win => {
		let d = 10;
		let [w, h] = [canvas.width, canvas.height];
		let c = Math.floor(Math.min(w/self.w, h/self.h));
		let [dx, dy] = [Math.floor(d+(w-c*self.w)/2), Math.floor(d+(h-c*self.h)/2)]
		ctx.clearRect(0, 0, w, h);
		for (let i=0 ; i<self.w ; i++) {
			for (let j=0 ; j<self.h ; j++) {
				ctx.fillStyle = colors[self.matrix[j][i]];
				ctx.fillRect(dx+i*c, dy+j*c, c-d*2, c-d*2);
			}
		}
		if (win && self.win.state) {
			let [ay, ax, by, bx] = self.win.state.map(e => Math.floor(c*(e+.5)-d));
			ctx.strokeStyle = '#fffc';
			ctx.lineWidth = d*2;
			ctx.beginPath();
			ctx.moveTo(dx+ax, dy+ay)
			ctx.lineTo(dx+bx, dy+by);
			ctx.stroke();
		}
	}
	return self;
}
