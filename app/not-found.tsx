import Link from 'next/link';
export default function NotFound() { return <div className="page"><div className="eyebrow">404</div><h1>That tool isn’t here.</h1><p className="intro">Head back to your workspace to find an available tool.</p><Link className="primary-button" href="/">Back to all tools</Link></div>; }
