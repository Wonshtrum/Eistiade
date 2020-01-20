const editor = ace.edit('editor');
const langSel = document.getElementById('langSel');
const nameIn = document.getElementById('nameIn');
const test = document.getElementById('test');
const submit = document.getElementById('submit');
const fight = document.getElementById('fight');
const history = document.getElementById('history');
const board = document.getElementById('board');
const clear = document.getElementById('clear');
const logs = document.getElementById('logs');
logs.id = 0;

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
		title.onclick = e => { div.classList.toggle('flex-t'); };
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
	let name = nameIn.value;
	let data = { args: [2, name, name] };
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

logs.scroll = (node) => {
	node = node || logs.lastChild;
	logs.scrollTop = node.offsetTop - logs.offsetTop;
}
const addLog = msg => {
	logs.id++;
	let node = createNode('div', [ createNode('pre', msg) ], {class: 'log wrapped'});
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
	if (bar) { bar.stop(); }
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
			let fightLog = createNode('div', msg.field0.map((e, i) => {
				let endLine = e.indexOf('\n');
				let content = [ createNode('div', [ e.substring(0, endLine) ], {class: 'title'}) ];
				let min = '';
				if (e.length-endLine-1 > 0) {
					content.push(createNode('div', [ e.substring(endLine+1) ], {class: 'margin-1'}));
					min = ' min';
				}
				return createNode('div', content, {class: 'cont flex-a'+min, id: 'log-'+logs.id+'-'+i});
			}), {class: 'flexIn down history'})
			addLog([ 'Combat entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ', resultat :\n', fightLog ]);
		} else {
			addLog([ 'Le combat entre ', createNode('b', [ msg.args[0] ]), ' et ', createNode('b', [ msg.args[1] ]), ' ne s\'est pas déroulé correctement. Le serveur indique :\n', msg.field0]);
		}
	}
}
