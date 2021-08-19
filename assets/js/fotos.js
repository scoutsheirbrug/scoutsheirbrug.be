const detail = document.querySelector('.foto-detail')

document.querySelectorAll('.foto').forEach(foto => {
	foto.addEventListener('click', () => {
		document.documentElement.classList.add('noscroll')
		detail.classList.add('active')
		const src = foto.querySelector('img').getAttribute('src')
		detail.innerHTML = `<img src="${src.replace('/thumbs', '')}">`
	})
})

detail.addEventListener('click', () => {
	document.documentElement.classList.remove('noscroll')
	detail.classList.remove('active')
})
