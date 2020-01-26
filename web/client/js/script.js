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
const fighter1 = document.getElementById('fighter1');
const fighter2 = document.getElementById('fighter2');
const popupContainer = document.getElementById('popup-container')
const login = document.getElementById('login');

editor.setTheme('ace/theme/dracula');
langSel.onchange = e => {
	let lang = langSel.selectedOptions[0].getAttribute('lang');
	if (lang)
		editor.session.setMode('ace/mode/'+lang);
	else
		editor.session.setMode('');
}
langSel.onchange();

const minimize = node => {
	node.querySelectorAll('.min').forEach(div => {
		let title = div.querySelector('.title');
		title.querySelectorAll('.title > *').forEach(e => e.onclick = event => event.stopPropagation());
		title.onclick = e => { div.classList.toggle('flex-t'); setTimeout(e => editor.resize(), 500); };
	});
}
minimize(document);

test.onclick = e => {
	let code = editor.getValue();
	let lang = langSel.selectedOptions[0].getAttribute('name');
	let name = nameIn.value;
	let data = { args: [0, name, lang, code] };
	let bar = loading();
	$.ajax({
		url: '/submit',
		data: data,
		dataType: 'json',
		method: 'post',
		success: e => log(e, bar)
	});
}
submit.onclick = e => {
	let name = nameIn.value;
	let data = { args: [1, name] };
	let bar = loading();
	$.ajax({
		url: '/submit',
		data: data,
		dataType: 'json',
		method: 'post',
		success: e => log(e, bar)
	});
}
fight.onclick = e => {
	loadPopup('#fightPopup');
	showPopup();
}
goFight.onclick = e => {
	hidePopup();
	let ai1 = fighter1.value;
	let ai2 = fighter2.value;
	let data = { args: [2, ai1, ai2] };
	let bar = loading();
	$.ajax({
		url: '/submit',
		data: data,
		dataType: 'json',
		method: 'post',
		success: e => log(e, bar)
	});
}

clear.onclick = e => {
	e.stopPropagation();
	logs.innerHTML = '';
};

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
}

logs.logId = 0;
logs.fightId = 'log-';
logs.lineId = -1;
logs.play = true;
logs.wait = 500;
logs.next = 0;

logs.scroll = (node) => {
	node = node || logs.lastChild;
	logs.scrollTop = node.offsetTop - logs.offsetTop;
}
logs.unFlash = () => {
	let line = logs.querySelector('#'+logs.fightId+logs.lineId);
	if (line) {
		line.classList.remove('in-flash');
		line.querySelector('.title').classList.remove('flash');
	}
}
logs.flash = (id, fightId) => {
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
			logs.scroll(line);
			line.classList.add('in-flash');
			line.querySelector('.title').classList.add('flash');
		}
		for (let [i, step] of Object.entries(steps.children)) {
			if (i == id) step.classList.add('out-lightFlash');
			else step.classList.remove('out-lightFlash');
		}
		if (id < logs.data.history.length-1 && logs.play) logs.next = setTimeout(e => logs.flash(id+1), logs.wait);
		else logs.play = false;
	}
}
play.onclick = e => {
	if (logs.play) return;
	let lineId = logs.lineId+1;
	if (lineId === logs.data.history.length) lineId = 0;
	logs.play = true;
	logs.flash(lineId);
}
logs.setFight = id => {
	clearTimeout(logs.next);
	logs.play = true;
	logs.data = logs.querySelector('#'+id).data;
	logs.game = game(logs.data.field2);
	steps.innerHTML = '';
	steps.append(...Array.from({length: logs.data.history.length}, (_, i) => {
		let node = createNode('div', [], {class: 'out-dark padding-1'})
		node.onclick = e => logs.flash(i);
		return node;
	}));
	logs.flash(0, id);
}

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
}
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
}
const log = (msg, bar) => {
	if (bar) bar.stop();
	if (msg.exitCode === 2) {
		addLog([ msg.field0 ], {class: 'debug'});
		return;
	}
	if (msg.cmd === 0) {
		if (msg.exitCode === 0) {
			addLog([ createNode('b', [ msg.args[0] ]), ' a compilé sans erreurs !' ]);
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
				let content = [ createNode('div', [ e.substring(0, endLine) ], {class: 'title'}) ];
				let min = '';
				if (e.length-endLine-1 > 0) {
					content.push(createNode('div', [ e.substring(endLine+1) ], {class: 'padding-1 in-darken'}));
					min = ' min';
				}
				return createNode('div', content, {class: 'cont flex-a line'+min, id: fightId+i});
			}), {class: 'flexIn down history', id:fightId});
			msg.history = history;
			fightLog.data = msg;

			let button = createNode('button', [ 'Combat' ], {class: 'flash flex-a margin-1 padding-1'});
			button.onclick = e => logs.setFight(fightId);
			addLog([button, 'entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ', resultat :\n', fightLog ]);
			button.onclick();
		} else {
			addLog([ 'Le combat entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ' ne s\'est pas déroulé correctement. Le serveur indique :\n', msg.field0]);
		}
	}
}

const maskingPopup = node => node.querySelectorAll('.popup').forEach(e => e.onclick = event => event.stopPropagation());
maskingPopup(popupContainer);

const loadPopup = popup => {
	popupContainer.querySelectorAll('.popup').forEach(e => e.classList.add('invisible'));
	popupContainer.querySelector(popup).classList.remove('invisible');
}
const showPopup = () => {
	popupContainer.classList.remove('wrapped');
}
const hidePopup = () => {
	popupContainer.classList.add('wrapped');
}
popupContainer.onclick = hidePopup;
login.onclick = () => loadPopup('#login');
