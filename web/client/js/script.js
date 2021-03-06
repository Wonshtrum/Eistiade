/*==============================================*/
/*            Getting HTML elements             */
/*==============================================*/
const editor = ace.edit('editor');
const langSel = document.getElementById('langSel');
const nameIn = document.getElementById('nameIn');
const test = document.getElementById('test');
const submit = document.getElementById('submit');
const fight = document.getElementById('fight');
const goFight = document.getElementById('goFight');
const history = document.getElementById('history');
const board = document.getElementById('board');
const clear = document.getElementById('clear');
const logs = document.getElementById('logs');
const progress = document.getElementById('progress');
const steps = document.getElementById('steps');
const play = document.getElementById('play');
const next = document.getElementById('next');
const previous = document.getElementById('previous');
const fighter1 = document.getElementById('fighter1');
const fighter2 = document.getElementById('fighter2');
const popupContainer = document.getElementById('popup-container')
const login = document.getElementById('login');
const signIn = document.getElementById('signIn');
const signInName = document.getElementById('signInName');
const signInPass = document.getElementById('signInPass');
const signInError = document.getElementById('signInError');
const signUp = document.getElementById('signUp');
const signUpName = document.getElementById('signUpName');
const signUpPass = document.getElementById('signUpPass');
const signUpError = document.getElementById('signUpError');
const historic = document.getElementById('historic');
const boardList = document.getElementById('boardList');
const boardGraph = document.getElementById('boardGraph');

/*==============================================*/
/*                     PRNG                     */
/*==============================================*/
const prng = str => {
	for(var i = 0, h = 1779033703 ^ str.length ; i < str.length ; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = h << 13 | h >>> 19;
	}
	return function() {
		h = Math.imul(h ^ h >>> 16, 2246822507);
		h = Math.imul(h ^ h >>> 13, 3266489909);
		return ((h ^= h >>> 16) >>> 0)/2**32;
	}
}

/*==============================================*/
/*              Set up ace editor               */
/*==============================================*/
editor.setTheme('ace/theme/dracula');
langSel.onchange = e => {
	let lang = langSel.selectedOptions[0].getAttribute('lang');
	if (lang)
		editor.session.setMode('ace/mode/'+lang);
	else
		editor.session.setMode('');
}
langSel.onchange();

/*==============================================*/
/*          Attach JS to HTML elements          */
/*==============================================*/
const minimize = node => {
	node.querySelectorAll('.min').forEach(div => {
		let title = div.querySelector('.title');
		title.querySelectorAll('.title > *').forEach(e => e.onclick = event => event.stopPropagation());
		title.onclick = e => { div.classList.toggle('flex-t'); setTimeout(e => editor.resize(), 500); };
	});
}
minimize(document);

const maskingPopup = node => node.querySelectorAll('.popup').forEach(e => e.onclick = event => event.stopPropagation());
maskingPopup(popupContainer);

/*==============================================*/
/*                  SERVER LINK                 */
/*==============================================*/
const ajax = (data, success) => {
	$.ajax({
		url: '/submit',
		data: {args: data},
		dataType: 'json',
		method: 'post',
		success: success,
		fail: e => alert(e)
	});
};

/*==============================================*/
/*           Attach JS to HTML buttons          */
/*==============================================*/
const logState = {login: null, logged: false};
const checkLogin = func => {
	if (!logState.logged) {
		signBeforeCallback = func;
		loadPopup('#loginPopup');
		return true;
	}
	return false;
};
ajax([7], e => {
	if (e.exitCode === 0) login.deco(e.field0);
	else showPopup();
});

