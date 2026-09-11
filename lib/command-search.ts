import { tools } from './tools-registry';
import { calculators } from '@/app/tools/calculators/calculators-registry';

export interface Command { name: string; href: string; category: string; keywords: string }
export const commands: Command[] = [
  {name:'All tools',href:'/',category:'Workspace',keywords:'home toolbox'},
  ...tools.map(tool => ({name:tool.name,href:`/tools/${tool.slug}`,category:tool.category,keywords:tool.keywords?.join(' ') || ''})),
  ...calculators.map(calculator => ({name:calculator.name,href:`/tools/calculators/${calculator.slug}`,category:'Calculators',keywords:calculator.description})),
];

// Prefer exact/prefix matches, then allow skipped letters ("qrg" finds QR Generator).
function scoreText(text: string, query: string): number {
  const normalized = text.toLowerCase();
  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  if (normalized.includes(query)) return 3;
  let position = -1;
  let gaps = 0;
  for (const letter of query) {
    const next = normalized.indexOf(letter,position+1);
    if (next < 0) return Infinity;
    gaps += next-position-1;
    position = next;
  }
  return 10+gaps;
}

// Match every search word; retain registry order when scores tie.
export function searchCommands(query: string): Command[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return commands;
  return commands.map(command => ({command,score:words.reduce((total,word) => total + Math.min(
    scoreText(command.name,word),scoreText(command.category,word)+20,
    command.keywords.toLowerCase().includes(word) ? 25 : Infinity),0)}))
    .filter(match => Number.isFinite(match.score)).sort((a,b) => a.score-b.score).map(match => match.command);
}
