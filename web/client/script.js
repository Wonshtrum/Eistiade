const editor = ace.edit('editor');
const langSel = document.getElementById('langSel');
const nameIn = document.getElementById('nameIn');
const submit = document.getElementById('submit');

editor.setTheme('ace/theme/dracula');
langSel.onchange = e => {
	let lang = langSel.selectedOptions[0].getAttribute('lang');
	if (lang)
		editor.session.setMode('ace/mode/'+lang);
	else
		editor.session.setMode('');
}
langSel.onchange();

document.querySelectorAll('.min').forEach(div => div.querySelector('.title').onclick = e => { div.classList.toggle('flex-t'); setTimeout(e => editor.resize(), 500) })

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
		success: e => console.log(e)
	});
}