/*==============================================*/
/*           Attach JS to HTML buttons          */
/*==============================================*/
test.onclick = e => {
	if (checkLogin(test.onclick)) return;
	let code = editor.getValue();
	let lang = langSel.selectedOptions[0].getAttribute('name');
	let name = nameIn.value;
	let data = [0, name, lang, code];
	let bar = loading();
	ajax(data, e => log(e, bar));
};
submit.onclick = e => {
	if (checkLogin(submit.onclick)) return;
	let name = nameIn.value;
	let data = [1, name];
	let bar = loading();
	ajax(data, e => log(e, bar));
};
fight.onclick = e => {
	ajax([6], e => {
		if (e.exitCode === 0) {
			let ai1 = '';
			let ai2 = '';
			let i1 = 0;
			let i2 = 0;
			if (fighter1.selectedIndex >= 0) ai1 = fighter1.selectedOptions[0].value;
			if (fighter2.selectedIndex >= 0) ai2 = fighter2.selectedOptions[0].value;
			fighter1.innerHTML = '';
			fighter2.innerHTML = '';
			e.data.forEach((opt, i) => {
				let ai = `${opt.name} (${opt.author}, ${opt.lang})`;
				if (ai == ai1) i1 = i;
				if (ai == ai2) i2 = i;
				fighter1.options.add(createNode('option', [ ai ]));
				fighter2.options.add(createNode('option', [ ai ]));
			});
			fighter1.selectedIndex = i1;
			fighter2.selectedIndex = i2;
		}
	});
	loadPopup('#fightPopup');
};
history.onclick = e => {
	if (checkLogin(history.onclick)) return;
	let data = [8];
	ajax(data, e => {
		if (e.exitCode === 0) {
			historic.innerHTML = '';
			if (e.data.length === 0) {
				historic.appendChild(createNode('div', [ 'vide.' ], {class: 'margin-1'}));
			}
			let options = {class: 'margin-1 padding-1 in-light hov-opac-2'};
			let lastContent = "";
			e.data.forEach(commit => {
				if (lastContent !== commit.arg2) {
					lastContent = commit.arg2;
					let div = createNode('div', [ commit.arg0 ], options);
					div.onclick = e => editor.session.setValue(commit.arg2);
					historic.appendChild(div);
				}
			});
		}
		loadPopup('#historyPopup');
	});
};
rank = result => {
	return Object.keys(result).sort((a, b) => result[a][0] < result[b][0] || (result[a][0] === result[b][0] && result[a][1] > result[b][1]))
};
board.onclick = e => {
	let data = [9];
	ajax(data, e => {
		if (e.exitCode === 0) {
			boardGraph.innerHTML = "";
			boardList.innerHTML = "";
			if (e.data.length === 0) {
				boardList.appendChild(createNode('div', [ 'Vide.' ], {class:'padding-1 margin-1'}));
				loadPopup('#boardPopup');
				return;
			}
			let last = e.data[e.data.length-1].result;
			let ai;
			let rankedList = {};
			for (let author of rank(last)) {
				ai = last[author];
				let node = createNode('div', [ `${author} (${ai[1]}) : ${ai[0]}` ], {class: 'in-white col-dark margin-1 padding-1 flex-0 flex-a big'});
				boardList.appendChild(node);
				rankedList[author] = node;
			}
			let competitors = Object.keys(last);
			let graph = {};
			for (let competitor of competitors) {
				graph[competitor] = Array(e.data.length).fill(1);
			}
			let maxList = Object.keys(last).length;
			console.log(e.data);
			for (let i = 0 ; i<e.data.length ; i++) {
				let ranked = rank(e.data[i].result);
				let delta = maxList-ranked.length;
				let pos = 0;
				let ares = -1;
				let res;
				for (let competitor = 0 ; competitor < ranked.length ; competitor++) {
					console.log(e.data[i].result, ranked[competitor], graph);
					res = e.data[i].result[ranked[competitor]][0];
					pos = res === ares ? pos+0.1 : competitor+0.5;
					graph[ranked[competitor]][i] = pos+delta;
					ares = res;
				}
				console.log(graph);
				for (let competitor of ranked) {
					graph[competitor][i] /= maxList;
				}
			}
			let X = e.data.length;
			for (let [competitor, line] of Object.entries(graph)) {
				let coords = 'M';
				let first = true;
				for (let x = 0 ; x < line.length ; x++) {
					if (line[x] === 1) continue;
					coords += ' '+(x+.5)/X+','+line[x];
					if (first) {
						first = false;
						coords += ' L';
					}
				}
				let rng = prng(competitor);
				let g = Math.floor(100+rng()*156);
				let b = Math.floor(150+rng()*106);
				let color = 'rgb(100,'+g+','+b+')';
				if (competitor === '$ROOT') color = 'var(--lightFlashColor)';
				boardGraph.appendChild(createNode('path', [], {d:coords, fill:'none', stroke:color, 'data-author':competitor}));
				for (let x = 0 ; x < line.length ; x++) {
					if (line[x] !== 1) boardGraph.appendChild(createNode('circle', [], {cx:(x+.5)/X, cy:line[x], r:0.01, stroke:color, fill:'#fff'}));
				}
			}
			boardGraph.innerHTML += "";
			let curves = boardGraph.querySelectorAll('path');
			for (let x = 0 ; x < curves.length ; x++) {
				let curve = curves[x];
				curve.author = rankedList[curve.dataset.author];
				curve.author.style.backgroundColor = curve.getAttribute('stroke');
				curve.onmouseenter = e => curve.author.classList.add('flash');
				curve.onmouseleave = e => curve.author.classList.remove('flash');
			}
		}
		loadPopup('#boardPopup');
	});
};
goFight.onclick = e => {
	hidePopup();
	let ai1 = fighter1.value.split(' ')[0];
	let ai2 = fighter2.value.split(' ')[0];
	let data = [2, ai1, ai2];
	let bar = loading();
	ajax(data, e => log(e, bar));
};
clear.onclick = e => {
	e.stopPropagation();
	logs.innerHTML = '';
};
play.onclick = e => {
	if (!logs.data || logs.stop()) return;
	let lineId = logs.lineId+1;
	if (lineId === logs.data.history.length) lineId = 0;
	logs.play = true;
	play.update();
	logs.flash(lineId);
};
next.onclick = e => {
	if (!logs.data) return;
	logs.stop();
	let lineId = logs.lineId+1;
	if (lineId === logs.data.history.length) lineId = 0;
	logs.flash(lineId);
};
previous.onclick = e => {
	if (!logs.data) return;
	logs.stop();
	let lineId = logs.lineId-1;
	if (lineId === -1) lineId = logs.data.history.length-1;
	logs.flash(lineId);
};
login.onclick = e => {
	loadPopup('#loginPopup');
};

