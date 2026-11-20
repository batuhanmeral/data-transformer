export function HtmlFrame({ html }: { html: string }) {
  return <iframe title="HTML output" sandbox="" srcDoc={html} className="block h-full w-full bg-white" />;
}
