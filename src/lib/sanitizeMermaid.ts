export function sanitizeMermaid(code: string): string {
  if (!code) return '';
  
  // Clean up LLM markdown artifacts if they exist
  let cleanCode = code.trim();
  if (cleanCode.startsWith('```mermaid')) {
    cleanCode = cleanCode.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '');
  } else if (cleanCode.startsWith('```')) {
    cleanCode = cleanCode.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Remove numbered lists that LLMs sometimes hallucinate
  cleanCode = cleanCode.replace(/^\d+\.\s*/gm, '');

  // Sanitize node labels to prevent parsing errors like 'TAGEND' (e.g. A[User] -->|Login| B[Auth Service])
  cleanCode = cleanCode.replace(/\[([^\]]+)\]/g, (match, p1) => {
     if (p1.startsWith('"') && p1.endsWith('"')) {
         const inner = p1.slice(1, -1).replace(/[<>]/g, '');
         return `["${inner}"]`;
     }
     const sanitized = p1.replace(/[<>"]/g, '');
     return `["${sanitized}"]`;
  });
  
  // Sanitize arrow labels |Label| to remove < > just in case
  cleanCode = cleanCode.replace(/\|([^\|]+)\|/g, (match, p1) => {
       const sanitized = p1.replace(/[<>]/g, '');
       return `|${sanitized}|`;
  });
  
  // Remove stray > characters right after a label pipe
  cleanCode = cleanCode.replace(/\|>/g, '| ');

  // Fix invalid flowchart arrows that LLMs hallucinate from sequence diagrams
  cleanCode = cleanCode.replace(/->>/g, '-->');
  cleanCode = cleanCode.replace(/=>/g, '==>');
  cleanCode = cleanCode.replace(/([^->=])->([^->=])/g, '$1-->$2');

  return cleanCode;
}
