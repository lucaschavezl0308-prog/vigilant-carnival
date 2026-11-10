# Preparación para el examen de la ANDE

Material para preparar el examen de conocimientos (selección múltiple) con NotebookLM.
Examen: sábado 14 de noviembre. Cubre lo que aparece en las fotos del temario: Matemática (1.1, 1.2, 1.3) y Castellano (3.1 a 3.4).

## Archivos

| Archivo | Contenido | Cuándo subirlo a NotebookLM |
|---|---|---|
| `ANDE-1-Guia-Matematica.pdf` | 13 temas con reglas, ejemplos resueltos, errores típicos y hoja de fórmulas | Desde el primer día |
| `ANDE-2-Guia-Castellano.pdf` | 11 temas con reglas, ejemplos correctos e incorrectos y tablas | Desde el primer día |
| `ANDE-3-Examen-modelo.pdf` | 100 preguntas (60 de Matemática y 40 de Castellano) con clave y explicación | El viernes, después de rendirlo |

Los archivos `.md` tienen el mismo contenido en texto plano.

## Cómo armar los exámenes de prueba en NotebookLM

1. Entrá a notebooklm.google.com (o a la app) y creá un cuaderno llamado "Examen ANDE".
2. Subí como fuentes las dos guías. El examen modelo todavía no: si lo subís ahora, NotebookLM te va a mostrar esas preguntas antes de que lo rindas.
3. Para practicar un solo tema, dejá tildada únicamente la guía que corresponde.
4. Usá el chat con los prompts de abajo, o el botón "Cuestionario" del panel Studio (ahí podés elegir cantidad de preguntas y dificultad, y escribir de qué tema lo querés).
5. Si una respuesta de NotebookLM no coincide con la guía, pedile: "Resolvé de nuevo paso a paso y verificá reemplazando el resultado". En cuentas largas a veces se equivoca.

### Prompt 1: examen de prueba completo

```
Actuá como examinador del concurso de la ANDE. Con mis fuentes, armá un examen de prueba de 30 preguntas de selección múltiple con 4 opciones (A, B, C, D) y una sola correcta: 18 de Matemática y 12 de Castellano, repartidas entre todas las unidades del temario.
Reglas:
1. Ejercicios nuevos: usá los métodos de las guías pero con números, palabras y oraciones distintos a los ejemplos.
2. Nivel de examen de ingreso, para resolver sin calculadora.
3. Las opciones falsas tienen que salir de los "errores típicos" de las guías.
4. Verificá cada cálculo dos veces antes de fijar la respuesta correcta.
5. No muestres las respuestas.
Al final pedime que te envíe mis respuestas en el formato 1B 2C 3A. Cuando te las envíe: corregí, decime el puntaje total y por unidad, explicá paso a paso cada error y decime qué temas tengo que repasar.
```

### Prompt 2: práctica de un solo tema

```
Tomame 10 preguntas de selección múltiple solo del tema [Tanto por ciento], de fácil a difícil, con ejercicios distintos a los ejemplos de la guía. Mostrame una pregunta por vez y esperá mi respuesta. Si fallo, explicame el error paso a paso antes de pasar a la siguiente. Al final decime cuántas acerté.
```

### Prompt 3: aprender un tema desde cero

```
Explicame el tema [Racionalización de denominadores] como si no supiera nada, con palabras simples. Después mostrame 3 ejemplos resueltos paso a paso y tomame 5 ejercicios, de a uno.
```

### Prompt 4: examen solo de mis errores

```
Con los errores que tuve en esta conversación, armame un examen de 15 preguntas nuevas solo de esos temas. No muestres las respuestas hasta que te envíe las mías.
```

### Prompt 5: después de rendir el examen modelo (viernes)

```
Subí el examen modelo. Me equivoqué en las preguntas [números]. Para cada una: explicame por qué mi respuesta estaba mal y dame 2 ejercicios parecidos para practicar.
```

Otros usos: "Tarjetas didácticas" para memorizar reglas de acentuación, prefijos y fórmulas; "Resumen de audio" para escuchar las reglas de Castellano en el colectivo.

## Plan día por día

Cada tema: leer la guía (15 min), cuestionario de 10 preguntas en NotebookLM (20 min), anotar los errores en un cuaderno (5 min).

| Día | Matemática | Castellano |
|---|---|---|
| Martes (lo que quede del día) | Tema 1 Operaciones y potencias. Tema 4 Tanto por ciento. Tema 3 Regla de tres | Tema 5 Acentuación |
| Miércoles | Tema 6 Ecuaciones. Tema 7 Sistemas. Tema 8 Factorización. Tema 5 Notación científica | Tema 6 Letras dudosas. Tema 7 Puntuación |
| Jueves | Tema 2 Radicales. Tema 9 Plano cartesiano y parábolas. Tema 13 Geometría | Temas 8, 9 y 10 Clases de palabras, concordancia y verbo. Tema 11 Vicios del lenguaje |
| Viernes | Tema 10 Matrices. Tema 11 Complejos. Tema 12 Vectores y polares | Temas 1 a 4 Lectura y vocabulario |
| Viernes a la tarde | Examen modelo completo con reloj (2 h 30 min), corrección con la clave y repaso de errores | |
| Sábado | Solo la hoja de fórmulas y tu lista de errores. Nada nuevo | |

Si no alcanza el tiempo, primero van los temas base: en Matemática 1, 3, 4, 6, 7 y 13; en Castellano 5, 6, 7, 9 y 10.

## Pendiente de confirmar

- En las fotos no aparece el área 2 del temario y la unidad 1.3 Geometría queda cortada al final de la hoja. Si hay más páginas, hay que agregarlas.
- Reglas del examen (cantidad de preguntas, si se permite calculadora, si las respuestas incorrectas descuentan): revisar el instructivo oficial del concurso. Si no descuentan, no conviene dejar ninguna en blanco.
