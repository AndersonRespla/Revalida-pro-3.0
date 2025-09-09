/// <reference types="vite/client" />

// Tipagem para o custom element do ElevenLabs Convai
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'agent-id'?: string;
      theme?: 'light' | 'dark' | 'auto';
      position?: 'bottom-right' | 'bottom-left' | 'inline';
    };
  }
}