# Mentions des sources tierces

## free-exercise-db

| Champ | Valeur |
| --- | --- |
| Projet | free-exercise-db |
| URL | https://github.com/yuhonas/free-exercise-db |
| Commit utilisé | `b0eed061e1c832b3ed815fbaa4b45b3cdc14df49` |
| Licence | Unlicense (domaine public) |
| Texte de licence | https://github.com/yuhonas/free-exercise-db/blob/b0eed061e1c832b3ed815fbaa4b45b3cdc14df49/LICENSE.md |
| Copie locale | `vendor/free-exercise-db/LICENSE.md` |

### Données réutilisées

- Les **métadonnées biomécaniques** de 66 exercices :
  muscles principaux et secondaires, niveau, catégorie d'origine, matériel.
- Les **consignes originales en anglais**, conservées telles quelles dans le champ
  `originalInstructions` à des fins de traçabilité.
- Les **noms anglais**, conservés dans `nameEn`.
- Les **photographies de position**, converties en WebP et servies localement depuis
  `public/exercises/{slug}/`. Aucun lien direct vers GitHub n'est utilisé en production.
  L'URL d'origine de chaque image est conservée dans `media[].sourceUrl`, épinglée au
  commit ci-dessus.

Les deux images fournies par la source sont enregistrées comme `start_position` et
`end_position`. Elles ne sont **jamais** présentées comme une animation.

### Texte de la licence

```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>
```

## Contenus propres à BodyTrain

Les 84 exercices d'origine BodyTrain, l'ensemble des textes français et
les animations SVG filaires sont produits pour ce projet et distribués sous CC0-1.0. Aucune
ressource tierce n'entre dans leur composition.
