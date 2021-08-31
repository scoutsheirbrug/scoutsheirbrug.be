#!/usr/bin/env bash

for f in assets/fotos/*/; do
    mkdir -p "${f/fotos/thumbs\/fotos}"
    magick mogrify -path "${f/fotos/thumbs\/fotos}" \
        -resize 256x256^ \
        -gravity Center \
        -extent 256x256 \
        "$f*.jpg"
done
