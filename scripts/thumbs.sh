for i in assets/fotos/*; do mkdir -p "${i/fotos/thumbs\/fotos}"; done

for i in assets/fotos/*/*.jpg; do ffmpeg -y -loglevel error -i "$i" -vf "crop=w='min(iw\,ih)':h='min(iw\,ih)',scale=256:256,setsar=1" "${i/fotos/thumbs\/fotos}"; echo "Created thumb for $i"; done