let signBeforeCallback = false;
login.deco = name => {
	login.innerHTML = name;
	logState.logged = true;
	logState.login = name;
	signUpName.value = signInName.value = '';
	if (signBeforeCallback) signBeforeCallback();
	signBeforeCallback = false;
	let action = login.onclick;
	login.onclick = e => ajax([5], a => {
		login.innerHTML = 'connexion';
		login.onclick = action;
		logState.logged = false;
	});
};
signUp.onclick = e => {
	let name = signUpName.value;
	let pass = signUpPass.value;
	ajax([3, name, pass], e => {
		if (e.exitCode === 0) {
			hidePopup();
			login.deco(signUpName.value);
		} else {
			signUpError.innerHTML = e.field0;
			showPopup();
		}
		signUpPass.value = signInPass.value = '';
	});
};
signIn.onclick = e => {
	let name = signInName.value;
	let pass = signInPass.value;
	ajax([4, name, pass], e => {
		if (e.exitCode === 0) {
			hidePopup();
			login.deco(signInName.value);
		} else {
			signInError.innerHTML = e.field0;
			showPopup();
		}
		signUpPass.value = signInPass.value = '';
	});
};

/*==============================================*/
/*             HTML creation tools              */
/*==============================================*/
const createText = text => document.createTextNode(text);
const createNode = (type, elements, options) => {
	elements = elements || [];
	options = options || {};
	let node = document.createElement(type);
	for (let [attr, value] of Object.entries(options))
		node.setAttribute(attr, value);
	for (let element of elements) {
		if (typeof element === 'string') {
			node.appendChild(createText(element));
		} else {
			node.appendChild(element);
		}
	}
	return node;
};

/*==============================================*/
/*                 Log container                */
/*==============================================*/
/* Attributes */
logs.logId = 0;
logs.fightId = 'log-';
logs.lineId = -1;
logs.play = true;
logs.wait = 500;
logs.next;
play.update = () => {
	if (logs.play) play.classList.add('pause')
	else play.classList.remove('pause')
};
/* Methods */
logs.scroll = node => {
	node = node || logs.lastChild;
	logs.scrollTop = node.offsetTop - logs.offsetTop;
};
logs.stop = () => {
	if (logs.play) {
		clearTimeout(logs.next);
		logs.play = false;
		play.update();
		return true;
	}
	return false;
};
logs.unFlash = () => {
	let line = logs.querySelector('#'+logs.fightId+logs.lineId);
	if (line) {
		line.classList.remove('in-flash');
		line.classList.add('flex-t');
		line.querySelector('.title').classList.remove('flash');
	}
};
logs.flash = (id, fightId, scroll) => {
	scroll = scroll || (scroll === undefined);
	clearTimeout(logs.next);
	logs.unFlash();
	if (fightId) logs.fightId = fightId;
	fightId = logs.fightId;
	logs.lineId = id;
	if (id < logs.data.history.length) {
		progress.style.width = 100*(id+1)/logs.data.history.length+'%';
		logs.game.play(id);
		let line = logs.querySelector('#'+logs.fightId+id);
		if (line) {
			line.classList.add('in-flash');
			line.classList.remove('flex-t');
			line.querySelector('.title').classList.add('flash');
			if (scroll) logs.scroll(line);
		}
		for (let [i, step] of Object.entries(steps.children)) {
			if (i == id) step.classList.add('out-lightFlash');
			else step.classList.remove('out-lightFlash');
		}
		if (id < logs.data.history.length-1 && logs.play) logs.next = setTimeout(e => logs.flash(id+1), logs.wait);
		else logs.stop();
	}
};
logs.setFight = (id, p) => {
	clearTimeout(logs.next);
	logs.play = p || (p === undefined);
	play.update();
	logs.data = logs.querySelector('#'+id).data;
	logs.game = game(logs.data.field2);
	steps.innerHTML = '';
	steps.append(...Array.from({length: logs.data.history.length}, (_, i) => {
		let node = createNode('div', [], {class: 'out-dark padding-1'})
		node.onclick = e => logs.flash(i);
		return node;
	}));
	if (logs.play) logs.flash(0, id);
};

