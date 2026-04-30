// CSS Modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Global CSS imports (for side-effect imports)
declare module '*.css';

// SCSS Modules
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// SCSS Global
declare module '*.scss';

// SASS Modules
declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

// SASS Global
declare module '*.sass';