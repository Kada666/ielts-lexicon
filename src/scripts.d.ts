declare module '*.mjs' {
  export function convertMarkdown(markdown: string, notebooks?: {list: number; markdown: string}[]): {words: import('./types').Word[];pending: import('./types').Word[];issues:string[]};
}
