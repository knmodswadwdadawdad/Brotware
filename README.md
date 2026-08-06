# Brotware Studio v3

Editor visual de HTML inspirado no fluxo do Sketchware, agora com editor de lógica por blocos.

## View
- Drag & drop de widgets.
- Layouts aninhados.
- Resize por 8 handles.
- Grid/snap de 8px.
- Desktop / Tablet / Mobile.
- Propriedades de posição, tamanho, texto, cores, bordas, padding, CSS customizado e navegação.
- Undo/Redo por página.

## Páginas HTML
Cada “Activity” é uma página `.html`:
- criar;
- duplicar;
- renomear;
- excluir;
- importar HTML;
- exportar uma página ou todas.

## Event — lógica visual por blocos
A aba **Event** foi refeita para funcionar como um editor visual estilo Sketchware.

Eventos disponíveis incluem:
- `onLoad` da página;
- `onBeforeUnload`;
- `onClick`;
- `onDoubleClick`;
- `onInput`;
- `onChange`;
- `onFocus`;
- `onBlur`;
- `onKeyDown`;
- `onKeyUp`;
- mouse enter/leave.

Blocos:
- `if / else`;
- `repeat`;
- `wait`;
- abrir página/URL;
- alert;
- set text;
- set value;
- set style;
- show / hide / toggle;
- set variable;
- matemática;
- ler valor de input;
- localStorage: salvar / ler / remover;
- HTTP request com `fetch` (GET/POST/PUT/DELETE);
- chamar função;
- console log.

Os blocos podem ser arrastados para o fluxo e para dentro de `if`, `else` e `repeat`.

### Referências em valores
Os campos dos blocos aceitam:
- `$variavel` — valor de variável;
- `@value:input1` — valor de um input;
- `@text:textview1` — texto de um componente;
- números, booleanos e texto normal.

## Funções
Na aba Event, alterne de **Evento** para **Função** para criar lógicas reutilizáveis. Use o bloco `call function` para executar uma função em qualquer evento.

## Components
- Hero
- Navbar
- Card
- Login Form
- Modal
- Footer
- Pricing
- Profile
- Componentes personalizados salvos pelo usuário.

## Strings e dados
- recursos `@string/chave`;
- variáveis globais;
- localStorage;
- chamadas HTTP/API.

## Exportação
O HTML exportado inclui o runtime necessário para executar os blocos visualmente configurados, sem depender do Brotware.

## Projeto
- autosave em `localStorage`;
- exportar/importar `.brotware.json`;
- preview;
- código HTML gerado;
- funciona sem bibliotecas externas.

## Atalhos
- `Ctrl + S`: salvar
- `Ctrl + Z`: desfazer
- `Ctrl + Y`: refazer
- `Delete`: excluir widget
- Setas: mover widget 1px
- `Shift + setas`: mover 8px
