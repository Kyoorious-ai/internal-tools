# LaTeX Preview Tool

A React-based tool for previewing LaTeX rendering using KaTeX.

## Features

- **Real-time LaTeX rendering** - See your LaTeX code rendered instantly
- **Inline and block math support** - Supports both `$...$` / `\(...\)` for inline and `$$...$$` / `\[...\]` for block equations
- **Quick examples** - Pre-loaded examples to get you started
- **Clean UI** - Modern, responsive design

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Usage

1. Enter LaTeX code in the input field
2. View the rendered output in real-time
3. Use the example buttons to load sample LaTeX expressions

### Supported LaTeX Syntax

- **Inline math**: `$E = mc^2$` or `\(a + b = c\)`
- **Block math**: `$$\int_0^1 x dx$$` or `\[\sum_{i=1}^n i\]`

## Dependencies

- `katex` (v0.16.27) - LaTeX rendering engine
- `react-katex` (v3.1.0) - React wrapper for KaTeX
- `react` - React library
- `vite` - Build tool

