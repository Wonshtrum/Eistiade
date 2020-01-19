const editor = ace.edit('editor');
const langSel = document.getElementById('langSel');
const nameIn = document.getElementById('nameIn');
const submit = document.getElementById('submit');
const fight = document.getElementById('fight');
const history = document.getElementById('history');
const board = document.getElementById('board');
const clear = document.getElementById('clear');
const logs = document.getElementById('logs');

editor.setTheme('ace/theme/dracula');
langSel.onchange = e => {
	let lang = langSel.selectedOptions[0].getAttribute('lang');
	if (lang)
		editor.session.setMode('ace/mode/'+lang);
	else
		editor.session.setMode('');
}
langSel.onchange();

document.querySelectorAll('.min').forEach(div => {
	let title = div.querySelector('.title');
	title.querySelectorAll('.title > *').forEach(e => e.onclick = event => event.stopPropagation());
	title.onclick = e => { div.classList.toggle('flex-t'); setTimeout(e => editor.resize(), 500) };
});

submit.onclick = e => {
	let code = editor.getValue();
	let lang = langSel.selectedOptions[0].getAttribute('name');
	let name = nameIn.value;
	let data = { args: [0, name, lang, code] };
	console.log(data);
	$.ajax({
		url: '/submit',
		data: data,
		dataType: 'json',
		method: 'post',
		success: e => log(e)
	});
}
fight.onclick = e => {
	let name = nameIn.value;
	let data = { args: [2, name, name] };
	$.ajax({
		url: '/submit',
		data: data,
		dataType: 'json',
		method: 'post',
		success: e => log(e)
	});
}

clear.onclick = e => {
	e.stopPropagation();
	logs.innerHTML = '';
};

createText = text => document.createTextNode(text);
createNode = (type, elements, options) => {
	elements = elements || [];
	options = options || {};
	let node = document.createElement(type);
	for (let [attr, value] of Object.entries(options))
		node.setAttribute(attr, value);
	for (let element of elements) {
		if (typeof element === 'string')
			node.appendChild(createText(element));
		else
			node.appendChild(element);
	}
	return node;
}

addLog = msg => {
	logs.appendChild(createNode('div',
		[ createNode('pre', msg) ],
		{class: 'log'}));
}
log = msg => {
	if (msg.cmd === 0) {
		if (msg.exitCode === 0) {
			addLog([ createNode('b', [ msg.field0 ]), ' a compilé sans erreurs !' ]);
		} else {
			addLog([ createNode('b', [ msg.field0 ]), ' n\'a pas pu être compilé... Le serveur indique :\n', msg.field1 ]);
		}
	} else if (msg.cmd === 2) {
		if (msg.exitCode === 0) {
			let ai1 = msg.field2.ai1;
			let ai2 = msg.field2.ai2;
			console.log(msg)
			addLog([ 'Combat entre ', createNode('b', [ ai1 ] ), ' et ', createNode('b', [ ai2 ]), ', resultat :\n'+msg.field0.join('') ]);
		} else {
			addLog(['Le combat ne s\' pas déroulé correctement... Le serveur indique :\n', msg.field0]);
		}
	}
}
