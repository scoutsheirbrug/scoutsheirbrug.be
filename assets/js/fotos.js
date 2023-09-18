const searchParams = new URLSearchParams(location.search)
let albumId = searchParams.get('album')
const photoId = searchParams.get('foto')

if (albumId || photoId) {
	document.querySelector('.foto-album').classList.add('visible')
} else {
	document.querySelector('.foto-album-list').classList.add('visible')
}

const photoDetail = document.querySelector('.foto-detail')

const FOTO_API = 'https://fotos.mirostuyven.com/api'

fetch(`${FOTO_API}/library?library=scoutsheirbrug`)
	.then(r => r.json())
	.then(library => {
		for (const album of library.albums) {
			const albumCard = document.createElement('a')
			albumCard.href = `?album=${album.id}`
			const albumImg = document.createElement('img')
			albumImg.classList.add('thumb')
			if (album.cover) {
				albumImg.src = `${FOTO_API}/photo/${album.cover}?size=thumbnail`
			}
			albumCard.append(albumImg)
			const albumTitle = document.createElement('h2')
			albumTitle.textContent = album.name
			albumCard.append(albumTitle)
			const albumSubtitle = document.createElement('span')
			albumSubtitle.textContent = `${album.photos.length} Foto${album.photos.length === 1 ? '' : '\'s'}`
			albumCard.append(albumSubtitle)
			document.querySelector('.foto-album-list').append(albumCard)
		}

		if (!albumId && photoId) {
			albumId = library.albums.find(a => a.photos.some(p => p.id === photoId) ? a.id : null)
		}
		if (albumId) {
			const album = library.albums.find(a => a.id === albumId)
			const albumInfo = document.createElement('div')
			albumInfo.classList.add('container', 'foto-album-info')
			const albumTitle = document.createElement('h1')
			albumTitle.textContent = album.name
			albumInfo.append(albumTitle)
			const albumSubtitle = document.createElement('span')
			albumSubtitle.textContent = `${album.photos.length} Foto${album.photos.length === 1 ? '' : '\'s'}`
			albumInfo.append(albumSubtitle)
			document.querySelector('.foto-album').append(albumInfo)

			const photoList = document.createElement('div')
			photoList.classList.add('foto-list')
			for (const photo of album.photos) {
				const photoCard = document.createElement('a')
				photoCard.href = `?album=${album.id}&foto=${photo.id}`
				photoCard.classList.add('foto')
				const photoImg = document.createElement('img')
				photoImg.src = `${FOTO_API}/photo/${photo.id}?size=thumbnail`
				photoImg.loading = 'lazy'
				photoCard.append(photoImg)
				photoList.append(photoCard)
				photoCard.addEventListener('click', e => {
					e.preventDefault()
					document.documentElement.classList.add('noscroll')
					const detailImg = document.createElement('img')
					detailImg.src = `${FOTO_API}/photo/${photo.id}?size=preview`
					const fullImg = new Image()
					fullImg.onload = () => {
						detailImg.src = fullImg.src
					}
					fullImg.src = `${FOTO_API}/photo/${photo.id}?size=original`
					photoDetail.classList.add('active')
					photoDetail.innerHTML = ''
					photoDetail.append(detailImg)
				})
			}
			document.querySelector('.foto-album').append(photoList)

			photoDetail.addEventListener('click', () => {
				document.documentElement.classList.remove('noscroll')
				photoDetail.classList.remove('active')
			})
		}
	})