/*==============================================*/
/*                Logging system                */
/*==============================================*/
const addLog = (msg, options) => {
	logs.logId++;
	options = options || {class: ''};
	options.class += ' log wrapped';
	let node = createNode('div', [ createNode('pre', msg) ], options);
	logs.appendChild(node);
	logs.scroll();
	node.classList.remove('wrapped');
	minimize(node);
	return node;
};
const loading = () => {
	let bar = createNode('div', [ createNode('div', [], {class: 'bar'}), createNode('div', [], {class: 'bar'}), createNode('div', [], {class: 'bar'}) ], {class: 'loading'});
	logs.appendChild(bar);
	logs.scroll();
	bar.end = false;
	bar.progress = -1;
	bar.update = () => {
		bar.progress++;
		if (bar.progress == 4) { bar.progress = 0; }
		bar.setAttribute('progress', bar.progress);
		if (!bar.end) { setTimeout(bar.update, 200); }
	};
	bar.stop = () => {
		bar.end = true;
		bar.remove();
	}
	bar.update();
	return bar;
};
const log = (msg, bar) => {
	if (bar) bar.stop();
	if (msg.exitCode === 2) {
		addLog([ msg.field0 ], {class: 'debug'});
		return;
	}
	if (msg.cmd === 0) {
		if (msg.exitCode === 0) {
			msg.cmd = 2;
			log(msg);
		} else {
			addLog([ createNode('b', [ msg.args[0] ]), ' n\'a pas pu être compilé. Le serveur indique :\n', msg.field0 ]);
		}
	} else if (msg.cmd === 1) {
		if (msg.exitCode === 0) {
			addLog([ createNode('b', [ msg.args[0] ]), ' a été soumit sans erreur.\nVous pouvez maintenant faire combattre ', createNode('b', [ msg.args[0] ]), ' avec d\'autres IA.' ]);
		} else {
			addLog([ createNode('b', [ msg.args[0] ]), ' n\'a pas pu être soumit. Le serveur indique :\n', msg.field0 ]);
		}
	} else if (msg.cmd === 2) {
		if (msg.exitCode === 0) {
			let history = [];
			for (let i in msg.field0) {
				history.push(msg.field0[i]);
				if (msg.field1[i] !== undefined) history.push(msg.field1[i]);
			}

			let fightId = 'log-'+logs.logId+'-';
			let fightLog = createNode('div', history.map((e, i) => {
				let endLine = e.indexOf('\n');
				if (endLine === -1) endLine = e.length;
				let content = [ createNode('div', [ e.substring(0, endLine) ], {class: 'title'}) ];
				let min = '';
				if (e.length-endLine-1 > 0) {
					content.push(createNode('div', [ e.substring(endLine+1) ], {class: 'padding-1 in-darken auto-scroll'}));
					min = ' min';
				}
				let line = createNode('div', content, {class: 'cont flex-a line flex-t'+min, id: fightId+i});
				line.fightId = fightId;
				line.lineId = i;
				line.onclick = e => {
					if (fightId != logs.fightId) logs.setFight(fightId, false);
					logs.flash(i, fightId, false);
				}
				return line;
			}), {class: 'flexIn down history', id: fightId});
			msg.history = history;
			fightLog.data = msg;

			let button = createNode('button', [ 'Combat' ], {class: 'flash flex-a margin-1 padding-1'});
			button.onclick = e => logs.setFight(fightId);
			addLog([button, 'entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ', resultat :\n', fightLog ], {class: 'fight'});
			button.onclick();
		} else {
			addLog([ 'Le combat entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ' ne s\'est pas déroulé correctement. Le serveur indique :\n', msg.field0]);
		}
	}
};

/*==============================================*/
/*                 Popup system                 */
/*==============================================*/
const showPopup = () => {
	popupContainer.classList.remove('wrapped');
};
const hidePopup = () => {
	popupContainer.classList.add('wrapped');
};
const loadPopup = popup => {
	popupContainer.querySelectorAll('.popup').forEach(e => e.classList.add('invisible'));
	popupContainer.querySelector(popup).classList.remove('invisible');
	showPopup();
};
popupContainer.onclick = hidePopup;
