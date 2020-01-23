let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
const rightIcon = document.getElementById('rightIcon');
const leftIcon = document.getElementById('leftIcon');

canvas.width = 100;
canvas.height = 50;
const game = function(data) {
	/*iconLeft.innerHTML = data.ai1;
	iconRight.innerHTML = data.ai2;*/
	let self = {
		last: 0,
		w: data.w,
		h: data.h,
		moves: data.moves,
		end: data.moves.length-1,
		win: data.win.state
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
		let [w, h] = [canvas.width, canvas.height];
		let c = Math.floor(Math.min(w/self.w, h/self.h));
		let [dx, dy] = [Math.floor(1+(w-c*self.w)/2), Math.floor(1+(h-c*self.h)/2)]
		ctx.clearRect(0, 0, w, h);
		for (let i=0 ; i<self.w ; i++) {
			for (let j=0 ; j<self.h ; j++) {
				ctx.fillStyle = ['#000','#f00','#00f'][self.matrix[j][i]];
				ctx.fillRect(dx+i*c, dy+j*c, c-2, c-2);
			}
		}
		if (win && self.win) {
			let [ay, ax, by, bx] = self.win.map(e => Math.floor(c*(e+.5)));
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(dx+ax-1, dy+ay-1)
			ctx.lineTo(dx+bx-1, dy+by-1);
			ctx.stroke();
			console.log(ax, ay, bx, by, c);
		}
	}
	return self;
}
