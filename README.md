# zopra — sinal, efeito e um canvas que lê o mesmo valor

![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-1.0-990000?logo=webgl&logoColor=white)

Runtime reativo pequeno, num arquivo: `signal`, `computed`, `effect`, um `h()` mínimo e um canvas WebGL que pinta a cor do mesmo sinal que o texto.

Não é Rust e não fala com GPU nativa. O uniforme do fragment shader é a parte de GPU — o bastante para ver a ideia sem toolchain.

## O que reage junto

| Peça | Papel |
|---|---|
| `signal(inicial)` | Guarda o valor. `.set`, ou `.set(fn)` no estilo `(atual) => próximo`. `.peek()` lê sem inscrever. |
| `effect(fn)` | Roda de novo quando um sinal lido dentro dele muda. Devolve a função que cancela. |
| `computed(fn)` | Outro sinal, atualizado por um efeito. |
| `h(tag, props, ...children)` | Cria o elemento. Prop função vira efeito no atributo; filho função vira nó de texto. |
| `mountFill(canvas, color)` | WebGL: um triângulo de tela cheia, uniforme `u` com o RGB que `color()` devolve. |

`hueToRgb` só converte um ângulo 0–360 em `[r, g, b]` para esse canvas. Não é um sistema de cor completo.

## Stack

- **JavaScript** em módulo ES, zero dependências
- **WebGL 1** no próprio arquivo (`precision mediump float`)
- Sem bundler, sem `npm install`

## Estrutura

```
src/
└── zopra.js            # signal, effect, computed, h, hueToRgb, mountFill
examples/
└── index.html          # slider de matiz, contador e canvas da mesma cor
```

## Como rodar

Módulo ES não abre em `file://`.

```bash
git clone https://github.com/gabrielteramae/zopra.git
cd zopra
python -m http.server
```

Abra `http://127.0.0.1:8000/examples/`. O slider muda o texto (“quente” abaixo de 50, “frio” a partir daí) e a cor do canvas ao mesmo tempo. O botão só incrementa um contador.

```js
import { computed, h, hueToRgb, mountFill, signal } from "../src/zopra.js";

const hue = signal(28);
const tone = computed(() => (hue() < 50 ? "quente" : "frio"));
mountFill(canvas, computed(() => hueToRgb(hue())));
```

## O que não tem

Não tem fila de agendamento, batching, store, componente com ciclo de vida nem suíte de testes no repositório. Se o canvas não conseguir contexto WebGL, `mountFill` devolve uma função vazia e o DOM continua.

---

© 2026 Gabriel Teramae Chan
